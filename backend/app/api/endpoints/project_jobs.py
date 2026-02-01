"""
Project-scoped job endpoints.

Projects OWN jobs. Job creation and listing require project_id in the URL.
Correct route: POST /projects/{project_id}/jobs (not POST /jobs).
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID, uuid4
import logging

from app.db.session import get_db
from app.services.job_service import JobService
from app.services.audio_service import AudioService
from app.services.project_service import ProjectService
from app.schemas.job import JobResponse, JobCreate
from app.core.constants import JobType
from app.tasks.job_tasks import process_audio_job

logger = logging.getLogger(__name__)

router = APIRouter(tags=["project-jobs"])


def _build_job_response(job) -> JobResponse:
    audio_id = UUID(job.input.get("audio_id"))
    return JobResponse(
        job_id=job.id,
        type=job.type,
        status=job.status,
        audio_id=audio_id,
        project_id=job.project_id,
        input=job.input,
        params=job.params,
        output=job.output,
        progress=job.progress,
        error_message=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


def get_job_service(db: Session = Depends(get_db)) -> JobService:
    return JobService(db)


def get_audio_service(db: Session = Depends(get_db)) -> AudioService:
    return AudioService(db)


def get_project_service(db: Session = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


def _ensure_project(project_service: ProjectService, project_id: UUID) -> None:
    if not project_service.get_project(project_id):
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )


@router.post("", response_model=JobResponse, status_code=http_status.HTTP_201_CREATED)
def create_project_job(
    project_id: UUID,
    body: JobCreate,
    job_service: JobService = Depends(get_job_service),
    audio_service: AudioService = Depends(get_audio_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Create a job in a project. Project owns the job.
    Input audio_id must belong to the same project.
    """
    _ensure_project(project_service, project_id)
    audio_id = body.input.audio_id
    audio = audio_service.get_audio(audio_id)
    if not audio:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Audio {audio_id} not found",
        )
    if audio.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Audio must belong to this project",
        )
    valid_types = [
        JobType.STEM_SEPARATION,
        JobType.MIDI_CONVERSION,
        JobType.MELODY_EXTRACTION,
        JobType.CHORD_ANALYSIS,
    ]
    if body.type not in valid_types:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid job type. Valid: {', '.join(valid_types)}",
        )
    job_id = uuid4()
    job = job_service.create_job(
        job_id=job_id,
        job_type=body.type,
        input_data={"audio_id": str(audio_id)},
        params=body.params,
        project_id=project_id,
    )
    try:
        process_audio_job.delay(str(job_id))
    except Exception as e:
        logger.error(f"Failed to enqueue job {job_id}: {e}", exc_info=True)
    return _build_job_response(job)


@router.get("", response_model=List[JobResponse])
def list_project_jobs(
    project_id: UUID,
    status: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    job_service: JobService = Depends(get_job_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """List jobs for a project. Newest first."""
    _ensure_project(project_service, project_id)
    jobs = job_service.list_jobs(
        project_id=project_id,
        status=status,
        job_type=job_type,
        limit=limit,
        offset=offset,
    )
    return [_build_job_response(job) for job in jobs]


@router.get("/{job_id}", response_model=JobResponse)
def get_project_job(
    project_id: UUID,
    job_id: UUID,
    job_service: JobService = Depends(get_job_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """Get a job. Job must belong to the project."""
    _ensure_project(project_service, project_id)
    job = job_service.get_job(job_id)
    if not job or job.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found in project",
        )
    return _build_job_response(job)
