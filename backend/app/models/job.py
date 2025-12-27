"""
Job database model.

This module defines the Job model which represents an audio processing job
in the database.
"""
import uuid
from sqlalchemy import Column, String, DateTime, Text, TypeDecorator
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
    Job model representing an audio processing job.
    
    Each job represents a single audio file processing task:
    - pending: Job created, waiting to be processed
    - processing: Job is currently being processed
    - completed: Job completed successfully
    - failed: Job failed with an error
    
    Attributes:
        id: Unique identifier (UUID)
        status: Current job status
        error_message: Error message if job failed
        created_at: Timestamp when job was created
        updated_at: Timestamp when job was last updated
    """
    __tablename__ = "jobs"

    # Primary key: UUID (works with both PostgreSQL and SQLite)
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    
    # Job status: "pending", "processing", "completed", or "failed"
    status = Column(String, nullable=False, default="pending")
    
    # Error message if job failed
    error_message = Column(Text, nullable=True)
    
    # Timestamps (automatically managed by database)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())