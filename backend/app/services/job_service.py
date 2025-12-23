from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from uuid import UUID

from app.models.job import Job


class JobService:
    def __init__(self, db: Session):
        self.db = db

    def create_job(self, job_id: UUID, status: str = "pending") -> Job:
        """Create a new job"""
        job = Job(id=job_id, status=status)
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def get_job(self, job_id: UUID) -> Optional[Job]:
        """Get a job by ID"""
        return self.db.query(Job).filter(Job.id == job_id).first()

    def update_job_status(self, job_id: UUID, status: str, error_message: Optional[str] = None) -> Optional[Job]:
        """Update job status"""
        job = self.get_job(job_id)
        if job:
            job.status = status
            if error_message:
                job.error_message = error_message
            self.db.commit()
            self.db.refresh(job)
        return job

    def get_pending_jobs(self) -> List[Job]:
        """Get all pending jobs"""
        return self.db.query(Job).filter(Job.status == "pending").all()

    def get_job_by_status(self, status: str) -> List[Job]:
        """Get all jobs with a specific status"""
        return self.db.query(Job).filter(Job.status == status).all()