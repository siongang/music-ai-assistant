"""
Local filesystem storage implementation.

This module provides a local filesystem-based storage implementation
for managing job files and directories.
"""
from pathlib import Path
import shutil
import logging
from typing import BinaryIO

from .base import Storage
from app.core.constants import JOBS_DIR, AUDIO_DIR, STEMS_DIR

logger = logging.getLogger(__name__)


class LocalStorage(Storage):
    """
    Local filesystem storage implementation.
    
    Manages file storage on the local filesystem. Files are organized as:
    {root}/jobs/{job_id}/input/{filename}  - Input audio files
    {root}/jobs/{job_id}/stems/            - Separated stem files
    """
    
    def __init__(self, root: Path):
        """
        Initialize local storage.
        
        Args:
            root: Root directory for all storage operations
        """
        self.root = Path(root)
        logger.debug(f"Initialized LocalStorage with root: {self.root}")

    def job_path(self, job_id: str) -> Path:
        """
        Get the path for a job directory.
        
        Creates the directory if it doesn't exist.
        
        Args:
            job_id: Job identifier (UUID string)
            
        Returns:
            Path to the job directory: {root}/jobs/{job_id}
        """
        path = self.root / JOBS_DIR / str(job_id)
        path.mkdir(parents=True, exist_ok=True)
        return path

    def audio_path(self, audio_id: str) -> Path:
        """
        Get the path for an audio file directory.
        
        Creates the directory if it doesn't exist.
        
        Args:
            audio_id: Audio identifier (UUID string)
            
        Returns:
            Path to the audio directory: {root}/audio/{audio_id}
        """
        path = self.root / AUDIO_DIR / str(audio_id)
        path.mkdir(parents=True, exist_ok=True)
        return path

    def save_audio_file(self, audio_id: str, file: BinaryIO, filename: str) -> Path:
        """
        Save an uploaded audio file to the audio storage directory.
        
        This method handles saving uploaded files from HTTP requests
        to the appropriate audio directory.
        
        Args:
            audio_id: Audio identifier
            file: File-like object to save (from UploadFile.file)
            filename: Original filename
            
        Returns:
            Path to the saved file
            
        Raises:
            IOError: If file cannot be written
        """
        audio_path = self.audio_path(audio_id)
        file_path = audio_path / filename
        logger.debug(f"Saving audio file {filename} for audio {audio_id} to {file_path}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file, buffer)
        
        logger.info(f"Audio file saved: {file_path}")
        return file_path

    def get_audio_file_path(self, audio_id: str, filename: str) -> Path:
        """
        Get the path to an audio file.
        
        Args:
            audio_id: Audio identifier
            filename: Filename
            
        Returns:
            Path to the audio file
        """
        return self.audio_path(audio_id) / filename

