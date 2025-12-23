from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from uuid import UUID
from pathlib import Path
import shutil

from app.db.session import get_db
from app.services.job_service import JobService
from app.storage.local_storage import LocalStorage
from app.schemas.job import JobResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobResponse, status_code=http_status.HTTP_201_CREATED)
def create_job(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Create a new job and upload the audio file"""
    from uuid import uuid4
    
    job_id = uuid4()
    job_service = JobService(db)
    
    # Create job in database
    job = job_service.create_job(job_id, status="pending")
    
    # Save uploaded file to storage
    try:
        storage = LocalStorage(root=Path("backend/tmp"))
        job_path = storage.job_path(str(job_id))
        input_path = job_path / "input"
        input_path.mkdir(parents=True, exist_ok=True)
        
        # Save file with original filename
        file_path = input_path / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return JobResponse.model_validate(job)
    except Exception as e:
        # Update job status to failed if file save fails
        job_service.update_job_status(job_id, "failed", error_message=str(e))
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: UUID,
    db: Session = Depends(get_db)
):
    """Get job status by ID"""
    job_service = JobService(db)
    job = job_service.get_job(job_id)
    
    if not job:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    
    return JobResponse.model_validate(job)
