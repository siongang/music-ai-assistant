# Execution Plan - LLM Agent Implementation

**Goal**: Implement foundational LLM agent layer for Music Assistant  
**Timeline**: 1-2 days (focused implementation)  
**Scope**: Tool execution + LLM orchestration (NO symbolic music analysis)

---

## Prerequisites

- [ ] Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) fully
- [ ] Understand current codebase structure
- [ ] Have OpenAI API key ready (or Anthropic/local LLM)
- [ ] Database is running (PostgreSQL or SQLite)
- [ ] Redis is running
- [ ] Existing tests pass

---

## Implementation Phases

### Phase 1: Database Models & Migrations (2-3 hours)

#### Step 1.1: Create Session Model

**File**: `backend/app/models/session.py`

```python
"""Session model for agent conversations."""
import uuid
from sqlalchemy import Column, String, DateTime, TypeDecorator, JSON
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.job import GUID  # Reuse GUID type


class Session(Base):
    """
    Session model for agent conversations.
    
    Each session represents a conversation thread with the agent.
    
    **Beta Design: One primary audio per session**
    - Each session is scoped to a single primary audio file
    - The primary_audio_id is stored in metadata
    - All conversation actions implicitly refer to this audio
    - To work with a different audio, create a new session
    
    Sessions can be associated with users (future) and store metadata.
    """
    __tablename__ = "sessions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    
    # Future: Link to user when auth is implemented
    user_id = Column(GUID(), nullable=True)
    
    # Session metadata
    # Expected structure:
    # {
    #   "primary_audio_id": "uuid-string",
    #   "primary_audio_filename": "song.mp3",
    #   ... other metadata
    # }
    metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

**Test**:
```bash
# Create table manually for now
python -c "from app.db.session import engine; from app.models.session import Session; Session.__table__.create(engine)"
```

#### Step 1.2: Create AgentStep Model

**File**: `backend/app/models/agent_step.py`

```python
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
```

**Test**:
```bash
python -c "from app.db.session import engine; from app.models.agent_step import AgentStep; AgentStep.__table__.create(engine)"
```

#### Step 1.3: Update Model Imports

**File**: `backend/app/models/__init__.py`

```python
"""Database models."""
from app.models.audio import Audio
from app.models.job import Job
from app.models.session import Session
from app.models.agent_step import AgentStep

__all__ = ["Audio", "Job", "Session", "AgentStep"]
```

**Deliverable**: Database tables created, models importable

---

### Phase 2: Tool Layer (3-4 hours)

#### Step 2.1: Create Tool Base Class

**File**: `backend/app/agent/tools/base.py`

```python
"""Base tool class for agent tools."""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import jsonschema


