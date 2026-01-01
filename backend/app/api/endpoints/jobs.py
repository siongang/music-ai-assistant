"""
Jobs API endpoints.

This module provides HTTP endpoints for job management:
- POST /jobs: Create a new job and upload audio file
- GET /jobs/{job_id}: Get job status by ID
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from pathlib import Path
import logging

from app.db.session import get_db
from app.services.job_service import JobService
from app.storage.local_storage import LocalStorage
from app.schemas.job import JobResponse
from app.core.constants import STORAGE_ROOT
from app.tasks.job_tasks import process_audio_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_job_service(db: Session = Depends(get_db)) -> JobService:
    """
    Dependency for getting JobService instance.
    
    FastAPI will automatically call this function for each request,
    creating a new JobService instance tied to the request's database session.
    """
    return JobService(db)


def get_storage() -> LocalStorage:
    """
    Dependency for getting LocalStorage instance.
    
    Creates a storage instance for file operations.
    In the future, this could be configured via environment variables.
    """
    return LocalStorage(root=Path(STORAGE_ROOT))


@router.post("", response_model=JobResponse, status_code=http_status.HTTP_201_CREATED)
def create_job(
    file: UploadFile = File(...),
    job_service: JobService = Depends(get_job_service),
    storage: LocalStorage = Depends(get_storage)
):
    """
    Create a new job and upload the audio file.
    
    This endpoint:
    1. Generates a unique job ID
    2. Creates a job record in the database with status "pending"
    3. Saves the uploaded audio file to the job's input directory
    4. Returns the job information
    
    The uploaded file is saved to: {storage_root}/jobs/{job_id}/input/{filename}
    
    Args:
        file: Uploaded audio file
        job_service: Injected JobService instance
        storage: Injected LocalStorage instance
        
    Returns:
        JobResponse with job details
        
    Raises:
        HTTPException: If file save fails (500) or validation fails
    """
    job_id = uuid4()
    logger.info(f"Creating new job: {job_id}")
    
    # Create job in database with "pending" status
    job = job_service.create_job(job_id, status="pending")
    logger.debug(f"Job {job_id} created in database")
    
    # Save uploaded file to storage
    try:
        file_path = storage.save_input_file(
            job_id=str(job_id),
            file=file.file,
            filename=file.filename
        )
        logger.info(f"File saved for job {job_id}: {file_path}")
        
        # Enqueue job for processing with Celery
        try:
            process_audio_job.delay(str(job_id))
            logger.info(f"Job {job_id} enqueued for processing")
        except Exception as e:
            # Log error but don't fail the request - job is created and file is saved
            # Job will remain in "pending" status and can be manually retried or processed later
            logger.error(
                f"Failed to enqueue job {job_id} for processing: {e}",
                exc_info=True
            )
            # Note: We don't update job status here because the job is valid,
            # just the queue system is temporarily unavailable
        
        return JobResponse.model_validate(job)
    except Exception as e:
        # Update job status to failed if file save fails
        logger.error(f"Failed to save file for job {job_id}: {e}")
        job_service.update_job_status(job_id, "failed", error_message=str(e))
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: UUID,
    job_service: JobService = Depends(get_job_service)
):
    """
    Get job status by ID.
    
    Args:
        job_id: UUID of the job to retrieve
        job_service: Injected JobService instance
        
    Returns:
        JobResponse with job details
        
    Raises:
        HTTPException: If job not found (404)
    """
    logger.debug(f"Fetching job: {job_id}")
    job = job_service.get_job(job_id)
    
    if not job:
        logger.warning(f"Job {job_id} not found")
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    
    return JobResponse.model_validate(job)
