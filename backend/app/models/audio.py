"""
Audio database model.

This module defines the Audio model which represents uploaded audio files
in the database.
"""
import uuid
from sqlalchemy import Column, String, DateTime, TypeDecorator
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.job import GUID


class Audio(Base):
    """
    Audio model representing an uploaded audio file.
    
    Each audio file can be used by multiple jobs without re-uploading.
    
    Attributes:
        id: Unique identifier (UUID)
        filename: Original filename
        file_path: Path to the stored file
        created_at: Timestamp when audio was uploaded
        updated_at: Timestamp when audio was last updated
    """
    __tablename__ = "audio"

    # Primary key: UUID (works with both PostgreSQL and SQLite)
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    
    # Original filename
    filename = Column(String, nullable=False)
    
    # Path to the stored file (relative to storage root)
    file_path = Column(String, nullable=False)
    
    # Timestamps (automatically managed by database)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

