# Music Assistant - System Architecture

**Date**: January 17, 2026  
**Status**: Foundational LLM Agent Architecture  
**Version**: 2.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Vision & Scope](#project-vision--scope)
3. [Current State Analysis](#current-state-analysis)
4. [Target Architecture](#target-architecture)
5. [Component Specifications](#component-specifications)
6. [Data Flow](#data-flow)
7. [API Contracts](#api-contracts)
8. [Future Extensions](#future-extensions)
9. [Security & Safety](#security--safety)
10. [Deployment](#deployment)

---

## Executive Summary

Music Assistant is pivoting from a purely LLM-centric music understanding system to a **hybrid digital tool platform** that:

1. **Now**: Provides AI/ML music processing tools (Demucs, BasicPitch) with conversational LLM orchestration
2. **Future**: Will add symbolic music analysis layer (MIDI → structured harmony) for deep music reasoning

### Key Architectural Principles

- **No external agent frameworks** (no LangChain, LlamaIndex, etc.)
- **Jobs are source of truth** for all long-running compute
- **Strict separation of concerns** (API, Agent, Tools, Audio Engine, Infrastructure)
- **Docker-first** development and deployment
- **Explicit tool registry** with clear input/output contracts
- **Future-proof** - architecture allows symbolic analysis layer addition without rewrites

---

## Project Vision & Scope

### Current Direction (v2.0 - Foundational)

We are building a **digital music processing platform** where:

- Users can run AI/ML models (stem separation, audio-to-MIDI conversion)
- An LLM agent orchestrates workflows, monitors jobs, and explains results
- The agent is **dumb about music theory** but reliable about tool execution
- All heavy compute happens through the job system (async, retryable, observable)

**What We Ship Now:**
- Tool execution framework (deterministic, job-backed)
- LLM agent runtime (tool selection, job monitoring, user communication)
- Conversational interface (chat/session management)
- Existing audio processing tools (Demucs, BasicPitch)

**What We Explicitly Defer:**
- Symbolic music analysis (chord extraction, harmonic function, key detection)
- Deep music theory reasoning by LLM
- Learning/ML-assisted theory extraction

### Future Direction (v3.0+ - Symbolic Analysis)

The architecture **must support** but **not implement**:

- A new **symbolic music analysis service** that converts raw MIDI/CSV into structured representations:
  - Chord progressions with Roman numeral analysis
  - Key and modulation detection
  - Harmonic function labeling
  - Melodic contour analysis
- LLM reasoning over structured music data (not raw note events)
- Potentially: music theory knowledge graph, pattern recognition, style analysis

**Architectural Insertion Point:**
```
Audio → Demucs → stems
      → BasicPitch → MIDI/CSV → [FUTURE: Symbolic Analysis Service] → Structured JSON
                                                                      ↓
                                                       LLM reasons over this
```

---

## Current State Analysis

### Existing Components

#### 1. FastAPI Backend (`app/main.py`, `app/api/`)

**Status**: ✅ Solid foundation

**Responsibilities**:
- HTTP request handling
- Request validation (Pydantic schemas)
- Response formatting
- Authentication placeholder (future)

**Current Endpoints**:
- `POST /api/audio` - Upload audio files
- `POST /api/jobs` - Create processing jobs
- `GET /api/jobs/{job_id}` - Get job status
- `GET /api/jobs` - List jobs (filtered, paginated)
- `GET /api/audio/files/{path}` - Download result files
- `GET /health` - Health check

**Assessment**: Well-structured, clean separation. Ready for agent endpoints.

#### 2. Job System (`app/models/job.py`, `app/services/job_service.py`)

**Status**: ✅ Production-ready (Celery-based)

**Database Schema**:
```sql
jobs (
  id UUID PRIMARY KEY,
  type VARCHAR (stem_separation, midi_conversion, etc.),
  status VARCHAR (queued, running, succeeded, failed),
  input JSONB ({"audio_id": "..."}),
  params JSONB ({"model": "demucs_v4"}),
  output JSONB ({"vocals": "path/...", "drums": "path/..."}),
  progress FLOAT (0.0 to 1.0),
  error_message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Workflow**:
1. Job created with status="queued"
2. Celery task picks up job from Redis queue
3. Status updated to "running"
4. Processing occurs (with retries on transient errors)
5. Status updated to "succeeded" or "failed" with output/error_message

**Assessment**: Excellent foundation for tool execution. Jobs provide:
- Async execution (don't block API)
- Retry logic (transient failures)
- Observable state (progress, status)
- Result persistence (output in database)

**Gaps for Agent Layer**:
- No job cancellation mechanism (minor)
- No job metadata for agent context (e.g., "triggered_by_session_id")

#### 3. Audio Processing Engine (`app/audio_engine/`, `app/services/`)

**Status**: ✅ Working, needs cleanup

**Current Tools**:
- **Demucs** (stem separation) - Mature, reliable
- **BasicPitch** (audio-to-MIDI) - Working, returns raw MIDI + CSV

**Service Layer**:
- `StemService` - Wraps Demucs
- `MidiService` - Wraps BasicPitch
- `PipelineRunnerService` - Orchestrates processing

**Assessment**: Good separation between service layer and underlying models. Ready to be wrapped as "tools" for agent.

#### 4. Storage (`app/storage/`)

**Status**: ✅ Solid abstraction

**Current Implementation**: `LocalStorage` (filesystem-based)

**File Organization**:
```
storage_root/
├── audio/{audio_id}/{filename}        # Uploaded audio
└── jobs/{job_id}/
    ├── stems/{track}.{stem}.mp3       # Stem separation output
    └── midi/{track}.mid               # MIDI conversion output
         {track}_notes.csv             # Note events CSV
```

**Assessment**: Clean interface. Easy to swap for S3/Azure in future. Good.

#### 5. Database (`app/db/`, `app/models/`)

**Status**: ✅ PostgreSQL/SQLite dual-support

**Models**:
- `Audio` - Uploaded audio metadata
- `Job` - Processing jobs (core model)

**Session Management**: FastAPI dependency injection (`get_db()`)

**Assessment**: Clean SQLAlchemy setup. Ready for new models (Session, AgentStep, etc.)

### Architectural Risks

#### 🔴 Critical Issues

**None** - The current foundation is solid.

#### ⚠️ Potential Coupling Risks

1. **Job Type Hardcoding**:
   - Job types are defined as constants (`JobType.STEM_SEPARATION`, etc.)
   - Risk: Adding new tools requires code changes in multiple places
   - **Mitigation**: Introduce dynamic tool registry (see below)

2. **No Agent Layer**:
   - Currently no concept of sessions, conversations, or agent state
   - Risk: Adding LLM features ad-hoc would create spaghetti
   - **Mitigation**: Design agent layer upfront (this document)

3. **BasicPitch Output Not LLM-Friendly**:
   - Raw MIDI and CSV note events are not suitable for LLM reasoning
   - Risk: Trying to use current outputs for music understanding will fail
   - **Mitigation**: Clearly mark this as out-of-scope until symbolic analysis layer exists

4. **No Observability for Agent Actions**:
   - No logging/tracing for agent decisions
   - Risk: Debugging agent behavior will be hard
   - **Mitigation**: Build observability into agent layer from day 1

### Strengths

✅ **Clean layering** (API → Services → Audio Engine)  
✅ **Job system** is robust and battle-tested  
✅ **Storage abstraction** makes cloud migration easy  
✅ **Celery integration** provides reliable async execution  
✅ **Database-first** approach (jobs are source of truth)  
✅ **Docker-ready** (env-based config, no hardcoded paths)

---

## Target Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER / CLIENT                               │
│                     (Web UI, API Client, CLI)                        │
└────────────────────────────────────┬────────────────────────────────┘
                                     │ HTTP
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FASTAPI LAYER                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │  /audio    │  │  /jobs     │  │  /chat     │  │  /sessions   │ │
│  │  endpoints │  │  endpoints │  │  endpoints │  │  endpoints   │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────┘ │
│                                                                      │
│  Responsibilities: Request validation, Auth (future), Response fmt  │
└────────────────────┬──────────────────────────────┬─────────────────┘
                     │                              │
         ┌───────────┴────────┐          ┌─────────┴──────────┐
         ▼                    ▼          ▼                    ▼
┌────────────────┐   ┌────────────────────────────────────────────────┐
│  Audio/Job     │   │          AGENT LAYER (NEW)                     │
│  Services      │   │  ┌──────────────────────────────────────┐     │
│  (Existing)    │   │  │  Agent Runtime                        │     │
│                │   │  │  - Tool selection (via LLM)           │     │
│                │   │  │  - Step execution (guarded, limited)  │     │
│                │   │  │  - State management (session-scoped)  │     │
│                │   │  └──────────────────────────────────────┘     │
│                │   │                    │                           │
│                │   │  ┌─────────────────┴────────────────────┐     │
│                │   │  │  Tool Registry                        │     │
│                │   │  │  - Tool definitions (name, schema)    │     │
│                │   │  │  - Execution layer (timeout, retries) │     │
│                │   │  │  - Result formatting                  │     │
│                │   │  └──────────────────────────────────────┘     │
│                │   │                                                │
│                │   │  Components: SessionService, AgentExecutor,   │
│                │   │              ToolRegistry, LLMClient           │
└────────┬───────┘   └────────────────────┬───────────────────────────┘
         │                                │
         │  ┌────────────────────────────┴────────────────────────┐
         │  │                                                      │
         ▼  ▼                                                      ▼
┌──────────────────────┐                          ┌─────────────────────────┐
│   TOOL LAYER (NEW)   │                          │   LLM PROVIDER          │
│  ┌────────────────┐  │                          │  (OpenAI, Anthropic,    │
│  │ Tool: Separate │  │                          │   Local Models)         │
│  │   Stems        │  │                          └─────────────────────────┘
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Tool: Convert  │  │
│  │   to MIDI      │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Tool: Get Job  │  │
│  │   Status       │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ [Future] Tool: │  │
│  │ Analyze Chords │  │
│  └────────────────┘  │
│                      │
│  Each tool wraps     │
│  existing services   │
│  or creates jobs     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    JOB SYSTEM (Celery + Redis)                       │
│  - process_audio_job task                                            │
│  - Job status management                                             │
│  - Retry logic                                                       │
└──────────┬───────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│               AUDIO PROCESSING ENGINE (Existing)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Demucs       │  │ BasicPitch   │  │ PipelineRunnerService    │  │
│  │ (Stem Sep)   │  │ (MIDI Conv)  │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└──────────┬───────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    STORAGE & DATABASE                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │
│  │ PostgreSQL     │  │ Local Storage  │  │ Redis (Queue)      │    │
│  │ - audio        │  │ - audio files  │  │ - Task queue       │    │
│  │ - jobs         │  │ - job outputs  │  │ - Task results     │    │
│  │ - sessions(NEW)│  │                │  │                    │    │
│  │ - agent_steps  │  │                │  │                    │    │
│  │   (NEW)        │  │                │  │                    │    │
│  └────────────────┘  └────────────────┘  └────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Additions

#### 1. Agent Layer (NEW)

**Location**: `app/agent/`

**Components**:
- `AgentExecutor` - Main agent runtime loop
- `SessionService` - Session/conversation state management
- `ToolRegistry` - Central tool registration and discovery
- `LLMClient` - Abstraction over LLM providers (OpenAI, Anthropic, etc.)

**Responsibilities**:
- Accept user messages
- Determine appropriate tool(s) to call using LLM
- Execute tools (create jobs, query status, etc.)
- Monitor job completion
- Formulate responses to user

**Non-responsibilities**:
- Understanding music theory (explicitly out of scope)
- Blocking on long-running compute (delegate to jobs)
- Making up data (must query tools/jobs for facts)

#### 2. Tool Layer (NEW)

**Location**: `app/agent/tools/`

**Tool Interface**:
```python
class Tool:
    name: str
    description: str
    parameters: JSONSchema  # Input schema
    returns: JSONSchema     # Output schema
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute tool and return result"""
        pass
```

**Initial Tools**:

1. **`separate_stems`**
   - Description: Separate audio into vocals, drums, bass, other
   - Input: `audio_id` (UUID)
   - Action: Create job with type=stem_separation
   - Output: `job_id` (UUID)

2. **`convert_to_midi`**
   - Description: Convert audio to MIDI and note events
   - Input: `audio_id` (UUID), optional `midi_tempo` (int)
   - Action: Create job with type=midi_conversion
   - Output: `job_id` (UUID)

3. **`get_job_status`**
   - Description: Check status and results of a job
   - Input: `job_id` (UUID)
   - Action: Query database
   - Output: `status`, `progress`, `output` (if succeeded)

4. **`list_jobs`**
   - Description: List recent jobs for context
   - Input: Optional `status` filter, `limit`
   - Action: Query database
   - Output: List of job summaries

5. **`get_audio_info`**
   - Description: Get metadata about uploaded audio
   - Input: `audio_id` (UUID)
   - Action: Query database
   - Output: `filename`, `created_at`, `file_path`

**Future Tools** (v3.0+):

6. **`analyze_chords`** (requires symbolic analysis service)
7. **`detect_key`** (requires symbolic analysis service)
8. **`extract_melody`** (requires symbolic analysis service)

#### 3. New Database Models

**Session** (`app/models/session.py`):
```python
class Session(Base):
    id: UUID
    user_id: UUID (nullable for now)
    created_at: datetime
    last_activity_at: datetime
    metadata: JSONB (e.g., {"context": {...}})
```

**AgentStep** (`app/models/agent_step.py`):
```python
class AgentStep(Base):
    id: UUID
    session_id: UUID (foreign key)
    step_number: int
    step_type: str (user_message, tool_call, agent_response, error)
    content: JSONB
    created_at: datetime
```

**Purpose**:
- Full observability of agent behavior
- Debugging conversation flows
- Replay/audit capability
- Future: learning from successful patterns

---

## Component Specifications

### Agent Executor

**File**: `app/agent/executor.py`

**Pseudocode**:

```python
class AgentExecutor:
    def __init__(self, llm_client, tool_registry, session_service, max_steps=10):
        self.llm = llm_client
        self.tools = tool_registry
        self.sessions = session_service
        self.max_steps = max_steps
    
    def process_message(self, session_id: UUID, user_message: str) -> AgentResponse:
        """
        Process a user message and return agent response.
        
        This is the main agent loop. It:
        1. Loads session context
        2. Adds user message to history
        3. Runs agent loop (tool calls, LLM reasoning) up to max_steps
        4. Returns final response to user
        """
        session = self.sessions.get_or_create(session_id)
        self.sessions.add_message(session_id, role="user", content=user_message)
        
        step_count = 0
        while step_count < self.max_steps:
            step_count += 1
            
            # Get next action from LLM
            action = self._get_next_action(session)
            
            if action.type == "respond":
                # Agent has final response for user
                response_text = action.content
                self.sessions.add_message(session_id, role="assistant", content=response_text)
                return AgentResponse(message=response_text, done=True)
            
            elif action.type == "tool_call":
                # Execute tool
                tool_name = action.tool_name
                tool_args = action.tool_args
                
                # Log step
                self.sessions.add_step(
                    session_id, 
                    step_type="tool_call", 
                    content={"tool": tool_name, "args": tool_args}
                )
                
                # Execute (with timeout and error handling)
                try:
                    result = self.tools.execute(tool_name, **tool_args)
                    self.sessions.add_step(
                        session_id,
                        step_type="tool_result",
                        content={"tool": tool_name, "result": result}
                    )
                    # Add to context for next LLM call
                    self.sessions.add_tool_result(session_id, tool_name, result)
                    
                except Exception as e:
                    # Tool execution failed
                    error_msg = f"Tool {tool_name} failed: {str(e)}"
                    self.sessions.add_step(
                        session_id,
                        step_type="error",
                        content={"tool": tool_name, "error": error_msg}
                    )
                    # Let LLM know about error
                    self.sessions.add_tool_error(session_id, tool_name, error_msg)
            
            elif action.type == "error":
                # LLM returned invalid action
                return AgentResponse(
                    message="I encountered an error processing your request.",
                    done=True,
                    error=action.content
                )
        
        # Max steps reached
        return AgentResponse(
            message="I need more steps to complete this. Let's continue.",
            done=False
        )
    
    def _get_next_action(self, session) -> Action:
        """
        Call LLM to determine next action.
        
        Returns Action with type: "respond", "tool_call", or "error"
        """
        # Build prompt with:
        # - System prompt (agent role, available tools)
        # - Conversation history
        # - Tool results
        
        messages = self._build_prompt(session)
        
        # Call LLM (with function calling / tools API)
        response = self.llm.chat(
            messages=messages,
            tools=self.tools.get_tool_schemas(),
            temperature=0.7
        )
        
        # Parse response into Action
        return self._parse_llm_response(response)
```

**Key Design Decisions**:

1. **Step Limit**: Prevents infinite loops. Agent must make progress or return partial response.
2. **Session-Scoped**: Each user has isolated context. No cross-contamination.
3. **Explicit Logging**: Every tool call and result logged to database for observability.
4. **Error Recovery**: Tool failures are reported to LLM, which can retry or explain to user.
5. **No Magic**: Everything is explicit and inspectable.

### Tool Registry

**File**: `app/agent/tools/registry.py`

**Interface**:

```python
class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
    
    def register(self, tool: Tool):
        """Register a tool"""
        self._tools[tool.name] = tool
    
    def get_tool_schemas(self) -> List[Dict]:
        """Get all tool schemas for LLM function calling"""
        return [tool.to_function_schema() for tool in self._tools.values()]
    
    def execute(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """
        Execute a tool by name with arguments.
        
        Includes:
        - Input validation (against tool's parameter schema)
        - Timeout enforcement
        - Error handling
        - Result validation
        """
        if tool_name not in self._tools:
            raise ValueError(f"Unknown tool: {tool_name}")
        
        tool = self._tools[tool_name]
        
        # Validate inputs
        tool.validate_inputs(kwargs)
        
        # Execute with timeout
        try:
            result = self._execute_with_timeout(tool, kwargs, timeout=30)
            return result
        except TimeoutError:
            raise RuntimeError(f"Tool {tool_name} timed out after 30s")
    
    def _execute_with_timeout(self, tool, kwargs, timeout):
        """Execute tool with timeout"""
        # Implementation: use multiprocessing or async timeout
        return tool.execute(**kwargs)
```

**Tool Definition Example**:

```python
class SeparateStemsTool(Tool):
    name = "separate_stems"
    description = "Separate an audio file into individual stems (vocals, drums, bass, other)"
    
    parameters = {
        "type": "object",
        "properties": {
            "audio_id": {
                "type": "string",
                "format": "uuid",
                "description": "ID of the audio file to process"
            }
        },
        "required": ["audio_id"]
    }
    
    returns = {
        "type": "object",
        "properties": {
            "job_id": {
                "type": "string",
                "format": "uuid",
                "description": "ID of the created job"
            }
        }
    }
    
    def __init__(self, job_service, audio_service):
        self.job_service = job_service
        self.audio_service = audio_service
    
    def execute(self, audio_id: str) -> Dict[str, Any]:
        """Create a stem separation job"""
        audio_uuid = UUID(audio_id)
        
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
            "message": "Stem separation job created"
        }
```

### Session Service

**File**: `app/agent/session_service.py`

**Responsibilities**:
- Create/retrieve sessions
- Manage conversation history
- Store tool call logs
- Provide context for LLM prompts

**Interface**:

```python
class SessionService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_session(self) -> UUID:
        """Create a new session"""
        session = Session(id=uuid4())
        self.db.add(session)
        self.db.commit()
        return session.id
    
    def get_or_create(self, session_id: UUID) -> Session:
        """Get existing session or create if doesn't exist"""
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            session = Session(id=session_id)
            self.db.add(session)
            self.db.commit()
        return session
    
    def add_message(self, session_id: UUID, role: str, content: str):
        """Add a message to conversation history"""
        step = AgentStep(
            session_id=session_id,
            step_type=f"{role}_message",
            content={"role": role, "content": content}
        )
        self.db.add(step)
        self.db.commit()
    
    def add_tool_call(self, session_id: UUID, tool_name: str, args: Dict, result: Dict):
        """Log a tool call and result"""
        step = AgentStep(
            session_id=session_id,
            step_type="tool_call",
            content={
                "tool": tool_name,
                "args": args,
                "result": result
            }
        )
        self.db.add(step)
        self.db.commit()
    
    def get_conversation_history(self, session_id: UUID, limit: int = 50) -> List[Dict]:
        """Get recent conversation history for this session"""
        steps = self.db.query(AgentStep)\
            .filter(AgentStep.session_id == session_id)\
            .order_by(AgentStep.created_at.desc())\
            .limit(limit)\
            .all()
        
        return [step.content for step in reversed(steps)]
```

### LLM Client

**File**: `app/agent/llm_client.py`

**Purpose**: Abstract over different LLM providers

**Interface**:

```python
class LLMClient:
    def chat(
        self, 
        messages: List[Dict[str, str]], 
        tools: Optional[List[Dict]] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        """
        Send chat completion request to LLM.
        
        Args:
            messages: Conversation history [{"role": "user", "content": "..."}, ...]
            tools: Tool definitions for function calling
            temperature: Sampling temperature
        
        Returns:
            LLMResponse with either text response or tool call
        """
        raise NotImplementedError

class OpenAIClient(LLMClient):
    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model
    
    def chat(self, messages, tools=None, temperature=0.7):
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=tools,
            temperature=temperature
        )
        return self._parse_response(response)

class AnthropicClient(LLMClient):
    # Similar implementation for Claude
    pass
```

---

## Data Flow

### Scenario 1: User Requests Stem Separation

```
1. User → POST /api/chat/message
   {
     "session_id": "session-123",
     "message": "Separate the audio I just uploaded into stems"
   }

2. API → AgentExecutor.process_message()
   - Load session-123 context
   - Add user message to history

3. AgentExecutor → LLMClient.chat()
   System Prompt: "You are a music processing assistant. You have tools to 
                   separate audio, convert to MIDI, check job status. 
                   The user has just uploaded audio ID: audio-abc-123."
   
   User Message: "Separate the audio I just uploaded into stems"
   
   Available Tools: [separate_stems, convert_to_midi, get_job_status, ...]

4. LLM → Returns tool call
   {
     "tool": "separate_stems",
     "arguments": {"audio_id": "audio-abc-123"}
   }

5. AgentExecutor → ToolRegistry.execute("separate_stems", audio_id="audio-abc-123")

6. SeparateStemsTool.execute()
   - Validate audio-abc-123 exists
   - Create job: job-xyz-789 (type=stem_separation)
   - Enqueue job to Celery
   - Return {"job_id": "job-xyz-789", "status": "queued"}

7. ToolRegistry → AgentExecutor
   - Log tool call to database (AgentStep)
   - Add result to session context

8. AgentExecutor → LLMClient.chat() (next iteration)
   System + History: "Tool 'separate_stems' returned job_id=job-xyz-789, status=queued"
   
   LLM decides: "I should respond to user now"

9. LLM → Returns response
   {
     "type": "respond",
     "content": "I've started separating your audio into stems. 
                 The job is queued and should complete in a few minutes. 
                 Job ID: job-xyz-789"
   }

10. AgentExecutor → Returns response to API

11. API → User
    {
      "message": "I've started separating your audio into stems...",
      "job_id": "job-xyz-789"
    }

Meanwhile (async):

12. Celery Worker → Picks up job-xyz-789
13. Updates status to "running"
14. PipelineRunnerService.process_stem_separation()
15. Demucs processes audio
16. Saves stems to storage/jobs/job-xyz-789/stems/
17. Updates job status to "succeeded" with output paths

Later:

18. User → POST /api/chat/message
    {
      "session_id": "session-123",
      "message": "Is it done yet?"
    }

19. Agent → LLM → Tool call: get_job_status(job_id="job-xyz-789")
20. Returns: {"status": "succeeded", "output": {...}}
21. Agent → "Yes! Your stems are ready. Here are the files: vocals, drums, bass, other"
```

### Scenario 2: User Asks Invalid Music Theory Question

```
1. User → "What key is this song in?"

2. Agent → LLM (with context: "No symbolic analysis tools available yet")

3. LLM → "I can't determine the key yet. I can convert your audio to MIDI, 
          but I don't have music theory analysis capabilities. 
          Would you like me to convert to MIDI first?"

Note: Agent is AWARE it lacks music theory. It doesn't hallucinate.
```

### Scenario 3: Future with Symbolic Analysis (v3.0+)

```
1. User → "What key is this song in?"

2. Agent → Tool call: analyze_key(audio_id="audio-abc-123")
   (This tool would internally call convert_to_midi, then symbolic_analysis service)

3. SymbolicAnalysisService (NEW) → 
   - Takes MIDI input
   - Runs key detection algorithm
   - Returns {"key": "C major", "confidence": 0.92, "modulations": [...]}

4. Agent → "This song is in C major (92% confidence). I detected one 
            modulation to G major at measure 16."
```

---

## API Contracts

### New Endpoints

#### 1. Create Session

```http
POST /api/sessions
```

**Response**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-01-17T10:30:00Z"
}
```

#### 2. Send Message

```http
POST /api/chat/message
Content-Type: application/json

{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Separate my audio into stems"
}
```

**Response**:
```json
{
  "message": "I've started separating your audio into stems. Job ID: job-xyz-789",
  "metadata": {
    "jobs_created": ["job-xyz-789"],
    "tools_used": ["separate_stems"]
  }
}
```

#### 3. Get Session History

```http
GET /api/sessions/{session_id}/history?limit=20
```

**Response**:
```json
{
  "session_id": "550e8400-...",
  "messages": [
    {
      "role": "user",
      "content": "Separate my audio",
      "timestamp": "2026-01-17T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "I've started...",
      "timestamp": "2026-01-17T10:30:02Z"
    }
  ]
}
```

#### 4. List Available Tools (for transparency)

```http
GET /api/tools
```

**Response**:
```json
{
  "tools": [
    {
      "name": "separate_stems",
      "description": "Separate audio into vocals, drums, bass, other",
      "parameters": {...}
    },
    {
      "name": "convert_to_midi",
      "description": "Convert audio to MIDI format",
      "parameters": {...}
    }
  ]
}
```

---

## Future Extensions

### Symbolic Music Analysis Service (v3.0)

**Location**: `app/music_analysis/` (new package)

**Input**: Raw MIDI file or note events CSV  
**Output**: Structured music data (JSON)

**Example Output**:
```json
{
  "key": {
    "tonic": "C",
    "mode": "major",
    "confidence": 0.92
  },
  "chords": [
    {
      "measure": 1,
      "beat": 1,
      "chord": "C",
      "roman_numeral": "I",
      "duration": 4
    },
    {
      "measure": 2,
      "beat": 1,
      "chord": "Am",
      "roman_numeral": "vi",
      "duration": 2
    }
  ],
  "melody": {
    "contour": "ascending",
    "range": {"low": "C4", "high": "C5"},
    "motifs": [...]
  }
}
```

**Tools**:
- Music21 (Python library for symbolic music analysis)
- Custom algorithms for jazz/pop chord recognition
- Potentially ML models trained on annotated datasets

**Integration Point**:

New tools would be added to registry:
- `analyze_chords(audio_id) -> {"chords": [...], "key": {...}}`
- `detect_key(audio_id) -> {"key": "C major", "confidence": 0.92}`
- `extract_melody(audio_id) -> {"notes": [...], "contour": "..."}`

These tools would:
1. Check if MIDI exists for audio_id (if not, call convert_to_midi first)
2. Pass MIDI to SymbolicAnalysisService
3. Return structured results
4. LLM can now reason over this data

**No changes to agent architecture required** - just add new tools.

---

## Security & Safety

### Agent Safety Constraints

1. **Max Steps Per Request**: 10 (prevents infinite loops)
2. **Tool Execution Timeout**: 30 seconds (prevents hanging)
3. **Session Rate Limiting**: 100 messages/hour per session (prevents abuse)
4. **Job Creation Limit**: 10 concurrent jobs per user (prevents resource exhaustion)
5. **Allowed Tools Only**: Agent can only call registered tools (no arbitrary code execution)

### LLM Safety

1. **System Prompt Hardening**:
   - "You cannot execute arbitrary code"
   - "You can only use the provided tools"
   - "Never make up information - always query tools"

2. **Input Sanitization**:
   - User messages sanitized before passing to LLM
   - Tool arguments validated against JSON schema

3. **Output Validation**:
   - LLM responses parsed and validated
   - Malformed responses rejected

### Authentication (Future)

```python
# Placeholder for future auth
class Session(Base):
    user_id: UUID (nullable=True)  # Will be required once auth is added
    
# Future: JWT auth, API keys, OAuth
```

---

## Deployment

### Docker Setup

```
docker-compose.yml:
  services:
    api:
      build: backend/Dockerfile
      ports: ["8000:8000"]
      env: [DATABASE_URL, REDIS_URL, OPENAI_API_KEY]
    
    worker:
      build: backend/Dockerfile.worker
      env: [DATABASE_URL, REDIS_URL, STORAGE_ROOT]
    
    postgres:
      image: postgres:15
      volumes: ["pgdata:/var/lib/postgresql/data"]
    
    redis:
      image: redis:7
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/music_assistant

# Redis
REDIS_URL=redis://redis:6379/0

# LLM
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai  # or anthropic, local
LLM_MODEL=gpt-4

# Storage
STORAGE_ROOT=/app/storage

# Agent Config
MAX_AGENT_STEPS=10
TOOL_TIMEOUT=30
```

---

## Implementation Checklist

See [`docs/EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) for detailed step-by-step plan.

**Phase 1: Foundation** (Day 1)
- [ ] Create agent layer structure
- [ ] Implement tool registry
- [ ] Add Session and AgentStep models
- [ ] Create initial tools (separate_stems, get_job_status)

**Phase 2: Agent Runtime** (Day 1-2)
- [ ] Implement AgentExecutor
- [ ] Integrate LLM client (OpenAI)
- [ ] Add chat endpoints

**Phase 3: Testing & Polish** (Day 2)
- [ ] End-to-end testing
- [ ] Documentation
- [ ] Docker setup refinement

---

## Appendix: Design Decisions Log

### Why No LangChain?

**Reasoning**:
- LangChain introduces heavy abstractions and hidden state
- Debugging is difficult (magic happens inside framework)
- Version churn (breaking changes common)
- We need full control over tool execution (job system integration)
- Our requirements are simple enough to build from scratch

**Trade-off**: More code to write, but complete transparency and control.

### Why Job-Backed Tools?

**Reasoning**:
- Audio processing is slow (30s - 5min per job)
- Blocking agent loop would time out
- Jobs provide: retry logic, observability, async execution
- User can check status anytime (even if agent session ends)

**Alternative Considered**: Callbacks from workers to agent. Rejected due to complexity.

### Why Session-Scoped State?

**Reasoning**:
- Each user conversation is independent
- Prevents cross-contamination of context
- Easy to implement, reason about, and debug
- Aligns with stateless HTTP

**Alternative Considered**: Global shared memory. Rejected - too risky.

### Why Explicit Tool Registry?

**Reasoning**:
- LLM needs function schemas (must be explicit anyway)
- Easy to add/remove tools without code changes elsewhere
- Clear contract for tool developers
- Observability: can log which tools are called
- Safety: only registered tools can execute

**Alternative Considered**: Dynamic tool discovery via decorators. Rejected - too magical.

---

**End of Architecture Document**
