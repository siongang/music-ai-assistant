"""Session model for agent conversations."""
import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.job import GUID  # Reuse GUID type


class Session(Base):
    """
    Session model for agent conversations.
    
    Each session represents a conversation thread with the agent.
    
    **Beta Design: One primary audio per session**
    - Each session is scoped to a single primary audio file
    - The primary_audio_id is stored in metadata
    - All conversation actions implicitly refer to this audio
    - To work with a different audio, create a new session
    
    Sessions can be associated with users (future) and store metadata.
    """
    __tablename__ = "sessions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    
    # Future: Link to user when auth is implemented
    user_id = Column(GUID(), nullable=True)
    
    # Session metadata
    # Expected structure:
    # {
    #   "primary_audio_id": "uuid-string",
    #   "primary_audio_filename": "song.mp3",
    #   ... other metadata
    # }
    session_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
