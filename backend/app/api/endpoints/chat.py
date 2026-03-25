"""Chat/Agent API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status as http_status
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

import os
from app.db.session import get_db
from app.artifacts.service import ArtifactService
from app.services.job_service import JobService
from app.services.project_service import ProjectService
from app.services.audio_conversion_service import AudioConversionService
from app.agent.executor import AgentExecutor
from app.agent.session_service import SessionService
from app.agent.llm_client import create_llm_client
from app.agent.tools.registry import create_default_registry
from app.storage.local_storage import LocalStorage
from app.core.constants import STORAGE_ROOT
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


# Request/Response models
class ChatMessageRequest(BaseModel):
    """Request to send a message to agent."""
    session_id: Optional[UUID] = None
    message: str


class ChatMessageResponse(BaseModel):
    """Response from agent."""
    session_id: UUID
    message: str
    metadata: Optional[Dict[str, Any]] = None


class SessionCreateResponse(BaseModel):
    """Response for session creation."""
    session_id: UUID
    created_at: str


def get_project_service(db: Session = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


def get_artifact_service(db: Session = Depends(get_db)) -> ArtifactService:
    return ArtifactService(db)


def get_storage() -> LocalStorage:
    return LocalStorage(root=Path(STORAGE_ROOT))


def get_conversion_service() -> AudioConversionService:
    return AudioConversionService(storage_root=Path(STORAGE_ROOT))


def get_agent_executor(db: Session = Depends(get_db)) -> AgentExecutor:
    """
    Create AgentExecutor instance.
    
    This is called for each request to ensure fresh services.
    """
    # Create services
    job_service = JobService(db)
    artifact_service = ArtifactService(db)
    session_service = SessionService(db)
    
    # Create tool registry
    tool_registry = create_default_registry(job_service, artifact_service)
    
    # Create LLM client (using Responses API)
    # Model can be configured via OPENAI_MODEL or LLM_MODEL env var (default: gpt-5)
    # Check both for backward compatibility
    model = os.getenv("OPENAI_MODEL") or os.getenv("LLM_MODEL") or "gpt-5"
    # Normalize model name (add gpt- prefix if missing)
    if model and not model.startswith("gpt-"):
        model = f"gpt-{model}"
    logger.info(f"Using LLM model: {model}")
    llm_client = create_llm_client(provider="openai", model=model)
    
    # Create executor
    executor = AgentExecutor(
        llm_client=llm_client,
        tool_registry=tool_registry,
        session_service=session_service,
        max_steps=10
    )
    
    return executor


@router.post("/sessions", response_model=SessionCreateResponse)
def create_session(db: Session = Depends(get_db)):
    """
    Create a new chat session.
    
    Returns:
        SessionCreateResponse with session_id
    """
    session_service = SessionService(db)
    session = session_service.create_session()
    
    return SessionCreateResponse(
        session_id=session.id,
        created_at=session.created_at.isoformat()
    )


@router.post("/message", response_model=ChatMessageResponse)
def send_message(
    request: ChatMessageRequest,
    executor: AgentExecutor = Depends(get_agent_executor),
    db: Session = Depends(get_db)
):
    """
    Send a message to the agent.
    
    If session_id is not provided, creates a new session.
    
    Args:
        request: Chat message request
        executor: Agent executor (injected)
        db: Database session
    
    Returns:
        ChatMessageResponse with agent's reply
    """
    # Create or use existing session
    session_id = request.session_id or uuid4()
    
    logger.info(f"[CHAT] Received message | session={session_id} | message_length={len(request.message)}")
    logger.debug(f"[CHAT] Message content: {request.message[:200]}...")
    
    try:
        # Process message
        logger.info(f"[CHAT] Starting agent processing | session={session_id}")
        response = executor.process_message(session_id, request.message)
        logger.info(f"[CHAT] Agent processing complete | session={session_id} | response_length={len(response.message)} | steps={response.metadata.get('steps', 'unknown')}")
        
        return ChatMessageResponse(
            session_id=session_id,
            message=response.message,
            metadata=response.metadata
        )
    
    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@router.post("/message-with-upload", response_model=ChatMessageResponse)
def send_message_with_upload(
    session_id: Optional[UUID] = None,
    message: str = "",
    file: Optional[UploadFile] = File(None),
    executor: AgentExecutor = Depends(get_agent_executor),
    db: Session = Depends(get_db),
    project_service: ProjectService = Depends(get_project_service),
    artifact_service: ArtifactService = Depends(get_artifact_service),
):
    """
    Send a message to the agent with optional audio file upload.
    
    Upload a source artifact into the session's project and process a message.
    
    Args:
        session_id: Optional session ID (creates new if not provided)
        message: User message
        file: Optional audio file to upload
        executor: Agent executor (injected)
        db: Database session
    Returns:
        ChatMessageResponse with agent's reply
    """
    from app.api.endpoints.project_artifacts import upload_source_audio
    
    # Create or use existing session
    session_id = session_id or uuid4()
    session_service = SessionService(db)
    
    # If file uploaded, process it first
    if file:
        logger.info(f"[CHAT] File upload detected | session={session_id} | filename={file.filename}")
        
        # Check if session already has a primary audio
        existing_audio = session_service.get_primary_audio(session_id)
        if existing_audio:
            logger.warning(
                f"[CHAT] Replacing existing source artifact | session={session_id} | "
                f"old_artifact_id={existing_audio.get('artifact_id')}"
            )
            # Option: Could return error here and require new session instead
        
        project_id = None
        if existing_audio and existing_audio.get("project_id"):
            project_id = UUID(existing_audio["project_id"])
        else:
            project = project_service.create_project(name=f"Chat Upload {file.filename or 'Audio'}")
            project_id = project.id

        # Upload audio into a real project scope
        logger.info(f"[CHAT] Uploading audio file | session={session_id}")
        upload_response = upload_source_audio(
            project_id=project_id,
            file=file,
            artifact_service=artifact_service,
            project_service=project_service,
            storage=get_storage(),
            conversion_service=get_conversion_service(),
        )
        source_artifact_id = str(upload_response.artifact_id)
        filename = upload_response.filename
        logger.info(
            f"[CHAT] Source audio uploaded | session={session_id} | artifact_id={source_artifact_id} | filename={filename}"
        )
        
        # Set as primary audio for this session
        session_service.set_primary_artifact(
            session_id=session_id,
            artifact_id=source_artifact_id,
            filename=filename,
            project_id=str(project_id),
        )
        logger.info(
            f"[CHAT] Set primary artifact | session={session_id} | artifact_id={source_artifact_id}"
        )
        
        # Update message to include audio context if message is empty
        if not message:
            message = f"I've uploaded an audio file: {filename}"
        else:
            message = f"I've uploaded an audio file: {filename}. {message}"
    
    logger.info(f"[CHAT] Processing message with upload | session={session_id} | message_length={len(message)}")
    
    try:
        # Process message
        logger.info(f"[CHAT] Starting agent processing | session={session_id}")
        response = executor.process_message(session_id, message)
        logger.info(f"[CHAT] Agent processing complete | session={session_id} | response_length={len(response.message)} | steps={response.metadata.get('steps', 'unknown')}")
        
        return ChatMessageResponse(
            session_id=session_id,
            message=response.message,
            metadata=response.metadata
        )
    
    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@router.get("/sessions/{session_id}/history")
def get_session_history(
    session_id: UUID,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get conversation history for a session.
    
    Args:
        session_id: Session UUID
        limit: Maximum number of steps to return
        db: Database session
    
    Returns:
        List of conversation steps
    """
    session_service = SessionService(db)
    
    # Check session exists
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    
    # Get history
    history = session_service.get_conversation_history(session_id, limit=limit)
    
    return {
        "session_id": str(session_id),
        "history": history
    }
