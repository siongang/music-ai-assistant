"""AgentStep model for logging agent actions."""
import uuid
from sqlalchemy import Column, String, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.job import GUID


class AgentStep(Base):
    """
    Agent step model for logging all agent actions.
    
    Each step represents a single action in the agent's reasoning loop:
    - user_message: Message from user
    - tool_call: Agent decided to call a tool
    - tool_result: Result from tool execution
    - agent_response: Agent's final response to user
    - error: Error that occurred during processing
    """
    __tablename__ = "agent_steps"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    
    # Link to session
    session_id = Column(GUID(), ForeignKey("sessions.id"), nullable=False, index=True)
    
    # Step number within session (for ordering)
    step_number = Column(Integer, nullable=False)
    
    # Step type: user_message, tool_call, tool_result, agent_response, error
    step_type = Column(String, nullable=False)
    
    # Step content (flexible JSON)
    # Examples:
    #   user_message: {"role": "user", "content": "separate stems"}
    #   tool_call: {"tool": "separate_stems", "args": {"audio_id": "..."}}
    #   tool_result: {"tool": "separate_stems", "result": {"job_id": "..."}}
    #   agent_response: {"role": "assistant", "content": "I've started..."}
    #   error: {"tool": "separate_stems", "error": "Audio not found"}
    content = Column(JSON, nullable=False)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
