"""
Audio Session Service.

Service layer for audio timeline session operations.
"""
import logging
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.audio_session import AudioSession

logger = logging.getLogger(__name__)


class AudioSessionService:
    """Service for managing audio timeline sessions."""
    
    def __init__(self, db: Session):
        """
        Initialize audio session service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    def create_session(
        self,
        project_id: UUID,
        name: str,
        tracks: list,
        master_gain: float = 1.0
    ) -> AudioSession:
        """
        Create a new audio session.
        
        Args:
            project_id: Project ID
            name: Session name
            tracks: Track configurations (list of dicts)
            master_gain: Master output gain
            
        Returns:
            Created AudioSession
        """
        session = AudioSession(
            project_id=project_id,
            name=name,
            tracks=tracks,
            master_gain=master_gain
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        logger.info(f"Created audio session {session.id} for project {project_id}")
        
        return session
    
    def get_session(self, session_id: UUID) -> Optional[AudioSession]:
        """
        Get audio session by ID.
        
        Args:
            session_id: Session ID
            
        Returns:
            AudioSession or None if not found
        """
        return self.db.query(AudioSession).filter(
            AudioSession.id == session_id
        ).first()
    
    def list_sessions(
        self,
        project_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[AudioSession]:
        """
        List audio sessions for a project.
        
        Args:
            project_id: Project ID
            limit: Maximum number of sessions to return
            offset: Offset for pagination
            
        Returns:
            List of AudioSessions
        """
        return self.db.query(AudioSession).filter(
            AudioSession.project_id == project_id
        ).order_by(
            AudioSession.updated_at.desc()
        ).limit(limit).offset(offset).all()
    
    def update_session(
        self,
        session_id: UUID,
        name: Optional[str] = None,
        tracks: Optional[list] = None,
        master_gain: Optional[float] = None
    ) -> Optional[AudioSession]:
        """
        Update an audio session.
        
        Args:
            session_id: Session ID
            name: New session name (optional)
            tracks: New track configurations (optional)
            master_gain: New master gain (optional)
            
        Returns:
            Updated AudioSession or None if not found
        """
        session = self.get_session(session_id)
        
        if not session:
            return None
        
        if name is not None:
            session.name = name
        
        if tracks is not None:
            session.tracks = tracks
        
        if master_gain is not None:
            session.master_gain = master_gain
        
        self.db.commit()
        self.db.refresh(session)
        
        logger.info(f"Updated audio session {session_id}")
        
        return session
    
    def delete_session(self, session_id: UUID) -> bool:
        """
        Delete an audio session.
        
        Args:
            session_id: Session ID
            
        Returns:
            True if deleted, False if not found
        """
        session = self.get_session(session_id)
        
        if not session:
            return False
        
        self.db.delete(session)
        self.db.commit()
        
        logger.info(f"Deleted audio session {session_id}")
        
        return True
