"""
Audio Session endpoints.

Provides CRUD operations for audio timeline sessions.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import logging

from app.db.session import get_db
from app.services.audio_session_service import AudioSessionService
from app.services.project_service import ProjectService
from app.schemas.session import (
    AudioSessionCreate,
    AudioSessionUpdate,
    AudioSessionResponse,
    AudioSessionListItem
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sessions"])


def get_session_service(db: Session = Depends(get_db)) -> AudioSessionService:
    return AudioSessionService(db)


def get_project_service(db: Session = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


def _ensure_project(project_service: ProjectService, project_id: UUID) -> None:
    """Raise 404 if project does not exist."""
    if not project_service.get_project(project_id):
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )


@router.post("", response_model=AudioSessionResponse, status_code=http_status.HTTP_201_CREATED)
def create_audio_session(
    project_id: UUID,
    session_data: AudioSessionCreate,
    session_service: AudioSessionService = Depends(get_session_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Create a new audio session for a project.
    
    Stores track arrangements, clip positions, and mix settings.
    """
    _ensure_project(project_service, project_id)
    
    try:
        # Convert tracks from Pydantic models to dicts
        tracks_data = [track.model_dump(by_alias=True) for track in session_data.tracks]
        
        session = session_service.create_session(
            project_id=project_id,
            name=session_data.name,
            tracks=tracks_data,
            master_gain=session_data.masterGain
        )
        
        return AudioSessionResponse(
            id=str(session.id),
            project_id=str(session.project_id),
            name=session.name,
            tracks=session_data.tracks,
            master_gain=session.master_gain,
            created_at=session.created_at,
            updated_at=session.updated_at
        )
        
    except Exception as e:
        logger.error(f"Failed to create audio session: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )


@router.get("", response_model=List[AudioSessionListItem])
def list_audio_sessions(
    project_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session_service: AudioSessionService = Depends(get_session_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """
    List audio sessions for a project.
    
    Returns sessions ordered by last update time (newest first).
    """
    _ensure_project(project_service, project_id)
    
    sessions = session_service.list_sessions(
        project_id=project_id,
        limit=limit,
        offset=offset
    )
    
    return [
        AudioSessionListItem(
            id=str(s.id),
            project_id=str(s.project_id),
            name=s.name,
            updated_at=s.updated_at,
            created_at=s.created_at
        )
        for s in sessions
    ]


@router.get("/{session_id}", response_model=AudioSessionResponse)
def get_audio_session(
    project_id: UUID,
    session_id: UUID,
    session_service: AudioSessionService = Depends(get_session_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Get a specific audio session.
    
    Returns full session data including all tracks and clips.
    """
    _ensure_project(project_service, project_id)
    
    session = session_service.get_session(session_id)
    
    if not session or session.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found in project"
        )
    
    # Parse tracks data
    from app.schemas.session import TrackData
    tracks = [TrackData(**track) for track in session.tracks]
    
    return AudioSessionResponse(
        id=str(session.id),
        project_id=str(session.project_id),
        name=session.name,
        tracks=tracks,
        master_gain=session.master_gain,
        created_at=session.created_at,
        updated_at=session.updated_at
    )


@router.put("/{session_id}", response_model=AudioSessionResponse)
def update_audio_session(
    project_id: UUID,
    session_id: UUID,
    session_data: AudioSessionUpdate,
    session_service: AudioSessionService = Depends(get_session_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Update an audio session.
    
    Can update name, tracks, or master gain. Omitted fields are not changed.
    """
    _ensure_project(project_service, project_id)
    
    # Verify session exists and belongs to project
    existing_session = session_service.get_session(session_id)
    
    if not existing_session or existing_session.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found in project"
        )
    
    try:
        # Convert tracks if provided
        tracks_data = None
        if session_data.tracks is not None:
            tracks_data = [track.model_dump(by_alias=True) for track in session_data.tracks]
        
        session = session_service.update_session(
            session_id=session_id,
            name=session_data.name,
            tracks=tracks_data,
            master_gain=session_data.masterGain
        )
        
        if not session:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )
        
        # Parse tracks data
        from app.schemas.session import TrackData
        tracks = [TrackData(**track) for track in session.tracks]
        
        return AudioSessionResponse(
            id=str(session.id),
            project_id=str(session.project_id),
            name=session.name,
            tracks=tracks,
            master_gain=session.master_gain,
            created_at=session.created_at,
            updated_at=session.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update audio session: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update session: {str(e)}"
        )


@router.delete("/{session_id}", status_code=http_status.HTTP_204_NO_CONTENT)
def delete_audio_session(
    project_id: UUID,
    session_id: UUID,
    session_service: AudioSessionService = Depends(get_session_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Delete an audio session.
    
    Permanently removes the session and all its data.
    """
    _ensure_project(project_service, project_id)
    
    # Verify session exists and belongs to project
    session = session_service.get_session(session_id)
    
    if not session or session.project_id != project_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found in project"
        )
    
    deleted = session_service.delete_session(session_id)
    
    if not deleted:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    
    return None
