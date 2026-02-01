"""
Audio database model.

This module defines the Audio model which represents uploaded audio files
in the database.
"""
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.job import GUID


class Audio(Base):
    """
    Audio model: an uploaded audio file owned by a project.

    Projects own audio; audio cannot exist without a project.
    Deleting a project cascades to its audio.

    Attributes:
        id: Unique identifier (UUID)
        project_id: Project that owns this audio (required)
        filename: Original filename
        file_path: Path to the stored file
        created_at: Timestamp when audio was uploaded
        updated_at: Timestamp when audio was last updated
    """
    __tablename__ = "audio"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

