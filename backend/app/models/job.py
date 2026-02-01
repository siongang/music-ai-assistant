"""
Job database model.

This module defines the Job model which represents an audio processing job
in the database.
"""
import uuid
from sqlalchemy import Column, String, DateTime, Text, TypeDecorator, JSON, Float, ForeignKey
from sqlalchemy.sql import func

from app.db.base import Base


class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    Uses PostgreSQL's UUID type when available, otherwise uses String.
    """
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID
            return dialect.type_descriptor(UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            # PostgreSQL UUID type accepts UUID objects directly
            return value
        else:
            # For SQLite and others, convert to string
            if not isinstance(value, str):
                return str(value)
            return value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            return uuid.UUID(value) if isinstance(value, str) else value


class Job(Base):
    """
    Job model: an audio processing job owned by a project.

    Projects own jobs; jobs cannot exist without a project.
    Jobs reference inputs (e.g. audio_id) and produce outputs under the project;
    they never own data. Deleting a project cascades to its jobs.

    Job lifecycle:
    - queued: Job created, waiting to be processed
    - running: Job is currently being processed
    - succeeded: Job completed successfully
    - failed: Job failed with an error

    Attributes:
        id: Unique identifier (UUID)
        project_id: Project that owns this job (required)
        type: Job type (e.g., "stem_separation", "melody_extraction")
        status: Current job status
        input: JSON object containing input data (e.g., {"audio_id": "..."})
        params: JSON object containing job parameters (e.g., {"model": "demucs_v4"})
        output: JSON object containing output data (e.g., {"vocals": "...", "drums": "..."})
        progress: Progress value (0.0 to 1.0)
        error_message: Error message if job failed
        created_at: Timestamp when job was created
        updated_at: Timestamp when job was last updated
    """
    __tablename__ = "jobs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="queued")
    input = Column(JSON, nullable=False)
    params = Column(JSON, nullable=True)
    output = Column(JSON, nullable=True)
    progress = Column(Float, nullable=True, default=0.0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())