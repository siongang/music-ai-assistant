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
from app.core.constants import JOBS_DIR, INPUT_DIR, STEMS_DIR

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

    def input_audio_path(self, job_id: str, filename: str) -> Path:
        """
        Get the path where input audio file should be saved.
        
        Args:
            job_id: Job identifier
            filename: Original filename
            
        Returns:
            Path to where the input file should be saved:
            {root}/jobs/{job_id}/input/{filename}
        """
        job_path = self.job_path(job_id)
        input_path = job_path / INPUT_DIR
        input_path.mkdir(parents=True, exist_ok=True)
        return input_path / filename

    def save_input_file(self, job_id: str, file: BinaryIO, filename: str) -> Path:
        """
        Save an uploaded file to the job's input directory.
        
        This method handles saving uploaded files from HTTP requests
        to the appropriate job directory.
        
        Args:
            job_id: Job identifier
            file: File-like object to save (from UploadFile.file)
            filename: Original filename
            
        Returns:
            Path to the saved file
            
        Raises:
            IOError: If file cannot be written
        """
        file_path = self.input_audio_path(job_id, filename)
        logger.debug(f"Saving file {filename} for job {job_id} to {file_path}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file, buffer)
        
        logger.info(f"File saved: {file_path}")
        return file_path