class Tool(ABC):
    """
    Base class for agent tools.
    
    Each tool must define:
    - name: Unique tool identifier
    - description: What the tool does (shown to LLM)
    - parameters: JSON Schema for input validation
    - returns: JSON Schema for output (documentation only)
    
    And implement:
    - execute(**kwargs): Tool execution logic
    """
    
    name: str
    description: str
    parameters: Dict[str, Any]  # JSON Schema
    returns: Dict[str, Any]     # JSON Schema (for docs)
    
    @abstractmethod
    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the tool with given arguments.
        
        Args:
            **kwargs: Tool-specific arguments (validated against self.parameters)
        
        Returns:
            Dict with tool results
        
        Raises:
            ValueError: If arguments are invalid
            RuntimeError: If execution fails
        """
        pass
    
    def validate_inputs(self, kwargs: Dict[str, Any]):
        """Validate inputs against parameter schema."""
        try:
            jsonschema.validate(instance=kwargs, schema=self.parameters)
        except jsonschema.ValidationError as e:
            raise ValueError(f"Invalid arguments for {self.name}: {e.message}")
    
    def to_function_schema(self) -> Dict[str, Any]:
        """
        Convert tool to OpenAI function calling schema.
        
        Returns:
            Dict in OpenAI function calling format
        """
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters
            }
        }
```

**Dependencies**: `pip install jsonschema`

#### Step 2.2: Implement Core Tools

**File**: `backend/app/agent/tools/separate_stems_tool.py`

```python
"""Tool for separating audio into stems."""
from uuid import UUID, uuid4
from typing import Dict, Any
from app.agent.tools.base import Tool
from app.core.constants import JobType
from app.tasks.job_tasks import process_audio_job


class SeparateStemsTool(Tool):
    """Separate audio into individual stems (vocals, drums, bass, other)."""
    
    name = "separate_stems"
    description = (
        "Separate an audio file into individual stems: vocals, drums, bass, and other. "
        "This creates a background job that may take 1-5 minutes to complete. "
        "Returns a job_id that can be checked with get_job_status."
    )
    parameters = {
        "type": "object",
        "properties": {
            "audio_id": {
                "type": "string",
                "description": "UUID of the audio file to process"
            }
        },
        "required": ["audio_id"]
    }
    returns = {
        "type": "object",
        "properties": {
            "job_id": {"type": "string"},
            "status": {"type": "string"},
            "message": {"type": "string"}
        }
    }
    
    def __init__(self, job_service, audio_service):
        """
        Initialize tool with services.
        
        Args:
            job_service: JobService instance
            audio_service: AudioService instance
        """
        self.job_service = job_service
        self.audio_service = audio_service
    
    def execute(self, audio_id: str) -> Dict[str, Any]:
        """Create stem separation job."""
        try:
            audio_uuid = UUID(audio_id)
        except ValueError:
            raise ValueError(f"Invalid audio_id format: {audio_id}")
        
        # Validate audio exists
        audio_path = self.audio_service.get_audio_path(audio_uuid)
        if not audio_path:
            raise ValueError(f"Audio {audio_id} not found")
        
        # Create job
        job_id = uuid4()
        job = self.job_service.create_job(
            job_id=job_id,
            job_type=JobType.STEM_SEPARATION,
            input_data={"audio_id": audio_id},
            params={}
        )
        
        # Enqueue for processing
        process_audio_job.delay(str(job_id))
        
        return {
            "job_id": str(job_id),
            "status": "queued",
            "message": f"Stem separation job created. Use get_job_status('{job_id}') to check progress."
        }
```

**File**: `backend/app/agent/tools/convert_to_midi_tool.py`

```python
"""Tool for converting audio to MIDI."""
from uuid import UUID, uuid4
from typing import Dict, Any, Optional
from app.agent.tools.base import Tool
from app.core.constants import JobType
from app.tasks.job_tasks import process_audio_job


class ConvertToMidiTool(Tool):
    """Convert audio to MIDI format."""
    
    name = "convert_to_midi"
    description = (
        "Convert an audio file to MIDI format. This detects notes in the audio "
        "and creates a MIDI file and note events CSV. Creates a background job "
        "that may take 1-5 minutes. Returns a job_id to check status."
    )
    parameters = {
        "type": "object",
        "properties": {
            "audio_id": {
                "type": "string",
                "description": "UUID of the audio file to convert"
            },
            "midi_tempo": {
                "type": "integer",
                "description": "Optional tempo for the MIDI file (BPM). If not provided, tempo is detected.",
                "minimum": 30,
                "maximum": 300
            }
        },
        "required": ["audio_id"]
    }
    returns = {
        "type": "object",
        "properties": {
            "job_id": {"type": "string"},
            "status": {"type": "string"},
            "message": {"type": "string"}
        }
    }
    
    def __init__(self, job_service, audio_service):
        self.job_service = job_service
        self.audio_service = audio_service
    
    def execute(self, audio_id: str, midi_tempo: Optional[int] = None) -> Dict[str, Any]:
        """Create MIDI conversion job."""
        try:
            audio_uuid = UUID(audio_id)
        except ValueError:
            raise ValueError(f"Invalid audio_id format: {audio_id}")
        
        # Validate audio exists
        audio_path = self.audio_service.get_audio_path(audio_uuid)
        if not audio_path:
            raise ValueError(f"Audio {audio_id} not found")
        
        # Prepare params
        params = {}
        if midi_tempo is not None:
            params["midi_tempo"] = midi_tempo
        
        # Create job
        job_id = uuid4()
        job = self.job_service.create_job(
            job_id=job_id,
            job_type=JobType.MIDI_CONVERSION,
            input_data={"audio_id": audio_id},
            params=params
        )
        
        # Enqueue for processing
        process_audio_job.delay(str(job_id))
        
        return {
            "job_id": str(job_id),
            "status": "queued",
            "message": f"MIDI conversion job created. Use get_job_status('{job_id}') to check progress."
        }
```

**File**: `backend/app/agent/tools/get_job_status_tool.py`

```python
"""Tool for checking job status."""
from uuid import UUID
from typing import Dict, Any
from app.agent.tools.base import Tool


class GetJobStatusTool(Tool):
    """Get status and results of a processing job."""
    
    name = "get_job_status"
    description = (
        "Check the status of a processing job (stem separation, MIDI conversion, etc.). "
        "Returns the current status (queued, running, succeeded, failed), progress, "
        "and output files if completed."
    )
    parameters = {
        "type": "object",
        "properties": {
            "job_id": {
                "type": "string",
                "description": "UUID of the job to check"
            }
        },
        "required": ["job_id"]
    }
    returns = {
        "type": "object",
        "properties": {
            "job_id": {"type": "string"},
            "type": {"type": "string"},
            "status": {"type": "string"},
            "progress": {"type": "number"},
            "output": {"type": "object"},
            "error_message": {"type": "string"}
        }
    }
    
    def __init__(self, job_service):
        self.job_service = job_service
    
    def execute(self, job_id: str) -> Dict[str, Any]:
        """Get job status."""
        try:
            job_uuid = UUID(job_id)
        except ValueError:
            raise ValueError(f"Invalid job_id format: {job_id}")
        
        job = self.job_service.get_job(job_uuid)
        if not job:
            raise ValueError(f"Job {job_id} not found")
        
        result = {
            "job_id": str(job.id),
            "type": job.type,
            "status": job.status,
            "progress": job.progress
        }
        
        if job.output:
            result["output"] = job.output
        
        if job.error_message:
            result["error_message"] = job.error_message
        
        return result
```

**Stop Point**: Test each tool individually before continuing.

#### Step 2.3: Create Tool Registry

**File**: `backend/app/agent/tools/registry.py`

```python
"""Tool registry for agent."""
from typing import Dict, Any, List
from app.agent.tools.base import Tool
import logging

logger = logging.getLogger(__name__)


class ToolRegistry:
    """
    Central registry for agent tools.
    
    Manages tool registration, discovery, and execution.
    Provides tool schemas for LLM function calling.
    """
    
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
    
    def register(self, tool: Tool):
        """
        Register a tool.
        
        Args:
            tool: Tool instance to register
        """
        if tool.name in self._tools:
            logger.warning(f"Tool {tool.name} already registered, overwriting")
        
        self._tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
    
    def get(self, name: str) -> Tool:
        """
        Get a tool by name.
        
        Args:
            name: Tool name
        
        Returns:
            Tool instance
        
        Raises:
            ValueError: If tool not found
        """
        if name not in self._tools:
            raise ValueError(f"Unknown tool: {name}")
        return self._tools[name]
    
    def list_tools(self) -> List[str]:
        """Get list of registered tool names."""
        return list(self._tools.keys())
    
    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        """
        Get all tool schemas for LLM function calling.
        
        Returns:
            List of tool schemas in OpenAI function calling format
        """
        return [tool.to_function_schema() for tool in self._tools.values()]
    
    def execute(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """
        Execute a tool by name with arguments.
        
        Includes input validation and error handling.
        
        Args:
            tool_name: Name of tool to execute
            **kwargs: Tool arguments
        
        Returns:
            Tool execution result
        
        Raises:
            ValueError: If tool not found or arguments invalid
            RuntimeError: If tool execution fails
        """
        tool = self.get(tool_name)
        
        # Validate inputs
        tool.validate_inputs(kwargs)
        
        # Execute
        try:
            logger.info(f"Executing tool: {tool_name} with args: {kwargs}")
            result = tool.execute(**kwargs)
            logger.info(f"Tool {tool_name} completed successfully")
            return result
        except Exception as e:
            logger.error(f"Tool {tool_name} failed: {e}", exc_info=True)
            raise RuntimeError(f"Tool {tool_name} failed: {str(e)}") from e


def create_default_registry(job_service, audio_service) -> ToolRegistry:
    """
    Create and populate default tool registry.
    
    Args:
        job_service: JobService instance
        audio_service: AudioService instance
    
    Returns:
        Configured ToolRegistry
    """
    from app.agent.tools.separate_stems_tool import SeparateStemsTool
    from app.agent.tools.convert_to_midi_tool import ConvertToMidiTool
    from app.agent.tools.get_job_status_tool import GetJobStatusTool
    
    registry = ToolRegistry()
    
    # Register tools
    registry.register(SeparateStemsTool(job_service, audio_service))
    registry.register(ConvertToMidiTool(job_service, audio_service))
    registry.register(GetJobStatusTool(job_service))
    
    return registry
```

**Deliverable**: Tool registry with 3 working tools

---

### Phase 3: Agent Runtime (4-5 hours)

#### Step 3.1: Create Session Service

**File**: `backend/app/agent/session_service.py`

```python
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
        session = Session(id=uuid4(), metadata=metadata or {})
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
            session = Session(id=session_id, metadata={})
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
        if not session.metadata:
            session.metadata = {}
        
        session.metadata["primary_audio_id"] = audio_id
        if filename:
            session.metadata["primary_audio_filename"] = filename
        
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
        if not session or not session.metadata:
            return None
        
        audio_id = session.metadata.get("primary_audio_id")
        if not audio_id:
            return None
        
        result = {"audio_id": audio_id}
        if "primary_audio_filename" in session.metadata:
            result["filename"] = session.metadata["primary_audio_filename"]
        
        return result
```

#### Step 3.2: Create LLM Client

**File**: `backend/app/agent/llm_client.py`

```python
"""LLM client abstraction."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import os
import logging

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Response from LLM."""
    content: Optional[str] = None  # Text response
    tool_calls: Optional[List[Dict[str, Any]]] = None  # Tool calls
    finish_reason: str = "stop"  # stop, tool_calls, length, error


class LLMClient:
    """Base LLM client."""
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict]] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        """
        Send chat completion request.
        
        Args:
            messages: Conversation history
            tools: Available tools for function calling
            temperature: Sampling temperature
        
        Returns:
            LLMResponse
        """
        raise NotImplementedError


class OpenAIClient(LLMClient):
    """OpenAI API client."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4"):
        """
        Initialize OpenAI client.
        
        Args:
            api_key: OpenAI API key (or uses OPENAI_API_KEY env var)
            model: Model name (default: gpt-4)
        """
        try:
            import openai
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")
        
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key required (set OPENAI_API_KEY env var)")
        
        self.client = openai.OpenAI(api_key=self.api_key)
        self.model = model
        logger.info(f"Initialized OpenAI client with model: {model}")
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict]] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        """Send chat completion request to OpenAI."""
        try:
            kwargs = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature
            }
            
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"
            
            response = self.client.chat.completions.create(**kwargs)
            
            message = response.choices[0].message
            finish_reason = response.choices[0].finish_reason
            
            # Check if tool calls
            if message.tool_calls:
                tool_calls = []
                for tc in message.tool_calls:
                    import json
                    tool_calls.append({
                        "id": tc.id,
                        "name": tc.function.name,
                        "arguments": json.loads(tc.function.arguments)
                    })
                return LLMResponse(
                    tool_calls=tool_calls,
                    finish_reason="tool_calls"
                )
            
            # Regular text response
            return LLMResponse(
                content=message.content,
                finish_reason=finish_reason
            )
        
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}", exc_info=True)
            # Return generic user-safe error message (don't expose internal details)
            return LLMResponse(
                content="I'm having trouble processing your request right now. Please try again in a moment.",
                finish_reason="error"
            )


