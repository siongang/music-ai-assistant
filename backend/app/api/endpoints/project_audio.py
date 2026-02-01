"""
Project-scoped audio endpoints.

Projects OWN audio. All audio operations require project_id in the URL.
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, status as http_status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4, UUID
from pathlib import Path
import logging

from app.db.session import get_db
from app.services.audio_service import AudioService
from app.services.project_service import ProjectService
from app.storage.local_storage import LocalStorage
from app.schemas.audio import AudioResponse, AudioMetadataResponse
from app.core.constants import STORAGE_ROOT, AUDIO_EXTENSIONS, MAX_FILE_SIZE_BYTES
from app.utils.security import sanitize_filename, validate_file_size

logger = logging.getLogger(__name__)

router = APIRouter(tags=["project-audio"])


def get_audio_service(db: Session = Depends(get_db)) -> AudioService:
    return AudioService(db)


def get_project_service(db: Session = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


def get_storage() -> LocalStorage:
    return LocalStorage(root=Path(STORAGE_ROOT))


def _ensure_project(project_service: ProjectService, project_id: UUID) -> None:
    """Raise 404 if project does not exist."""
    if not project_service.get_project(project_id):
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )


@router.get("", response_model=List[AudioMetadataResponse])
def list_project_audio(
    project_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    audio_service: AudioService = Depends(get_audio_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """List audio for a project. Newest first."""
    _ensure_project(project_service, project_id)
    items = audio_service.list_audio(project_id=project_id, limit=limit, offset=offset)
    return [
        AudioMetadataResponse(
            audio_id=a.id,
            filename=a.filename,
            file_path=a.file_path,
            project_id=a.project_id,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in items
    ]


@router.post("", response_model=AudioResponse, status_code=http_status.HTTP_201_CREATED)
def upload_project_audio(
    project_id: UUID,
    file: UploadFile = File(...),
    audio_service: AudioService = Depends(get_audio_service),
    project_service: ProjectService = Depends(get_project_service),
    storage: LocalStorage = Depends(get_storage),
):
    """Upload an audio file to a project. Project owns the audio."""
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
    audio_id = uuid4()
    try:
        file_path = storage.save_audio_file(
            audio_id=str(audio_id),
            file=file.file,
            filename=sanitized_filename,
        )
        file_size = file_path.stat().st_size
        if not validate_file_size(file_size):
            try:
                file_path.unlink()
            except OSError:
                pass
            raise HTTPException(
                status_code=http_status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large",
            )
        relative_path = str(Path("audio") / str(audio_id) / sanitized_filename)
        audio = audio_service.create_audio(
            audio_id=audio_id,
            filename=sanitized_filename,
            file_path=relative_path,
            project_id=project_id,
        )
        return AudioResponse(audio_id=audio.id, filename=audio.filename, project_id=audio.project_id)
    except Exception as e:
        logger.error(f"Failed to save file for audio {audio_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )


@router.get("/{audio_id}", response_model=AudioMetadataResponse)
def get_project_audio(
    project_id: UUID,
    audio_id: UUID,
    audio_service: AudioService = Depends(get_audio_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """Get audio metadata. Audio must belong to the project."""
    _ensure_project(project_service, project_id)
    audio = audio_service.get_audio(audio_id)
    if not audio or audio.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Audio {audio_id} not found in project",
        )
    return AudioMetadataResponse(
        audio_id=audio.id,
        filename=audio.filename,
        file_path=audio.file_path,
        project_id=audio.project_id,
        created_at=audio.created_at,
        updated_at=audio.updated_at,
    )


@router.get("/{audio_id}/download")
def download_project_audio(
    project_id: UUID,
    audio_id: UUID,
    audio_service: AudioService = Depends(get_audio_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """Download an audio file. Audio must belong to the project."""
    _ensure_project(project_service, project_id)
    audio = audio_service.get_audio(audio_id)
    if not audio or audio.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Audio {audio_id} not found in project",
        )
    audio_path = audio_service.get_audio_path(audio_id)
    if not audio_path:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Audio file not found on disk",
        )
    full_path = Path(STORAGE_ROOT) / audio_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Audio file not found on disk",
        )
    return FileResponse(
        path=str(full_path),
        filename=full_path.name,
        media_type="audio/mpeg",
    )
