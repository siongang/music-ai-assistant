"""
Input fetching utility for jobs.

This module provides functionality to fetch input audio files from various
sources (local filesystem, HTTP URLs, cloud storage, etc.).

NOTE: This is currently not used but reserved for future functionality when
the Job model includes input_path or input_url fields.
"""
from pathlib import Path
import shutil
import requests
import logging

logger = logging.getLogger(__name__)


def fetch_input(job, storage, filename: str = None) -> Path:
    """
    Fetch input audio file for a job from various sources.
    
    This function supports multiple input sources:
    - Local filesystem path (job.input_path)
    - HTTP/HTTPS URL (job.input_url)
    - Future: Cloud storage URLs (S3, Azure Blob, etc.)
    
    Args:
        job: Job object (must have input_path or input_url attribute)
        storage: Storage instance for saving the file
        filename: Optional filename override
        
    Returns:
        Path to the fetched input file
        
    Raises:
        ValueError: If job has no input source defined
        FileNotFoundError: If local file doesn't exist
        requests.RequestException: If URL fetch fails
        
    Note:
        This function requires the Job model to have input_path or input_url
        fields. Currently, these fields don't exist in the Job model, so this
        function is reserved for future use.
    """
    # Get the target path where input should be saved
    if filename:
        input_path = storage.input_audio_path(str(job.id), filename)
    else:
        # Default filename if not provided
        input_path = storage.input_audio_path(str(job.id), "input_audio")
    
    # Handle local filesystem path
    if hasattr(job, 'input_path') and job.input_path:
        logger.info(f"Fetching input from local path: {job.input_path}")
        shutil.copy(job.input_path, input_path)
        return input_path

    # Handle HTTP/HTTPS URL
    if hasattr(job, 'input_url') and job.input_url:
        logger.info(f"Fetching input from URL: {job.input_url}")
        input_path.parent.mkdir(parents=True, exist_ok=True)
        with requests.get(job.input_url, stream=True) as r:
            r.raise_for_status()
            with input_path.open("wb") as f:
                for chunk in r.iter_content(8192):
                    if chunk:
                        f.write(chunk)
        return input_path

    raise ValueError("Job has no input source (input_path or input_url)")
