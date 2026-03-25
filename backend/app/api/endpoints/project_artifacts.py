"""Project-scoped artifact endpoints."""
from uuid import UUID, uuid4
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status as http_status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.artifacts.service import ArtifactService
from app.artifacts.schemas import ArtifactMetadata, ArtifactType
from app.core.constants import STORAGE_ROOT
from app.db.session import get_db
from app.schemas.artifact import ArtifactMetadataResponse, ArtifactResponse, SourceAudioUploadResponse
from app.services.audio_conversion_service import AudioConversionService
from app.services.project_service import ProjectService
from app.storage.local_storage import LocalStorage
from app.utils.security import sanitize_filename, validate_file_size
from app.core.constants import AUDIO_EXTENSIONS, MAX_FILE_SIZE_BYTES

router = APIRouter(tags=["project-artifacts"])


def get_artifact_service(db: Session = Depends(get_db)) -> ArtifactService:
    return ArtifactService(db)


def get_project_service(db: Session = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


def get_storage() -> LocalStorage:
    return LocalStorage(root=Path(STORAGE_ROOT))


def get_conversion_service() -> AudioConversionService:
    return AudioConversionService(storage_root=Path(STORAGE_ROOT))


def _ensure_project(project_service: ProjectService, project_id: UUID) -> None:
    if not project_service.get_project(project_id):
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )


def _to_response(artifact) -> ArtifactResponse:
    return ArtifactResponse(
        id=artifact.id,
        type=artifact.type,
        project_id=artifact.project_id,
        producing_job_id=artifact.producing_job_id,
        parent_artifact_id=artifact.parent_artifact_id,
        storage_path=artifact.storage_path,
        file_size_bytes=artifact.file_size_bytes,
        metadata=ArtifactMetadataResponse(**(artifact.artifact_metadata or {})),
        download_url=f"/api/projects/{artifact.project_id}/artifacts/{artifact.id}/download",
        created_at=artifact.created_at,
    )


@router.post("/source-audio", response_model=SourceAudioUploadResponse, status_code=http_status.HTTP_201_CREATED)
def upload_source_audio(
    project_id: UUID,
    file: UploadFile = File(...),
    artifact_service: ArtifactService = Depends(get_artifact_service),
    project_service: ProjectService = Depends(get_project_service),
    storage: LocalStorage = Depends(get_storage),
    conversion_service: AudioConversionService = Depends(get_conversion_service),
):
    _ensure_project(project_service, project_id)
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported: {', '.join(AUDIO_EXTENSIONS)}",
        )
    content_length = file.size if hasattr(file, "size") and file.size else None
    if content_length and not validate_file_size(content_length):
        raise HTTPException(
            status_code=http_status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {MAX_FILE_SIZE_BYTES / (1024*1024)} MB)",
        )

    sanitized_filename = sanitize_filename(file.filename)
    artifact_id = uuid4()
    try:
        original_path = storage.save_audio_file(
            audio_id=str(artifact_id),
            file=file.file,
            filename=sanitized_filename,
        )
        file_size = original_path.stat().st_size
        if not validate_file_size(file_size):
            try:
                original_path.unlink()
            except OSError:
                pass
            raise HTTPException(
                status_code=http_status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large",
            )

        original_storage_path = str(Path("audio") / str(artifact_id) / sanitized_filename)
        conversion_result = conversion_service.convert_audio_file(
            audio_id=artifact_id,
            original_path=original_path,
        )
        converted_storage_path = conversion_result["converted_path"]
        metadata = conversion_result["metadata"]

        artifact = artifact_service.create(
            artifact_type=ArtifactType.AUDIO_FILE,
            project_id=project_id,
            storage_path=converted_storage_path,
            metadata=ArtifactMetadata(
                duration_seconds=metadata.get("duration"),
                sample_rate=metadata.get("sample_rate"),
                channels=metadata.get("channels"),
                extra={
                    "filename": sanitized_filename,
                    "original_storage_path": original_storage_path,
                    "original_format": file_ext,
                    "converted_file_path": converted_storage_path,
                },
            ),
            file_size_bytes=file_size,
        )
        artifact_service.db.commit()
        return SourceAudioUploadResponse(
            artifact_id=artifact.id,
            filename=sanitized_filename,
            project_id=project_id,
            duration=metadata.get("duration"),
            sample_rate=metadata.get("sample_rate"),
            channels=metadata.get("channels"),
            format=file_ext,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload source audio: {exc}",
        ) from exc


@router.get("", response_model=list[ArtifactResponse])
def list_project_artifacts(
    project_id: UUID,
    artifact_type: str | None = Query(None),
    parent_artifact_id: UUID | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    artifact_service: ArtifactService = Depends(get_artifact_service),
    project_service: ProjectService = Depends(get_project_service),
):
    _ensure_project(project_service, project_id)
    artifacts = artifact_service.list_for_project(project_id)
    if artifact_type:
        artifacts = [a for a in artifacts if a.type == artifact_type]
    if parent_artifact_id:
        artifacts = [a for a in artifacts if a.parent_artifact_id == parent_artifact_id]
    artifacts = artifacts[offset: offset + limit]
    return [_to_response(artifact) for artifact in artifacts]


@router.get("/{artifact_id}", response_model=ArtifactResponse)
def get_project_artifact(
    project_id: UUID,
    artifact_id: UUID,
    artifact_service: ArtifactService = Depends(get_artifact_service),
    project_service: ProjectService = Depends(get_project_service),
):
    _ensure_project(project_service, project_id)
    artifact = artifact_service.get(artifact_id)
    if artifact is None or artifact.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Artifact {artifact_id} not found in project",
        )
    return _to_response(artifact)


@router.get("/{artifact_id}/download")
def download_project_artifact(
    project_id: UUID,
    artifact_id: UUID,
    artifact_service: ArtifactService = Depends(get_artifact_service),
    project_service: ProjectService = Depends(get_project_service),
):
    _ensure_project(project_service, project_id)
    artifact = artifact_service.get(artifact_id)
    if artifact is None or artifact.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Artifact {artifact_id} not found in project",
        )
    full_path = Path(STORAGE_ROOT) / artifact.storage_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Artifact file not found on disk",
        )
    return FileResponse(path=str(full_path), filename=full_path.name)