def create_llm_client(provider: str = "openai", **kwargs) -> LLMClient:
    """
    Create LLM client based on provider.
    
    Args:
        provider: LLM provider (openai, anthropic, local)
        **kwargs: Provider-specific arguments
    
    Returns:
        LLMClient instance
    """
    if provider == "openai":
        return OpenAIClient(**kwargs)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
```

**Dependencies**: `pip install openai`

#### Step 3.3: Create Agent Executor

**File**: `backend/app/agent/executor.py`

```python
"""Agent executor - main agent runtime loop."""
from uuid import UUID
from typing import Dict, Any
from dataclasses import dataclass
import logging

from app.agent.llm_client import LLMClient, LLMResponse
from app.agent.tools.registry import ToolRegistry
from app.agent.session_service import SessionService

logger = logging.getLogger(__name__)


@dataclass
class AgentResponse:
    """Response from agent."""
    message: str
    done: bool = True
    metadata: Dict[str, Any] = None


class AgentExecutor:
    """
    Main agent runtime.
    
    Orchestrates:
    - User message processing
    - LLM-based tool selection
    - Tool execution
    - Response generation
    """
    
    SYSTEM_PROMPT = """You are a music processing assistant. You help users process audio files using various tools.

Available capabilities:
- Separate audio into stems (vocals, drums, bass, other) using Demucs
- Convert audio to MIDI format using BasicPitch
- Check status of processing jobs

Important:
- Processing jobs run in the background and take 1-5 minutes
- Always create jobs first, then check their status
- You cannot analyze music theory yet (no chord detection, key detection, etc.)
- Be helpful and explain what you're doing

Audio context:
- This chat session is scoped to ONE primary audio file (provided below)
- When the user says "the song", "the audio", "that file", "it", or similar references, they mean the primary audio for this session
- You should use the primary audio_id automatically - do not ask the user for it
- If the user explicitly provides a different audio_id, use that instead
- The primary audio context will be provided in the system prompt below

When users ask to process audio, use the appropriate tool and explain what's happening."""
    
    def __init__(
        self,
        llm_client: LLMClient,
        tool_registry: ToolRegistry,
        session_service: SessionService,
        max_steps: int = 10
    ):
        """
        Initialize agent executor.
        
        Args:
            llm_client: LLM client for reasoning
            tool_registry: Tool registry for execution
            session_service: Session service for state management
            max_steps: Maximum steps per request (safety limit)
        """
        self.llm = llm_client
        self.tools = tool_registry
        self.sessions = session_service
        self.max_steps = max_steps
    
    def process_message(self, session_id: UUID, user_message: str) -> AgentResponse:
        """
        Process user message and return agent response.
        
        This is the main agent loop:
        1. Load session context
        2. Add user message to history
        3. Run agent reasoning loop (up to max_steps)
        4. Return final response
        
        Args:
            session_id: Session UUID
            user_message: User's message
        
        Returns:
            AgentResponse with final message
        """
        logger.info(f"Processing message for session {session_id}")
        
        # Ensure session exists
        session = self.sessions.get_or_create_session(session_id)
        
        # Log user message
        self.sessions.add_step(
            session_id,
            step_type="user_message",
            content={"role": "user", "content": user_message}
        )
        
        # Get conversation history for LLM
        # Note: get_messages_for_llm already includes the user message we just logged,
        # so we don't need to append it again
        conversation_messages = self.sessions.get_messages_for_llm(session_id)
        
        # Agent loop
        step_count = 0
        tool_results = []  # Track tool results for this turn
        
        # Get primary audio for this session
        primary_audio = self.sessions.get_primary_audio(session_id)
        
        while step_count < self.max_steps:
            step_count += 1
            logger.debug(f"Agent step {step_count}/{self.max_steps}")
            
            # Build system prompt with primary audio context
            system_prompt = self.SYSTEM_PROMPT
            if primary_audio:
                audio_context = "\n\n**Active Audio Context:**\n"
                audio_context += f"- audio_id: {primary_audio['audio_id']}\n"
                if "filename" in primary_audio:
                    audio_context += f"- filename: {primary_audio['filename']}\n"
                audio_context += "\nWhen the user refers to 'the song', 'the audio', 'that file', 'it', or similar, "
                audio_context += f"they mean this audio (audio_id: {primary_audio['audio_id']}). "
                audio_context += "Use this audio_id automatically in tool calls unless the user explicitly provides a different one."
                system_prompt = system_prompt + audio_context
            else:
                # No primary audio set - inform LLM to ask user to upload
                system_prompt = system_prompt + "\n\n**Note:** No audio file has been uploaded for this session yet. If the user asks to process audio, ask them to upload an audio file first."
            
            # Build messages with system prompt
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(conversation_messages)
            
            # Add tool results if any
            if tool_results:
                tool_summary = "Tool results:\n" + "\n".join([
                    f"- {tr['tool']}: {tr['result']}"
                    for tr in tool_results
                ])
                messages.append({
                    "role": "user",
                    "content": tool_summary
                })
            
            # Get next action from LLM
            llm_response = self.llm.chat(
                messages=messages,
                tools=self.tools.get_tool_schemas(),
                temperature=0.7
            )
            
            # Handle response
            if llm_response.tool_calls:
                # Execute tools
                for tool_call in llm_response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["arguments"]
                    
                    logger.info(f"Executing tool: {tool_name} with args: {tool_args}")
                    
                    # Log tool call
                    self.sessions.add_step(
                        session_id,
                        step_type="tool_call",
                        content={
                            "tool": tool_name,
                            "arguments": tool_args
                        }
                    )
                    
                    # Execute tool
                    try:
                        result = self.tools.execute(tool_name, **tool_args)
                        
                        # Log result
                        self.sessions.add_step(
                            session_id,
                            step_type="tool_result",
                            content={
                                "tool": tool_name,
                                "result": result
                            }
                        )
                        
                        # Track for next LLM call
                        tool_results.append({
                            "tool": tool_name,
                            "result": result
                        })
                        
                    except Exception as e:
                        error_msg = str(e)
                        logger.error(f"Tool {tool_name} failed: {error_msg}")
                        
                        # Log error
                        self.sessions.add_step(
                            session_id,
                            step_type="error",
                            content={
                                "tool": tool_name,
                                "error": error_msg
                            }
                        )
                        
                        # Track error for next LLM call
                        tool_results.append({
                            "tool": tool_name,
                            "error": error_msg
                        })
                
                # Continue loop to let LLM respond to user
                continue
            
            elif llm_response.content:
                # LLM has final response for user
                response_text = llm_response.content
                
                # Log agent response
                self.sessions.add_step(
                    session_id,
                    step_type="agent_response",
                    content={
                        "role": "assistant",
                        "content": response_text
                    }
                )
                
                return AgentResponse(
                    message=response_text,
                    done=True,
                    metadata={
                        "steps": step_count,
                        "tools_used": [tr["tool"] for tr in tool_results]
                    }
                )
            
            else:
                # Unexpected response
                logger.error(f"Unexpected LLM response: {llm_response}")
                return AgentResponse(
                    message="I encountered an error processing your request.",
                    done=True
                )
        
        # Max steps reached
        logger.warning(f"Max steps ({self.max_steps}) reached for session {session_id}")
        return AgentResponse(
            message="I need more steps to complete this task. Please try rephrasing your request.",
            done=False,
            metadata={"steps": step_count, "max_steps_reached": True}
        )
