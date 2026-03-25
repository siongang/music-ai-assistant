"""
Artifact database model.

An artifact is any named, typed file produced or consumed by the pipeline.
Every file a job produces must have an ArtifactRecord.
Parent artifact lineage enables full provenance tracking.
"""
import uuid
from sqlalchemy import Column, String, DateTime, Integer, Text, JSON, ForeignKey
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.job import GUID  # reuse the platform-independent UUID type


class Artifact(Base):
    """
    Artifact: a file produced or consumed by the music processing pipeline.

    Lineage:
        source audio upload  →  no parent
        stem separation      →  parent = source audio artifact
        midi transcription   →  parent = stem audio artifact (ideally)

    Attributes:
        id:                   Unique identifier (UUID)
        type:                 ArtifactType enum value as string
        project_id:           Owning project
        producing_job_id:     Job that created this artifact (null for source uploads)
        parent_artifact_id:   Input artifact this was derived from (null for source uploads)
        storage_path:         Relative path from storage root
        file_size_bytes:      File size in bytes (if known)
        artifact_metadata:    JSON — confidence, model info, type-specific fields
        created_at:           Creation timestamp
    """
    __tablename__ = "artifacts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    producing_job_id = Column(GUID(), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    parent_artifact_id = Column(GUID(), nullable=True)
    storage_path = Column(Text, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    artifact_metadata = Column("metadata", JSON, nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
