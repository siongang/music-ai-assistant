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
    JobStatus,
    JobType,
    STORAGE_ROOT,
)
from app.services.audio_service import AudioService

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
    1. Loads job from database
    2. Validates audio_id exists
    3. Updates job status to "running"
    4. Routes to appropriate processor based on job type
    5. Updates job status to "succeeded" or "failed"
    
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
        audio_service = AudioService(db)
        storage = LocalStorage(root=Path(STORAGE_ROOT))
        
        # Get job from database
        job = job_service.get_job(job_uuid)
        if not job:
            error_msg = f"Job {job_id} not found"
            logger.error(error_msg)
            return {"status": "failed", "error": error_msg}
        
        # Get audio_id from job input
        audio_id_str = job.input.get("audio_id")
        if not audio_id_str:
            error_msg = f"Job {job_id} missing audio_id in input"
            logger.error(error_msg)
            job_service.update_job_status(
                job_uuid,
                JobStatus.FAILED,
                error_message=error_msg
            )
            return {"status": "failed", "error": error_msg}
        
        # Validate audio exists
        try:
            audio_id = UUID(audio_id_str)
        except ValueError:
            error_msg = f"Invalid audio_id format: {audio_id_str}"
            logger.error(error_msg)
            job_service.update_job_status(
                job_uuid,
                JobStatus.FAILED,
                error_message=error_msg
            )
            return {"status": "failed", "error": error_msg}
        
        # Get audio file path directly
        audio_file_path = audio_service.get_audio_path(audio_id)
        if not audio_file_path:
            error_msg = f"Audio {audio_id} not found"
            logger.error(error_msg)
            job_service.update_job_status(
                job_uuid,
                JobStatus.FAILED,
                error_message=error_msg
            )
            return {"status": "failed", "error": error_msg}
        
        if not audio_file_path.exists():
            error_msg = f"Audio file not found: {audio_file_path}"
            logger.error(error_msg)
            job_service.update_job_status(
                job_uuid,
                JobStatus.FAILED,
                error_message=error_msg
            )
            return {"status": "failed", "error": error_msg}
        
        # Update job status to running
        job_service.update_job_status(job_uuid, JobStatus.RUNNING, progress=0.0)
        
        # Route to appropriate processor based on job type
        try:
            if job.type == JobType.STEM_SEPARATION:
                result = _process_stem_separation(
                    job_uuid, job_service, storage, audio_file_path, job.params
                )
            elif job.type == JobType.MELODY_EXTRACTION:
                result = _process_melody_extraction(
                    job_uuid, job_service, storage, audio_file_path, job.params
                )
            elif job.type == JobType.CHORD_ANALYSIS:
                result = _process_chord_analysis(
                    job_uuid, job_service, storage, audio_file_path, job.params
                )
            else:
                error_msg = f"Unknown job type: {job.type}"
                logger.error(error_msg)
                job_service.update_job_status(
                    job_uuid,
                    JobStatus.FAILED,
                    error_message=error_msg
                )
                return {"status": "failed", "error": error_msg}
            
            if result["status"] == "succeeded":
                logger.info(f"Job {job_id} completed successfully")
            else:
                logger.error(f"Job {job_id} failed: {result.get('error', 'Unknown error')}")
            
            return result
            
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


def _process_stem_separation(
    job_id: UUID,
    job_service: JobService,
    storage: LocalStorage,
    audio_file_path: Path,
    params: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Process a stem separation job.
    
    Args:
        job_id: Job UUID
        job_service: JobService instance
        storage: Storage instance
        audio_file_path: Path to input audio file
        params: Job parameters
        
    Returns:
        dict: Result with status and output data
    """
    # Process stem separation using service
    pipeline_runner = PipelineRunnerService(storage)
    output_files = pipeline_runner.process_stem_separation(
        audio_file_path=audio_file_path,
        job_id=str(job_id),
        params=params
    )
    
    # Update job status to succeeded with output
    job_service.update_job_status(
        job_id,
        JobStatus.SUCCEEDED,
        progress=1.0,
        output=output_files
    )
    
    return {"status": "succeeded", "output": output_files}


def _process_melody_extraction(
    job_id: UUID,
    job_service: JobService,
    storage: LocalStorage,
    audio_file_path: Path,
    params: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Process a melody extraction job.
    
    Args:
        job_id: Job UUID
        job_service: JobService instance
        storage: Storage instance
        audio_file_path: Path to input audio file
        params: Job parameters
        
    Returns:
        dict: Result with status and output data
    """
    try:
        # Process melody extraction using service
        pipeline_runner = PipelineRunnerService(storage)
        output_files = pipeline_runner.process_melody_extraction(
            audio_file_path=audio_file_path,
            job_id=str(job_id),
            params=params
        )
        
        # Update job status to succeeded with output
        job_service.update_job_status(
            job_id,
            JobStatus.SUCCEEDED,
            progress=1.0,
            output=output_files
        )
        
        return {"status": "succeeded", "output": output_files}
    except NotImplementedError as e:
        error_msg = str(e)
        logger.warning(f"Melody extraction not implemented: {error_msg}")
        job_service.update_job_status(
            job_id,
            JobStatus.FAILED,
            error_message=error_msg
        )
        return {"status": "failed", "error": error_msg}


def _process_chord_analysis(
    job_id: UUID,
    job_service: JobService,
    storage: LocalStorage,
    audio_file_path: Path,
    params: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Process a chord analysis job.
    
    Args:
        job_id: Job UUID
        job_service: JobService instance
        storage: Storage instance
        audio_file_path: Path to input audio file
        params: Job parameters
        
    Returns:
        dict: Result with status and output data
    """
    try:
        # Process chord analysis using service
        pipeline_runner = PipelineRunnerService(storage)
        output_files = pipeline_runner.process_chord_analysis(
            audio_file_path=audio_file_path,
            job_id=str(job_id),
            params=params
        )
        
        # Update job status to succeeded with output
        job_service.update_job_status(
            job_id,
            JobStatus.SUCCEEDED,
            progress=1.0,
            output=output_files
        )
        
        return {"status": "succeeded", "output": output_files}
    except NotImplementedError as e:
        error_msg = str(e)
        logger.warning(f"Chord analysis not implemented: {error_msg}")
        job_service.update_job_status(
            job_id,
            JobStatus.FAILED,
            error_message=error_msg
        )
        return {"status": "failed", "error": error_msg}

