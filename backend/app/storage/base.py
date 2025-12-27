"""
Storage abstraction base class.

This module defines the abstract base class for storage implementations.
Different storage backends (local filesystem, S3, etc.) can implement
this interface.
"""
from abc import ABC, abstractmethod
from pathlib import Path


class Storage(ABC):
    """
    Abstract base class for storage implementations.
    
    This class defines the interface that all storage implementations
    must follow. This allows the application to work with different
    storage backends (local filesystem, cloud storage, etc.) without
    changing the rest of the code.
    """
    
    @abstractmethod
    def job_path(self, job_id: str) -> Path:
        """
        Get the path for a job directory.
        
        Args:
            job_id: Job identifier
            
        Returns:
            Path to the job directory
        """
        pass