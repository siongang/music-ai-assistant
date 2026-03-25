"""
Project-scoped job endpoints.

Projects OWN jobs. Job creation and listing require project_id in the URL.
Correct route: POST /projects/{project_id}/jobs (not POST /jobs).
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from pydantic import ValidationError
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID, uuid4

from app.db.session import get_db
from app.artifacts.service import ArtifactService
from app.capabilities.registry import CapabilityRegistry
from app.core.constants import DEFAULT_PROVIDERS
from app.providers.registry import ProviderRegistry, initialize_provider_registry
from app.services.job_service import JobService
from app.services.project_service import ProjectService
from app.schemas.job import JobResponse, JobCreate
from app.core.constants import JobType
from app.tasks.job_tasks import process_audio_job

logger = logging.getLogger(__name__)

router = APIRouter(tags=["project-jobs"])


def _serialize_validation_errors(exc: ValidationError) -> list[dict]:
    serialized: list[dict] = []
    for error in exc.errors():
        item = dict(error)
        ctx = item.get("ctx")
        if ctx:
            item["ctx"] = {key: str(value) for key, value in ctx.items()}
        serialized.append(item)
    return serialized


def _build_job_response(job) -> JobResponse:
    provider_key = (job.params or {}).get("provider_key") or DEFAULT_PROVIDERS.get(job.type)
    return JobResponse(
        job_id=job.id,
        capability=job.type,
        provider_key=provider_key,
        status=job.status,
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


def get_artifact_service(db: Session = Depends(get_db)) -> ArtifactService:
    return ArtifactService(db)


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
    artifact_service: ArtifactService = Depends(get_artifact_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Create a job in a project. Project owns the job.
    Input must be an artifact in the same project.
    """
    _ensure_project(project_service, project_id)
    requested_capability = body.requested_capability
    valid_types = [
        JobType.STEM_SEPARATION,
        JobType.MIDI_TRANSCRIPTION,
        JobType.CHORD_ANALYSIS,
    ]
    normalized_capability = job_service.normalize_job_type(requested_capability)
    if normalized_capability not in valid_types:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid job type. Valid: {', '.join(valid_types)}",
        )
    capability_definition = CapabilityRegistry.get(normalized_capability)
    if capability_definition is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Capability {normalized_capability} not found",
        )
    if capability_definition.status != "available":
        raise HTTPException(
            status_code=http_status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"Capability {normalized_capability} is not available",
        )
    validated_params = body.params or {}
    if capability_definition.job_params_schema is not None:
        try:
            validated_params = capability_definition.job_params_schema(**validated_params).model_dump(
                exclude_none=True
            )
        except ValidationError as exc:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=_serialize_validation_errors(exc),
            ) from exc
    initialize_provider_registry()
    requested_provider_key = validated_params.get("provider_key")
    resolved_provider_key = requested_provider_key or DEFAULT_PROVIDERS.get(normalized_capability)
    if resolved_provider_key is None:
        raise HTTPException(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"No provider configured for capability {normalized_capability}",
        )
    try:
        provider = ProviderRegistry.get(normalized_capability, resolved_provider_key)
    except KeyError as exc:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    if not provider.is_available:
        raise HTTPException(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Provider {resolved_provider_key} is not available in this environment",
        )

    input_payload: dict[str, str] = {}
    artifact = artifact_service.get(body.input.input_artifact_id)
    if artifact is None or artifact.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Artifact {body.input.input_artifact_id} not found in project",
        )
    input_payload["input_artifact_id"] = str(artifact.id)

    job_id = uuid4()
    job = job_service.create_job(
        job_id=job_id,
        job_type=normalized_capability,
        input_data=input_payload,
        params=validated_params,
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
