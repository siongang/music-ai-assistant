"""Session service for managing agent conversations."""
from uuid import UUID, uuid4
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session as DBSession
from app.models.session import Session
from app.models.agent_step import AgentStep
import logging

logger = logging.getLogger(__name__)


class SessionService:
    """
    Service for managing agent sessions and conversation history.
    """
    
    def __init__(self, db: DBSession):
        self.db = db
    
    def create_session(self, metadata: Optional[Dict[str, Any]] = None) -> Session:
        """
        Create a new session.
        
        Args:
            metadata: Optional session metadata
        
        Returns:
            Created Session object
        """
        session = Session(id=uuid4(), session_metadata=metadata or {})
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        logger.info(f"Created session: {session.id}")
        return session
    
    def get_session(self, session_id: UUID) -> Optional[Session]:
        """
        Get session by ID.
        
        Args:
            session_id: Session UUID
        
        Returns:
            Session object or None if not found
        """
        return self.db.query(Session).filter(Session.id == session_id).first()
    
    def get_or_create_session(self, session_id: UUID) -> Session:
        """
        Get existing session or create if doesn't exist.
        
        Args:
            session_id: Session UUID
        
        Returns:
            Session object
        """
        session = self.get_session(session_id)
        if not session:
            session = Session(id=session_id, session_metadata={})
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)
            logger.info(f"Created session: {session_id}")
        return session
    
    def add_step(
        self,
        session_id: UUID,
        step_type: str,
        content: Dict[str, Any]
    ) -> AgentStep:
        """
        Add a step to session history.
        
        Args:
            session_id: Session UUID
            step_type: Type of step (user_message, tool_call, tool_result, agent_response, error)
            content: Step content (flexible JSON)
        
        Returns:
            Created AgentStep object
        """
        # Get current step count for this session
        step_count = self.db.query(AgentStep)\
            .filter(AgentStep.session_id == session_id)\
            .count()
        
        step = AgentStep(
            session_id=session_id,
            step_number=step_count + 1,
            step_type=step_type,
            content=content
        )
        self.db.add(step)
        self.db.commit()
        self.db.refresh(step)
        return step
    
    def get_conversation_history(
        self,
        session_id: UUID,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get conversation history for session.
        
        Args:
            session_id: Session UUID
            limit: Maximum number of steps to return
        
        Returns:
            List of step contents (newest first, then reversed)
        """
        steps = self.db.query(AgentStep)\
            .filter(AgentStep.session_id == session_id)\
            .order_by(AgentStep.step_number.asc())\
            .limit(limit)\
            .all()
        
        return [
            {
                "step_type": step.step_type,
                "content": step.content,
                "created_at": step.created_at.isoformat()
            }
            for step in steps
        ]
    
    def get_messages_for_llm(self, session_id: UUID, limit: int = 20) -> List[Dict[str, str]]:
        """
        Get conversation messages formatted for LLM input.
        
        Returns only user_message and agent_response types.
        
        Args:
            session_id: Session UUID
            limit: Maximum messages to return
        
        Returns:
            List of messages in format [{"role": "user", "content": "..."}, ...]
        """
        steps = self.db.query(AgentStep)\
            .filter(AgentStep.session_id == session_id)\
            .filter(AgentStep.step_type.in_(["user_message", "agent_response"]))\
            .order_by(AgentStep.step_number.asc())\
            .limit(limit)\
            .all()
        
        messages = []
        for step in steps:
            if step.step_type == "user_message":
                messages.append({
                    "role": "user",
                    "content": step.content.get("content", "")
                })
            elif step.step_type == "agent_response":
                messages.append({
                    "role": "assistant",
                    "content": step.content.get("content", "")
                })
        
        return messages
    
    def set_primary_audio(self, session_id: UUID, audio_id: str, filename: Optional[str] = None):
        """
        Set the primary audio for this session.
        
        **Beta Design: One audio per session**
        Each session has exactly one primary audio. Setting a new primary audio
        replaces the previous one (or creates it if none exists).
        
        Args:
            session_id: Session UUID
            audio_id: Audio UUID to set as primary
            filename: Optional filename for display
        """
        session = self.get_or_create_session(session_id)
        if not session.session_metadata:
            session.session_metadata = {}
        
        session.session_metadata["primary_audio_id"] = audio_id
        if filename:
            session.session_metadata["primary_audio_filename"] = filename
        
        self.db.commit()
        logger.info(f"Set primary audio for session {session_id}: {audio_id}")
    
    def get_primary_audio(self, session_id: UUID) -> Optional[Dict[str, str]]:
        """
        Get the primary audio for this session.
        
        Args:
            session_id: Session UUID
        
        Returns:
            Dict with "audio_id" and optionally "filename", or None if no primary audio set
        """
        session = self.get_session(session_id)
        if not session or not session.session_metadata:
            return None
        
        audio_id = session.session_metadata.get("primary_audio_id")
        if not audio_id:
            return None
        
        result = {"audio_id": audio_id}
        if "primary_audio_filename" in session.session_metadata:
            result["filename"] = session.session_metadata["primary_audio_filename"]
        
        return result
