"""
Audio Pydantic schemas for API request/response validation.

These schemas define the structure of audio data for API endpoints.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class AudioResponse(BaseModel):
    """
    Schema for audio upload response data.
    
    Used when returning audio information from API endpoints.
    """
    audio_id: UUID
    filename: str

    class Config:
        # Allow creating from SQLAlchemy models
        from_attributes = True

