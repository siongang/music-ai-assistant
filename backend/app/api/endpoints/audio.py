"""
Audio API endpoints.

This module provides HTTP endpoints for audio file management:
- POST /audio: Upload an audio file
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from uuid import uuid4
from pathlib import Path
import logging

from app.db.session import get_db
from app.services.audio_service import AudioService
from app.storage.local_storage import LocalStorage
from app.schemas.audio import AudioResponse
from app.core.constants import STORAGE_ROOT, AUDIO_EXTENSIONS, MAX_FILE_SIZE_BYTES
from app.utils.security import sanitize_filename, validate_file_size

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audio", tags=["audio"])


def get_audio_service(db: Session = Depends(get_db)) -> AudioService:
    """
    Dependency for getting AudioService instance.
    
    FastAPI will automatically call this function for each request,
    creating a new AudioService instance tied to the request's database session.
    """
    return AudioService(db)


def get_storage() -> LocalStorage:
    """
    Dependency for getting LocalStorage instance.
    
    Creates a storage instance for file operations.
    In the future, this could be configured via environment variables.
    """
    return LocalStorage(root=Path(STORAGE_ROOT))


@router.post("", response_model=AudioResponse, status_code=http_status.HTTP_201_CREATED)
def upload_audio(
    file: UploadFile = File(...),
    audio_service: AudioService = Depends(get_audio_service),
    storage: LocalStorage = Depends(get_storage)
):
    """
    Upload an audio file.
    
    This endpoint:
    1. Generates a unique audio ID
    2. Validates the file extension
    3. Saves the uploaded audio file to storage
    4. Creates an Audio DB record
    5. Returns the audio information
    
    The uploaded file is saved to: {storage_root}/audio/{audio_id}/{filename}
    
    Args:
        file: Uploaded audio file
        audio_service: Injected AudioService instance
        storage: Injected LocalStorage instance
        
    Returns:
        AudioResponse with audio_id and filename
        
    Raises:
        HTTPException: If file validation fails (400) or save fails (500)
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported extensions: {', '.join(AUDIO_EXTENSIONS)}"
        )
    
    # Validate file size (check Content-Length header if available)
    # Note: This is a best-effort check. Actual size is validated after save.
    content_length = file.size if hasattr(file, 'size') and file.size else None
    if content_length and not validate_file_size(content_length):
        raise HTTPException(
            status_code=http_status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({content_length / (1024*1024):.2f} MB) exceeds maximum allowed size ({MAX_FILE_SIZE_BYTES / (1024*1024)} MB)"
        )
    
    # Sanitize filename to prevent path traversal attacks
    sanitized_filename = sanitize_filename(file.filename)
    if sanitized_filename != file.filename:
        logger.warning(f"Filename sanitized: '{file.filename}' -> '{sanitized_filename}'")
    
    audio_id = uuid4()
    logger.info(f"Uploading audio file: {sanitized_filename} as {audio_id}")
    
    # Save uploaded file to storage
    try:
        file_path = storage.save_audio_file(
            audio_id=str(audio_id),
            file=file.file,
            filename=sanitized_filename
        )
        
        # Validate file size after save (double-check if Content-Length wasn't available)
        file_size = file_path.stat().st_size
        if not validate_file_size(file_size):
            # Delete the file if it's too large
            try:
                file_path.unlink()
            except Exception as cleanup_error:
                logger.error(f"Failed to cleanup oversized file: {cleanup_error}")
            raise HTTPException(
                status_code=http_status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size ({file_size / (1024*1024):.2f} MB) exceeds maximum allowed size ({MAX_FILE_SIZE_BYTES / (1024*1024)} MB)"
            )
        
        logger.info(f"File saved for audio {audio_id}: {file_path} (size: {file_size / (1024*1024):.2f} MB)")
        
        # Create audio record in database
        # Store relative path from storage root (use sanitized filename)
        relative_path = str(Path("audio") / str(audio_id) / sanitized_filename)
        audio = audio_service.create_audio(
            audio_id=audio_id,
            filename=sanitized_filename,
            file_path=relative_path
        )
        
        # Map id to audio_id for response
        return AudioResponse(audio_id=audio.id, filename=audio.filename)
        
    except Exception as e:
        logger.error(f"Failed to save file for audio {audio_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

