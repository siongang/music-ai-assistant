"""
Audio Session model for timeline/playback state.

Stores track arrangements, clip positions, and mix settings.
"""
import uuid
from sqlalchemy import Column, String, DateTime, JSON, Float, ForeignKey
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.job import GUID


class AudioSession(Base):
    """
    Audio Session model: timeline and playback configuration.
    
    Stores the arrangement of tracks and clips for a project,
    including mix settings (gain, pan, mute, solo).
    
    Attributes:
        id: Unique identifier (UUID)
        project_id: Project that owns this session (required)
        name: Session name
        tracks: JSON array of track configurations
        master_gain: Master output gain (0.0 to 2.0)
        created_at: Timestamp when session was created
        updated_at: Timestamp when session was last updated
    """
    __tablename__ = "audio_sessions"
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False, default="Untitled Session")
    
    # Track data structure:
    # [
    #   {
    #     "id": "track-uuid",
    #     "name": "Track 1",
    #     "audioObjectId": "object-uuid",
    #     "gain": 1.0,
    #     "pan": 0.0,
    #     "mute": false,
    #     "solo": false,
    #     "clips": [
    #       {
    #         "id": "clip-uuid",
    #         "assetId": "audio-uuid",
    #         "start": 0.0,
    #         "in": 0.0,
    #         "duration": 10.5,
    #         "playbackRate": 1.0
    #       }
    #     ]
    #   }
    # ]
    tracks = Column(JSON, nullable=False, default=list)
    
    master_gain = Column(Float, nullable=False, default=1.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
