"""
Jobs API endpoints.

This module provides HTTP endpoints for job management:
- POST /jobs: Create a new job
- GET /jobs/{job_id}: Get job status by ID
"""
from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
import logging

from app.db.session import get_db
from app.services.job_service import JobService
from app.services.audio_service import AudioService
from app.schemas.job import JobResponse, JobCreate
from app.core.constants import JobType
from app.tasks.job_tasks import process_audio_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _build_job_response(job) -> JobResponse:
    """
    Build a JobResponse from a Job model.
    
    Helper function to avoid code duplication between create_job and get_job.
    
    Args:
        job: Job model instance
        
    Returns:
        JobResponse instance
    """
    # Extract audio_id from input for response
    extracted_audio_id = UUID(job.input.get("audio_id"))
    
    # Convert job to response format
    response_data = {
        "job_id": job.id,
        "type": job.type,
        "status": job.status,
        "audio_id": extracted_audio_id,
        "input": job.input,
        "params": job.params,
        "output": job.output,
        "progress": job.progress,
        "error_message": job.error_message,
        "created_at": job.created_at,
        "updated_at": job.updated_at
    }
    return JobResponse(**response_data)


def get_job_service(db: Session = Depends(get_db)) -> JobService:
    """
    Dependency for getting JobService instance.
    
    FastAPI will automatically call this function for each request,
    creating a new JobService instance tied to the request's database session.
    """
    return JobService(db)


def get_audio_service(db: Session = Depends(get_db)) -> AudioService:
    """
    Dependency for getting AudioService instance.
    
    FastAPI will automatically call this function for each request,
    creating a new AudioService instance tied to the request's database session.
    """
    return AudioService(db)


@router.post("", response_model=JobResponse, status_code=http_status.HTTP_201_CREATED)
def create_job(
    job_data: JobCreate,
    job_service: JobService = Depends(get_job_service),
    audio_service: AudioService = Depends(get_audio_service)
):
    """
    Create a new job.
    
    This endpoint:
    1. Validates the audio_id exists
    2. Validates the job type
    3. Generates a unique job ID
    4. Creates a job record in the database with status "queued"
    5. Enqueues the job for processing
    6. Returns the job information
    
    Args:
        job_data: Job creation data (type, input, params)
        job_service: Injected JobService instance
        audio_service: Injected AudioService instance
        
    Returns:
        JobResponse with job details
        
    Raises:
        HTTPException: If audio_id not found (404) or validation fails (400)
    """
    # Validate audio_id exists and get path
    audio_id = job_data.input.audio_id
    audio_path = audio_service.get_audio_path(audio_id)
    if not audio_path:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Audio with id {audio_id} not found"
        )
    
    # Validate job type
    valid_types = [
        JobType.STEM_SEPARATION, 
        JobType.MIDI_CONVERSION,
        JobType.MELODY_EXTRACTION, 
        JobType.CHORD_ANALYSIS
    ]
    if job_data.type not in valid_types:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid job type. Valid types: {', '.join(valid_types)}"
        )
    
    job_id = uuid4()
    logger.info(f"Creating new job: {job_id} of type: {job_data.type}")
    
    # Create job in database with "queued" status
    job = job_service.create_job(
        job_id=job_id,
        job_type=job_data.type,
        input_data={"audio_id": str(audio_id)},
        params=job_data.params
    )
    logger.debug(f"Job {job_id} created in database")
    
    # Enqueue job for processing with Celery
    try:
        process_audio_job.delay(str(job_id))
        logger.info(f"Job {job_id} enqueued for processing")
    except Exception as e:
        # Log error but don't fail the request - job is created
        # Job will remain in "queued" status and can be manually retried
        logger.error(
            f"Failed to enqueue job {job_id} for processing: {e}",
            exc_info=True
        )
        # Note: We don't update job status here because the job is valid,
        # just the queue system is temporarily unavailable
    
    return _build_job_response(job)


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
    
    return _build_job_response(job)
