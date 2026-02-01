"""
Audio Pydantic schemas for API request/response validation.

These schemas define the structure of audio data for API endpoints.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class AudioResponse(BaseModel):
    """Schema for audio upload response. project_id is always set (audio is project-owned)."""
    audio_id: UUID
    filename: str
    project_id: UUID

    class Config:
        from_attributes = True


class AudioMetadataResponse(BaseModel):
    """Schema for GET project audio metadata."""
    audio_id: UUID
    filename: str
    file_path: str
    project_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

