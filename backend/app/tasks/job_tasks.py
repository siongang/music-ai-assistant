"""Celery tasks for capability-backed job processing."""
import logging
from typing import Any, Dict
from uuid import UUID

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.jobs.dispatcher import JobDispatcher
from app.services.job_service import JobService
from app.core.constants import JobStatus

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
        job = JobService(db).get_job(job_uuid)
        if not job:
            error_msg = f"Job {job_id} not found"
            logger.error(error_msg)
            return {"status": "failed", "error": error_msg}
        result = JobDispatcher(db).dispatch(job_uuid)
        if result["status"] == "succeeded":
            logger.info(f"Job {job_id} completed successfully")
        else:
            logger.error(f"Job {job_id} failed: {result.get('error', 'Unknown error')}")
        return result
            
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
