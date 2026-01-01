"""
Celery tasks for job processing.

This module contains Celery tasks for asynchronous audio job processing.
"""
from pathlib import Path
import logging
from uuid import UUID
from typing import Dict, Any

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.services.job_service import JobService
from app.services.pipeline_runner_service import PipelineRunnerService
from app.storage.local_storage import LocalStorage
from app.core.constants import (
    AUDIO_EXTENSIONS,
    STEMS_DIR,
    DEFAULT_STEM_FORMAT,
    JobStatus,
    STORAGE_ROOT,
)

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    name="process_audio_job",
    autoretry_for=(ConnectionError, TimeoutError, IOError),
    retry_backoff=True,
    retry_backoff_max=600,
    max_retries=3
)
def process_audio_job(self, job_id: str) -> Dict[str, Any]:
    """
    Process an audio job asynchronously.
    
    This Celery task:
    1. Updates job status to "processing"
    2. Finds the input audio file
    3. Runs the separation pipeline
    4. Updates job status to "completed" or "failed"
    
    Args:
        job_id: UUID string of the job to process
        
    Returns:
        dict: Result with status and optional error message
    """
    # Validate job_id format
    try:
        job_uuid = UUID(job_id)
    except ValueError:
        error_msg = f"Invalid job_id format: {job_id}"
        logger.error(error_msg)
        return {"status": "failed", "error": error_msg}
    
    logger.info(f"Processing job: {job_id}")
    
    # Create database session for this task
    db = SessionLocal()
    try:
        job_service = JobService(db)
        storage = LocalStorage(root=Path(STORAGE_ROOT))
        pipeline_runner = PipelineRunnerService(storage)
        
        # Update job status to processing
        job_service.update_job_status(job_uuid, JobStatus.PROCESSING)
        
        # Prepare directories
        job_path = storage.job_path(job_id)
        input_path = job_path / "input"
        stems_path = job_path / STEMS_DIR
        
        # Ensure directories exist
        input_path.mkdir(parents=True, exist_ok=True)
        stems_path.mkdir(parents=True, exist_ok=True)
        
        # Find audio file in input directory
        audio_files = [
            f for f in input_path.iterdir() 
            if f.is_file() and f.suffix.lower() in AUDIO_EXTENSIONS
        ]
        
        if not audio_files:
            error_msg = f"No audio file found in {input_path}"
            logger.error(error_msg)
            job_service.update_job_status(
                job_uuid, 
                JobStatus.FAILED, 
                error_message=error_msg
            )
            return {"status": "failed", "error": error_msg}
        
        # Process the first audio file found
        audio_file = audio_files[0]
        logger.info(f"Found audio file: {audio_file}")
        
        # Run pipeline - this separates the audio and saves stems
        try:
            pipeline_runner.run(audio_file, stems_path, DEFAULT_STEM_FORMAT)
            
            # Update job status to completed
            job_service.update_job_status(job_uuid, JobStatus.COMPLETED)
            logger.info(f"Job {job_id} completed successfully")
            return {"status": "completed"}
            
        except Exception as e:
            # Update job status to failed
            error_msg = str(e)
            logger.error(f"Job {job_id} failed: {error_msg}", exc_info=True)
            job_service.update_job_status(
                job_uuid, 
                JobStatus.FAILED, 
                error_message=error_msg
            )
            return {"status": "failed", "error": error_msg}
            
    except Exception as e:
        # Handle unexpected errors (e.g., database connection issues during initialization)
        error_msg = f"Unexpected error processing job {job_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        
        # Try to update job status with a new database session
        # This handles cases where the original session failed to initialize
        error_db = None
        try:
            error_db = SessionLocal()
            error_job_service = JobService(error_db)
            error_job_service.update_job_status(
                job_uuid, 
                JobStatus.FAILED, 
                error_message=error_msg
            )
        except Exception as update_error:
            logger.error(
                f"Failed to update job status after error: {update_error}",
                exc_info=True
            )
        finally:
            if error_db:
                error_db.close()
        
        raise  # Re-raise to let Celery handle retries if configured
    finally:
        db.close()

