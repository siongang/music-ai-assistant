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
from app.services.audio_conversion_service import AudioConversionService
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


def get_conversion_service() -> AudioConversionService:
    return AudioConversionService(storage_root=Path(STORAGE_ROOT))


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
            duration=a.duration,
            sample_rate=a.sample_rate,
            channels=a.channels,
            format=a.original_format,
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
    conversion_service: AudioConversionService = Depends(get_conversion_service),
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
        # Save original file
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
        
        # Convert audio to standard WAV format
        converted_file_path = None
        duration = None
        sample_rate = None
        channels = None
        
        try:
            logger.info(f"Converting audio {audio_id} to WAV format")
            conversion_result = conversion_service.convert_audio_file(
                audio_id=audio_id,
                original_path=file_path
            )
            converted_file_path = conversion_result["converted_path"]
            metadata = conversion_result["metadata"]
            duration = metadata.get("duration")
            sample_rate = metadata.get("sample_rate")
            channels = metadata.get("channels")
            logger.info(f"Audio conversion successful: {audio_id}")
        except Exception as conv_error:
            logger.error(f"Audio conversion failed for {audio_id}: {conv_error}", exc_info=True)
            try:
                file_path.unlink()
            except OSError:
                logger.warning(f"Failed to clean up uploaded file after conversion error: {file_path}")
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Failed to process audio file into the required WAV format.",
            )
        
        # Create audio record with conversion metadata
        audio = audio_service.create_audio(
            audio_id=audio_id,
            filename=sanitized_filename,
            file_path=relative_path,
            project_id=project_id,
            converted_file_path=converted_file_path,
            original_format=file_ext,
            duration=duration,
            sample_rate=sample_rate,
            channels=channels,
        )
        return AudioResponse(
            audio_id=audio.id,
            filename=audio.filename,
            project_id=audio.project_id,
            duration=audio.duration,
            sample_rate=audio.sample_rate,
            channels=audio.channels,
            format=audio.original_format,
        )
    except HTTPException:
        raise
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
        duration=audio.duration,
        sample_rate=audio.sample_rate,
        channels=audio.channels,
        format=audio.original_format,
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
    _MIME_TYPES: dict[str, str] = {
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
        ".flac": "audio/flac",
        ".ogg": "audio/ogg",
        ".aac": "audio/aac",
        ".m4a": "audio/mp4",
        ".aiff": "audio/aiff",
        ".wma": "audio/x-ms-wma",
    }
    media_type = _MIME_TYPES.get(full_path.suffix.lower(), "application/octet-stream")
    return FileResponse(
        path=str(full_path),
        filename=full_path.name,
        media_type=media_type,
    )
