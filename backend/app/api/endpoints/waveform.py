"""Waveform endpoints for source artifacts."""
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session
from uuid import UUID
from pathlib import Path
import logging

from app.db.session import get_db
from app.artifacts.service import ArtifactService
from app.services.project_service import ProjectService
from app.services.waveform_service import WaveformService
from app.schemas.waveform import WaveformResponse
from app.core.constants import STORAGE_ROOT

logger = logging.getLogger(__name__)

router = APIRouter(tags=["waveform"])


def get_project_service(db: Session = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


def get_artifact_service(db: Session = Depends(get_db)) -> ArtifactService:
    return ArtifactService(db)


def get_waveform_service() -> WaveformService:
    return WaveformService(storage_root=Path(STORAGE_ROOT))


@router.get("/{artifact_id}/waveform", response_model=WaveformResponse)
def get_artifact_waveform(
    project_id: UUID,
    artifact_id: UUID,
    level: int = Query(512, ge=256, le=2048, description="Samples per second (zoom level)"),
    artifact_service: ArtifactService = Depends(get_artifact_service),
    project_service: ProjectService = Depends(get_project_service),
    waveform_service: WaveformService = Depends(get_waveform_service),
):
    """Get waveform visualization data for a source audio artifact."""
    # Verify project exists
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    artifact = artifact_service.get_source_artifact(artifact_id, project_id=project_id)
    if artifact is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Source artifact {artifact_id} not found in project"
        )
    audio_path = Path(STORAGE_ROOT) / artifact.storage_path
    
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
            artifact_id=artifact_id,
            audio_path=audio_path,
            level=level
        )

        return WaveformResponse(**waveform_data)
        
    except Exception as e:
        logger.error(f"Failed to generate waveform for {artifact_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate waveform: {str(e)}"
        )