```

**Deliverable**: Working agent executor with tool execution

---

### Phase 4: API Endpoints (2-3 hours)

#### Step 4.1: Create Agent API Endpoints

**File**: `backend/app/api/endpoints/chat.py`

```python
"""Chat/Agent API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status as http_status
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from app.db.session import get_db
from app.services.job_service import JobService
from app.services.audio_service import AudioService
from app.agent.executor import AgentExecutor
from app.agent.session_service import SessionService
from app.agent.llm_client import create_llm_client
from app.agent.tools.registry import create_default_registry
from app.storage.local_storage import LocalStorage

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


# Dependency for creating agent executor
def get_agent_executor(db: Session = Depends(get_db)) -> AgentExecutor:
    """
    Create AgentExecutor instance.
    
    This is called for each request to ensure fresh services.
    """
    # Create services
    job_service = JobService(db)
    audio_service = AudioService(db)
    session_service = SessionService(db)
    
    # Create tool registry
    tool_registry = create_default_registry(job_service, audio_service)
    
    # Create LLM client
    llm_client = create_llm_client(provider="openai")
    
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
    
    logger.info(f"Processing chat message for session {session_id}")
    
    try:
        # Process message
        response = executor.process_message(session_id, request.message)
        
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


# Optional: Enhanced endpoint with file upload support
# Note: This requires get_audio_service and get_storage dependencies
# Add these if not already present:
# def get_audio_service(db: Session = Depends(get_db)) -> AudioService:
#     return AudioService(db)
# def get_storage() -> LocalStorage:
#     from app.core.constants import STORAGE_ROOT
#     from pathlib import Path
#     return LocalStorage(root=Path(STORAGE_ROOT))

@router.post("/message-with-upload", response_model=ChatMessageResponse)
def send_message_with_upload(
    session_id: Optional[UUID] = None,
    message: str = "",
    file: Optional[UploadFile] = File(None),
    executor: AgentExecutor = Depends(get_agent_executor),
    db: Session = Depends(get_db),
    audio_service: AudioService = Depends(get_audio_service),
    storage: LocalStorage = Depends(get_storage)
):
    """
    Send a message to the agent with optional audio file upload.
    
    **Beta Design: One audio per session**
    - If a file is uploaded, it becomes the primary audio for this session
    - If the session already has a primary audio, uploading a new file replaces it
    - For a cleaner UX, consider creating a new session for new audio (Option A)
    
    Args:
        session_id: Optional session ID (creates new if not provided)
        message: User message
        file: Optional audio file to upload
        executor: Agent executor (injected)
        db: Database session
        audio_service: Audio service (injected)
        storage: Storage service (injected)
    
    Returns:
        ChatMessageResponse with agent's reply
    """
    from app.api.endpoints.audio import upload_audio  # Reuse upload logic
    
    # Create or use existing session
    session_id = session_id or uuid4()
    session_service = SessionService(db)
    
    # If file uploaded, process it first
    if file:
        logger.info(f"Processing file upload in session {session_id}")
        
        # Check if session already has a primary audio
        existing_audio = session_service.get_primary_audio(session_id)
        if existing_audio:
            logger.warning(f"Session {session_id} already has primary audio {existing_audio['audio_id']}. Replacing with new upload.")
            # Option: Could return error here and require new session instead
        
        # Upload audio (reuse existing upload endpoint logic)
        audio_response = upload_audio(file=file, audio_service=audio_service, storage=storage)
        audio_id = str(audio_response.audio_id)
        filename = audio_response.filename
        
        # Set as primary audio for this session
        session_service.set_primary_audio(session_id, audio_id, filename)
        
        # Update message to include audio context if message is empty
        if not message:
            message = f"I've uploaded an audio file: {filename}"
        else:
            message = f"I've uploaded an audio file: {filename}. {message}"
    
    logger.info(f"Processing chat message for session {session_id}")
    
    try:
        # Process message
        response = executor.process_message(session_id, message)
        
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
```

#### Step 4.2: Add Chat Router to Main API

**File**: `backend/app/api/router.py`

Update to include chat router:

```python
"""API router configuration."""
from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.endpoints.jobs import router as jobs_router
from app.api.endpoints.audio import router as audio_router
from app.api.endpoints.chat import router as chat_router  # NEW

# Main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health_router)
api_router.include_router(audio_router)
api_router.include_router(jobs_router)
api_router.include_router(chat_router)  # NEW
```

**Deliverable**: Working API endpoints for agent

---

### Phase 5: Testing & Validation (2-3 hours)

#### Step 5.1: Unit Tests

Create test files:
- `backend/tests/test_tools.py` - Test individual tools
- `backend/tests/test_tool_registry.py` - Test tool registry
- `backend/tests/test_session_service.py` - Test session management
- `backend/tests/test_agent_executor.py` - Test agent loop (mocked LLM)

#### Step 5.2: Integration Test

**File**: `backend/test_agent_integration.py`

```python
"""Integration test for agent system."""
import requests
import time
import os

BASE_URL = "http://localhost:8000/api"

def test_full_workflow():
    """Test complete agent workflow."""
    
    # 1. Upload audio (use existing endpoint)
    print("1. Uploading audio...")
    with open("test_audio.mp3", "rb") as f:
        response = requests.post(
            f"{BASE_URL}/audio",
            files={"file": f}
        )
    assert response.status_code == 200
    audio_id = response.json()["audio_id"]
    print(f"   Audio ID: {audio_id}")
    
    # 2. Create session
    print("2. Creating session...")
    response = requests.post(f"{BASE_URL}/chat/sessions")
    assert response.status_code == 200
    session_id = response.json()["session_id"]
    print(f"   Session ID: {session_id}")
    
    # 3. Ask agent to separate stems
    print("3. Asking agent to separate stems...")
    response = requests.post(
        f"{BASE_URL}/chat/message",
        json={
            "session_id": session_id,
            "message": f"Separate audio {audio_id} into stems"
        }
    )
    assert response.status_code == 200
    agent_response = response.json()
    print(f"   Agent: {agent_response['message']}")
    
    # Extract job_id from response
    # (Agent should mention job_id in response)
    
    # 4. Ask agent for job status
    print("4. Checking job status...")
    time.sleep(2)  # Wait a bit
    response = requests.post(
        f"{BASE_URL}/chat/message",
        json={
            "session_id": session_id,
            "message": "What's the status of that job?"
        }
    )
    assert response.status_code == 200
    print(f"   Agent: {response.json()['message']}")
    
    # 5. Get session history
    print("5. Getting session history...")
    response = requests.get(f"{BASE_URL}/chat/sessions/{session_id}/history")
    assert response.status_code == 200
    history = response.json()["history"]
    print(f"   History has {len(history)} steps")
    
    print("\n✅ Integration test passed!")

if __name__ == "__main__":
    test_full_workflow()
```

Run with:
```bash
python backend/test_agent_integration.py
```

#### Step 5.3: Manual Testing

Test scenarios:
1. Upload audio → Ask agent to separate stems → Check status
2. Upload audio → Ask agent to convert to MIDI → Check status
3. Ask agent "What key is this in?" → Should say it can't do that yet
4. Ask agent nonsense → Should handle gracefully
5. Create multiple sessions → Verify isolation

---

### Phase 6: Documentation & Polish (2 hours)

#### Step 6.1: Create Tool Documentation

See [`docs/TOOLS.md`](./TOOLS.md) (created separately)

#### Step 6.2: Create Agent Documentation

See [`docs/AGENT.md`](./AGENT.md) (created separately)

#### Step 6.3: Update Main README

Update root README to reflect new agent capabilities.

#### Step 6.4: Create Environment Template

**File**: `backend/.env.example`

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/music_assistant
# Or for SQLite: sqlite:///./test.db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Storage
STORAGE_ROOT=./tmp

# LLM
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai
LLM_MODEL=gpt-4

# Agent Configuration
MAX_AGENT_STEPS=10
TOOL_TIMEOUT=30
```

---

## Testing Strategy

### Unit Tests
- Each tool (mocked services)
- Tool registry
- Session service
- Agent executor (mocked LLM)

### Integration Tests
- Full workflow: upload → chat → separate → check status
- Session isolation
- Error handling

### Manual Tests
- All supported use cases
- Edge cases (invalid inputs, missing audio, etc.)
- Concurrent sessions

---

## Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Database migrations (Session, AgentStep tables)
- [ ] OpenAI API key configured
- [ ] Docker compose updated (if using)
- [ ] Documentation complete

---

## Known Limitations & Future Work

### Current Limitations

1. **One audio per session (Beta Design)** - Each chat session is scoped to a single primary audio file
   - Users must create a new session to work with a different audio
   - This eliminates ambiguity and keeps the agent simple and reliable
   - Future (v3+): Support multiple audios per session with explicit labeling

2. **No job polling** - Agent doesn't automatically wait for jobs to complete
   - User must manually ask for status
   - Future: Add job completion notifications

3. **No multi-turn tool orchestration** - Agent can't automatically chain tools
   - Example: "Convert to MIDI and analyze chords" would require two separate requests
   - Future: Allow more complex workflows

4. **No symbolic music analysis** - Agent can't answer music theory questions
   - Explicitly deferred to v3.0
   - Architecture supports adding this layer

5. **No authentication** - All sessions are anonymous
   - Future: Add user auth, link sessions to users

6. **No streaming responses** - Agent returns complete response only
   - Future: Add SSE streaming for better UX

### Future Enhancements (v3.0+)

1. **Symbolic Music Analysis Service**
   - MIDI → structured harmony JSON
   - New tools: `analyze_chords`, `detect_key`, `extract_melody`
   - LLM can reason over structured data

2. **Job Completion Webhooks**
   - Agent notified when jobs complete
   - Can proactively inform user

3. **Multi-Modal Input**
   - Accept YouTube URLs, Spotify links
   - Automatic audio download and processing

4. **Multi-Audio Session Support**
   - Support multiple audios per session with explicit labeling
   - Agent can ask clarifying questions when references are ambiguous
   - Extend session metadata to track audio history with labels (e.g., "original", "remix")

5. **Agent Learning**
   - Learn from successful tool sequences
   - Suggest workflows

---

## Troubleshooting

### Agent Not Calling Tools

**Symptom**: Agent responds with text but never calls tools

**Causes**:
1. Tool schemas malformed (check `get_tool_schemas()` output)
2. System prompt not clear about tool usage
3. LLM temperature too low (set to 0.7)

**Fix**: Log LLM request/response to debug

### Tools Failing

**Symptom**: Tools raise exceptions

**Causes**:
1. Services not properly injected
2. Audio/job not found in database
3. Celery not running

**Fix**: Check tool execution logs, verify database state

### Sessions Not Persisting

**Symptom**: Session history lost between requests

**Causes**:
1. Database not properly configured
2. Session/AgentStep tables not created
3. Database connection issues

**Fix**: Check database logs, verify tables exist

### LLM Responses Malformed

**Symptom**: Agent returns errors about parsing LLM response

**Causes**:
1. LLM API key invalid/expired
2. Rate limiting
3. Model doesn't support function calling (use gpt-4, not gpt-3.5-turbo-instruct)

**Fix**: Verify API key, check OpenAI status page

---

## Success Criteria

✅ **Phase 1 Complete** when:
- Session and AgentStep tables created
- Models importable and testable

✅ **Phase 2 Complete** when:
- All 3 tools work independently
- Tool registry can execute tools by name
- Input validation works

✅ **Phase 3 Complete** when:
- Agent executor runs without errors
- LLM can call tools
- Conversation history persists

✅ **Phase 4 Complete** when:
- API endpoints respond correctly
- Can send messages via HTTP
- Session history retrievable

✅ **Phase 5 Complete** when:
- Integration test passes end-to-end
- Manual testing covers all scenarios
- Error handling robust

✅ **Phase 6 Complete** when:
- Documentation complete
- README updated
- Environment template created

---

## Final Checklist

### Code
- [ ] All models created and tested
- [ ] All tools implemented and tested
- [ ] Tool registry working
- [ ] Session service working
- [ ] Agent executor working
- [ ] API endpoints working
- [ ] Integration test passing

### Documentation
- [ ] ARCHITECTURE.md complete
- [ ] EXECUTION_PLAN.md complete (this file)
- [ ] AGENT.md complete
- [ ] TOOLS.md complete
- [ ] README.md updated
- [ ] .env.example created

### Testing
- [ ] Unit tests written
- [ ] Integration test passing
- [ ] Manual testing complete
- [ ] Error cases handled

### Deployment
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Docker setup (if applicable)
- [ ] OpenAI API key configured

---

**When all checkboxes are complete, the foundational LLM agent is ready for production use.**
