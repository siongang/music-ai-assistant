"""
Waveform endpoints.

Provides waveform visualization data for audio files.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session
from uuid import UUID
from pathlib import Path
import logging

from app.db.session import get_db
from app.services.audio_service import AudioService
from app.services.project_service import ProjectService
from app.services.waveform_service import WaveformService
from app.schemas.waveform import WaveformResponse
from app.core.constants import STORAGE_ROOT

logger = logging.getLogger(__name__)

router = APIRouter(tags=["waveform"])


def get_audio_service(db: Session = Depends(get_db)) -> AudioService:
    return AudioService(db)


def get_project_service(db: Session = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


def get_waveform_service() -> WaveformService:
    return WaveformService(storage_root=Path(STORAGE_ROOT))


@router.get("/{audio_id}/waveform", response_model=WaveformResponse)
def get_audio_waveform(
    project_id: UUID,
    audio_id: UUID,
    level: int = Query(512, ge=256, le=2048, description="Samples per second (zoom level)"),
    audio_service: AudioService = Depends(get_audio_service),
    project_service: ProjectService = Depends(get_project_service),
    waveform_service: WaveformService = Depends(get_waveform_service),
):
    """
    Get waveform visualization data for an audio file.
    
    Generates and caches waveform peaks at the specified zoom level.
    Supported levels: 256, 512, 1024, 2048 samples per second.
    """
    # Verify project exists
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Verify audio exists and belongs to project
    audio = audio_service.get_audio(audio_id)
    if not audio or audio.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Audio {audio_id} not found in project"
        )
    
    # Waveform generation expects a normalized WAV path.
    converted_path = getattr(audio, 'converted_file_path', None)
    if not converted_path:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Waveform unavailable because the converted WAV file is missing",
        )

    audio_path = Path(STORAGE_ROOT) / converted_path
    
    if not audio_path.exists():
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Audio file not found on disk"
        )
    
    # Normalize level to supported values
    supported_levels = [256, 512, 1024, 2048]
    if level not in supported_levels:
        # Find closest supported level
        level = min(supported_levels, key=lambda x: abs(x - level))
    
    try:
        # Get or generate waveform data
        waveform_data = waveform_service.get_waveform_data(
            audio_id=audio_id,
            audio_path=audio_path,
            level=level
        )
        
        return WaveformResponse(**waveform_data)
        
    except Exception as e:
        logger.error(f"Failed to generate waveform for {audio_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate waveform: {str(e)}"
        )
