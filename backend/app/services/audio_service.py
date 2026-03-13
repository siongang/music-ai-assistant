"""
Audio service for database operations.

This service handles all database operations related to audio files,
including creation and retrieval.
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from pathlib import Path
import logging

from app.models.audio import Audio
from app.storage.local_storage import LocalStorage
from app.core.constants import STORAGE_ROOT

logger = logging.getLogger(__name__)


class AudioService:
    """
    Service for audio database operations.
    
    Provides methods for creating and retrieving audio records
    in the database. This service encapsulates all audio-related
    database logic.
    """
    
    def __init__(self, db: Session, storage: Optional[LocalStorage] = None):
        """
        Initialize audio service.
        
        Args:
            db: Database session for operations
            storage: Optional storage instance (creates default if not provided)
        """
        self.db = db
        self.storage = storage or LocalStorage(root=Path(STORAGE_ROOT))

    def create_audio(
        self,
        audio_id: UUID,
        filename: str,
        file_path: str,
        project_id: UUID,
        converted_file_path: Optional[str] = None,
        original_format: Optional[str] = None,
        duration: Optional[float] = None,
        sample_rate: Optional[int] = None,
        channels: Optional[int] = None,
    ) -> Audio:
        """
        Create a new audio record in the database. Project must exist; project owns the audio.

        Args:
            audio_id: Unique identifier for the audio
            filename: Original filename
            file_path: Path to the stored file (relative to storage root)
            project_id: Project that owns this audio (required)
            converted_file_path: Path to converted WAV file (optional)
            original_format: Original file extension (optional)
            duration: Duration in seconds (optional)
            sample_rate: Sample rate in Hz (optional)
            channels: Number of audio channels (optional)

        Returns:
            Created Audio object
        """
        audio = Audio(
            id=audio_id,
            filename=filename,
            file_path=file_path,
            project_id=project_id,
            converted_file_path=converted_file_path,
            original_format=original_format,
            duration=duration,
            sample_rate=sample_rate,
            channels=channels,
        )
        self.db.add(audio)
        self.db.commit()
        self.db.refresh(audio)
        logger.debug(f"Created audio: {audio_id} with filename: {filename}")
        return audio

    def get_audio(self, audio_id: UUID) -> Optional[Audio]:
        """
        Get an audio record by ID (for metadata access).
        
        Use get_audio_path() if you only need the file path.
        
        Args:
            audio_id: UUID of the audio to retrieve
            
        Returns:
            Audio object if found, None otherwise
        """
        return self.db.query(Audio).filter(Audio.id == audio_id).first()
    
    def get_audio_path(self, audio_id: UUID) -> Optional[Path]:
        """
        Get the file path for an audio file.
        
        This is the primary method for getting audio file locations.
        Returns the full path to the audio file if it exists.
        
        Args:
            audio_id: UUID of the audio to retrieve
            
        Returns:
            Path to the audio file if found, None otherwise
        """
        audio = self.get_audio(audio_id)
        if not audio:
            return None
        
        return self.storage.get_audio_file_path(str(audio_id), audio.filename)

    def list_audio(
        self,
        project_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Audio]:
        """List audio records for a project. Newest first."""
        return (
            self.db.query(Audio)
            .filter(Audio.project_id == project_id)
            .order_by(Audio.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )