"""
Job service for database operations.

This service handles all database operations related to jobs,
including creation, retrieval, and status updates.
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
import logging

from app.models.job import Job
from app.core.constants import JobStatus

logger = logging.getLogger(__name__)


class JobService:
    """
    Service for job database operations.
    
    Provides methods for creating, retrieving, and updating jobs
    in the database. This service encapsulates all job-related
    database logic.
    """
    
    def __init__(self, db: Session):
        """
        Initialize job service.
        
        Args:
            db: Database session for operations
        """
        self.db = db

    def create_job(self, job_id: UUID, status: str = JobStatus.PENDING) -> Job:
        """
        Create a new job in the database.
        
        Args:
            job_id: Unique identifier for the job
            status: Initial job status (default: "pending")
            
        Returns:
            Created Job object
        """
        job = Job(id=job_id, status=status)
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        logger.debug(f"Created job: {job_id} with status: {status}")
        return job

    def get_job(self, job_id: UUID) -> Optional[Job]:
        """
        Get a job by ID.
        
        Args:
            job_id: UUID of the job to retrieve
            
        Returns:
            Job object if found, None otherwise
        """
        return self.db.query(Job).filter(Job.id == job_id).first()

    def update_job_status(
        self, 
        job_id: UUID, 
        status: str, 
        error_message: Optional[str] = None
    ) -> Optional[Job]:
        """
        Update job status and optionally error message.
        
        Args:
            job_id: UUID of the job to update
            status: New status value
            error_message: Optional error message (typically used when status="failed")
            
        Returns:
            Updated Job object if found, None otherwise
        """
        job = self.get_job(job_id)
        if job:
            job.status = status
            if error_message:
                job.error_message = error_message
            self.db.commit()
            self.db.refresh(job)
            logger.debug(f"Updated job {job_id} status to: {status}")
        return job

    def get_pending_jobs(self) -> List[Job]:
        """
        Get all jobs with "pending" status.
        
        Returns:
            List of Job objects with status="pending"
        """
        return self.db.query(Job).filter(Job.status == JobStatus.PENDING).all()

    def get_job_by_status(self, status: str) -> List[Job]:
        """
        Get all jobs with a specific status.
        
        Args:
            status: Status value to filter by
            
        Returns:
            List of Job objects with the specified status
        """
        return self.db.query(Job).filter(Job.status == status).all()