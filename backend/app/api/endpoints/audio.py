"""
Audio file download endpoint for job outputs.

Job outputs (stems, MIDI, etc.) are downloaded by path.
Upload and metadata are project-scoped: use POST/GET /api/projects/{project_id}/audio.
"""
from fastapi import APIRouter, HTTPException, status as http_status
from fastapi.responses import FileResponse
from pathlib import Path
import logging

from app.core.constants import STORAGE_ROOT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audio", tags=["audio"])


@router.get("/files/{file_path:path}")
def download_file(file_path: str):
    """
    Download any file from storage by relative path.
    Used for job outputs (stems, MIDI, etc.). Path is globally unique (e.g. jobs/{job_id}/stems/...).
    """
    logger.debug(f"Download request for file: {file_path}")
    full_path = (Path(STORAGE_ROOT) / file_path).resolve()
    storage_root = Path(STORAGE_ROOT).resolve()
    try:
        full_path.relative_to(storage_root)
    except ValueError:
        logger.warning(f"Path traversal attempt: {file_path}")
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path",
        )
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    media_type = "application/octet-stream"
    if full_path.suffix.lower() in [".mp3", ".wav", ".flac", ".ogg", ".m4a"]:
        media_type = "audio/mpeg"
    elif full_path.suffix.lower() in [".mid", ".midi"]:
        media_type = "audio/midi"
    elif full_path.suffix.lower() == ".csv":
        media_type = "text/csv"
    return FileResponse(path=str(full_path), filename=full_path.name, media_type=media_type)
