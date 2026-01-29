# Tools Documentation

**Purpose**: Comprehensive guide to the agent's tool system  
**Audience**: Backend developers, tool creators  
**Status**: Foundational implementation (v2.0)

---

## Table of Contents

1. [Overview](#overview)
2. [Tool Architecture](#tool-architecture)
3. [Available Tools](#available-tools)
4. [Creating New Tools](#creating-new-tools)
5. [Tool Registry](#tool-registry)
6. [Best Practices](#best-practices)
7. [Testing Tools](#testing-tools)

---

## Overview

Tools are the **actions** the agent can perform. Each tool represents a discrete capability:
- Creating processing jobs (stem separation, MIDI conversion)
- Querying job status
- Retrieving information (audio metadata, job history)

### Design Principles

1. **Explicit Contracts**: Clear input/output schemas (JSON Schema)
2. **Job-Backed for Heavy Compute**: Long-running operations create jobs, not blocking calls
3. **Validation First**: All inputs validated before execution
4. **Descriptive**: Tool names and descriptions guide LLM selection
5. **Idempotent Where Possible**: Same inputs → same outputs

### Tool vs Direct API Call

**Why wrap existing services as tools?**

- **LLM Integration**: Tools have schemas that LLMs can understand
- **Validation**: Automatic input validation against schema
- **Observability**: All tool calls logged to database
- **Error Handling**: Consistent error handling across all tools
- **Safety**: Only whitelisted tools can be called

---

## Tool Architecture

### Base Tool Class

**Location**: `backend/app/agent/tools/base.py`

```python
class Tool(ABC):
    """Base class for all agent tools."""
    
    # Tool identification
    name: str                    # Unique identifier (e.g., "separate_stems")
    description: str             # What the tool does (shown to LLM)
    
    # Input/output contracts
    parameters: Dict[str, Any]   # JSON Schema for inputs
    returns: Dict[str, Any]      # JSON Schema for outputs (documentation)
    
    @abstractmethod
    def execute(self, **kwargs) -> Dict[str, Any]:
        """Tool implementation."""
        pass
    
    def validate_inputs(self, kwargs: Dict[str, Any]):
        """Validate inputs against parameter schema."""
        jsonschema.validate(instance=kwargs, schema=self.parameters)
    
    def to_function_schema(self) -> Dict[str, Any]:
        """Convert to OpenAI function calling format."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters
            }
        }
```

### Tool Lifecycle

```
1. Tool Created (with required services injected)
   ↓
2. Tool Registered in ToolRegistry
   ↓
3. Agent starts, loads tool schemas
   ↓
4. LLM sees tool in function calling schema
   ↓
5. LLM decides to call tool (based on user message)
   ↓
6. ToolRegistry validates inputs
   ↓
7. Tool.execute() called
   ↓
8. Result returned to agent
   ↓
9. Result logged to database
   ↓
10. Result included in next LLM call
```

### Tool Execution Flow

```
User: "Separate audio abc-123 into stems"
  ↓
Agent → LLM: What should I do?
  ↓
LLM → Agent: Call tool "separate_stems" with audio_id="abc-123"
  ↓
Agent → ToolRegistry: Execute "separate_stems"
  ↓
ToolRegistry → Validate inputs (is "abc-123" a valid UUID?)
  ↓
ToolRegistry → SeparateStemsTool.execute(audio_id="abc-123")
  ↓
SeparateStemsTool:
  1. Check audio exists in database
  2. Create job record (type=stem_separation, status=queued)
  3. Enqueue job to Celery
  4. Return {"job_id": "xyz-789", "status": "queued"}
  ↓
ToolRegistry → Agent: Tool result
  ↓
Agent → Log to database (agent_steps table)
  ↓
Agent → LLM: Here's the tool result, formulate response
  ↓
LLM → Agent: "I've started separating your audio. Job ID: xyz-789"
  ↓
Agent → User: Final response
```

---

## Available Tools

### 1. separate_stems

**Purpose**: Separate audio into individual stems (vocals, drums, bass, other)

**File**: `backend/app/agent/tools/separate_stems_tool.py`

**Schema**:
```json
{
  "name": "separate_stems",
  "description": "Separate an audio file into individual stems: vocals, drums, bass, and other. This creates a background job that may take 1-5 minutes to complete. Returns a job_id that can be checked with get_job_status.",
  "parameters": {
    "type": "object",
    "properties": {
      "audio_id": {
        "type": "string",
        "description": "UUID of the audio file to process"
      }
    },
    "required": ["audio_id"]
  }
}
```

**Input**:
```python
{
  "audio_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Output**:
```python
{
  "job_id": "660e8400-e29b-41d4-a716-446655440111",
  "status": "queued",
  "message": "Stem separation job created. Use get_job_status('660e8400-...') to check progress."
}
```

**Implementation**:
```python
def execute(self, audio_id: str) -> Dict[str, Any]:
    # Validate audio exists
    audio_uuid = UUID(audio_id)
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
        "message": f"Stem separation job created..."
    }
```

**When LLM Uses It**:
- User asks to "separate stems"
- User asks to "extract vocals"
- User asks to "isolate drums"

---

### 2. convert_to_midi

**Purpose**: Convert audio to MIDI format

**File**: `backend/app/agent/tools/convert_to_midi_tool.py`

**Schema**:
```json
{
  "name": "convert_to_midi",
  "description": "Convert an audio file to MIDI format. This detects notes in the audio and creates a MIDI file and note events CSV. Creates a background job that may take 1-5 minutes. Returns a job_id to check status.",
  "parameters": {
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
}
```

**Input**:
```python
{
  "audio_id": "550e8400-e29b-41d4-a716-446655440000",
  "midi_tempo": 120  # Optional
}
```

**Output**:
```python
{
  "job_id": "770e8400-e29b-41d4-a716-446655440222",
  "status": "queued",
  "message": "MIDI conversion job created. Use get_job_status('770e8400-...') to check progress."
}
```

**When LLM Uses It**:
- User asks to "convert to MIDI"
- User asks to "extract notes"
- User asks to "get MIDI file"

---

### 3. get_job_status

**Purpose**: Check status and results of a processing job

**File**: `backend/app/agent/tools/get_job_status_tool.py`

**Schema**:
```json
{
  "name": "get_job_status",
  "description": "Check the status of a processing job (stem separation, MIDI conversion, etc.). Returns the current status (queued, running, succeeded, failed), progress, and output files if completed.",
  "parameters": {
    "type": "object",
    "properties": {
      "job_id": {
        "type": "string",
        "description": "UUID of the job to check"
      }
    },
    "required": ["job_id"]
  }
}
```

**Input**:
```python
{
  "job_id": "660e8400-e29b-41d4-a716-446655440111"
}
```

**Output (Queued)**:
```python
{
  "job_id": "660e8400-e29b-41d4-a716-446655440111",
  "type": "stem_separation",
  "status": "queued",
  "progress": 0.0
}
```

**Output (Running)**:
```python
{
  "job_id": "660e8400-e29b-41d4-a716-446655440111",
  "type": "stem_separation",
  "status": "running",
  "progress": 0.5
}
```

**Output (Succeeded)**:
```python
{
  "job_id": "660e8400-e29b-41d4-a716-446655440111",
  "type": "stem_separation",
  "status": "succeeded",
  "progress": 1.0,
  "output": {
    "vocals": "jobs/660e8400-.../stems/track.vocals.mp3",
    "drums": "jobs/660e8400-.../stems/track.drums.mp3",
    "bass": "jobs/660e8400-.../stems/track.bass.mp3",
    "other": "jobs/660e8400-.../stems/track.other.mp3"
  }
}
```

**Output (Failed)**:
```python
{
  "job_id": "660e8400-e29b-41d4-a716-446655440111",
  "type": "stem_separation",
  "status": "failed",
  "progress": 0.3,
  "error_message": "Audio file not found"
}
```

**Implementation**:
```python
def execute(self, job_id: str) -> Dict[str, Any]:
    job_uuid = UUID(job_id)
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

**When LLM Uses It**:
- User asks "is it done?"
- User asks "check status"
- User asks "how's the job going?"
- Automatically after creating a job (to inform user)

---

## Creating New Tools

### Step-by-Step Guide

#### Step 1: Define Tool Purpose

Example: "Get information about an uploaded audio file"

#### Step 2: Design Schema

**Input Parameters**:
```json
{
  "audio_id": {
    "type": "string",
    "description": "UUID of the audio file"
  }
}
```

**Output Structure**:
```json
{
  "audio_id": "...",
  "filename": "song.mp3",
  "created_at": "2026-01-17T10:00:00Z",
  "file_size_bytes": 5242880
}
```

#### Step 3: Create Tool Class

**File**: `backend/app/agent/tools/get_audio_info_tool.py`

```python
"""Tool for getting audio file information."""
from uuid import UUID
from typing import Dict, Any
from app.agent.tools.base import Tool


class GetAudioInfoTool(Tool):
    """Get information about an uploaded audio file."""
    
    name = "get_audio_info"
    description = (
        "Get metadata about an uploaded audio file, including filename, "
        "upload date, and file size."
    )
    
    parameters = {
        "type": "object",
        "properties": {
            "audio_id": {
                "type": "string",
                "description": "UUID of the audio file"
            }
        },
        "required": ["audio_id"]
    }
    
    returns = {
        "type": "object",
        "properties": {
            "audio_id": {"type": "string"},
            "filename": {"type": "string"},
            "created_at": {"type": "string"},
            "file_size_bytes": {"type": "integer"}
        }
    }
    
    def __init__(self, audio_service):
        """
        Initialize tool with required services.
        
        Args:
            audio_service: AudioService instance
        """
        self.audio_service = audio_service
    
    def execute(self, audio_id: str) -> Dict[str, Any]:
        """Get audio file information."""
        # Validate UUID format
        try:
            audio_uuid = UUID(audio_id)
        except ValueError:
            raise ValueError(f"Invalid audio_id format: {audio_id}")
        
        # Get audio from database
        audio = self.audio_service.get_audio(audio_uuid)
        if not audio:
            raise ValueError(f"Audio {audio_id} not found")
        
        # Get file path and size
        audio_path = self.audio_service.get_audio_path(audio_uuid)
        file_size = audio_path.stat().st_size if audio_path.exists() else 0
        
        return {
            "audio_id": str(audio.id),
            "filename": audio.filename,
            "created_at": audio.created_at.isoformat(),
            "file_size_bytes": file_size
        }
```

#### Step 4: Register Tool

**File**: `backend/app/agent/tools/registry.py`

```python
def create_default_registry(job_service, audio_service) -> ToolRegistry:
    from app.agent.tools.separate_stems_tool import SeparateStemsTool
    from app.agent.tools.convert_to_midi_tool import ConvertToMidiTool
    from app.agent.tools.get_job_status_tool import GetJobStatusTool
    from app.agent.tools.get_audio_info_tool import GetAudioInfoTool  # NEW
    
    registry = ToolRegistry()
    
    # Register tools
    registry.register(SeparateStemsTool(job_service, audio_service))
    registry.register(ConvertToMidiTool(job_service, audio_service))
    registry.register(GetJobStatusTool(job_service))
    registry.register(GetAudioInfoTool(audio_service))  # NEW
    
    return registry
```

#### Step 5: Write Tests

**File**: `backend/tests/test_get_audio_info_tool.py`

```python
"""Tests for GetAudioInfoTool."""
import pytest
from uuid import uuid4
from unittest.mock import Mock
from app.agent.tools.get_audio_info_tool import GetAudioInfoTool


def test_get_audio_info_success():
    """Test successful audio info retrieval."""
    # Mock audio service
    audio_service = Mock()
    mock_audio = Mock(
        id=uuid4(),
        filename="test.mp3",
        created_at="2026-01-17T10:00:00Z"
    )
    audio_service.get_audio.return_value = mock_audio
    audio_service.get_audio_path.return_value = Mock(
        exists=lambda: True,
        stat=lambda: Mock(st_size=5242880)
    )
    
    # Create tool
    tool = GetAudioInfoTool(audio_service)
    
    # Execute
    result = tool.execute(audio_id=str(mock_audio.id))
    
    # Verify
    assert result["audio_id"] == str(mock_audio.id)
    assert result["filename"] == "test.mp3"
    assert result["file_size_bytes"] == 5242880


def test_get_audio_info_not_found():
    """Test audio not found error."""
    audio_service = Mock()
    audio_service.get_audio.return_value = None
    
    tool = GetAudioInfoTool(audio_service)
    
    with pytest.raises(ValueError, match="Audio .* not found"):
        tool.execute(audio_id=str(uuid4()))


def test_get_audio_info_invalid_uuid():
    """Test invalid UUID format."""
    audio_service = Mock()
    tool = GetAudioInfoTool(audio_service)
    
    with pytest.raises(ValueError, match="Invalid audio_id format"):
        tool.execute(audio_id="not-a-uuid")
```

#### Step 6: Test with Agent

Start API server, then test via chat:

```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about audio 550e8400-e29b-41d4-a716-446655440000"
  }'
```

Expected agent response:
```
"This audio file is named 'song.mp3', uploaded on Jan 17, 2026, and is 5.2 MB in size."
```

**Agent automatically uses the new tool!**

---

## Tool Registry

### Purpose

Centralized system for:
- Registering tools
- Providing tool schemas to LLM
- Executing tools with validation
- Enforcing timeouts and error handling

### Interface

**Location**: `backend/app/agent/tools/registry.py`

```python
class ToolRegistry:
    def register(self, tool: Tool):
        """Register a tool."""
    
    def get(self, name: str) -> Tool:
        """Get a tool by name."""
    
    def list_tools(self) -> List[str]:
        """List all registered tool names."""
    
    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        """Get all tool schemas for LLM function calling."""
    
    def execute(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """Execute a tool with validation and error handling."""
```

### Execution Flow

```python
# Agent calls
result = tool_registry.execute("separate_stems", audio_id="abc-123")

# Internally:
1. Get tool: tool = self._tools["separate_stems"]
2. Validate inputs: tool.validate_inputs({"audio_id": "abc-123"})
3. Execute: result = tool.execute(audio_id="abc-123")
4. Handle errors: try/except wrapper
5. Return result
```

### Error Handling

**Input Validation Errors**:
```python
# Missing required parameter
execute("separate_stems")  # No audio_id
→ ValueError: audio_id is required

# Wrong type
execute("separate_stems", audio_id=12345)  # Should be string
→ ValueError: audio_id must be string

# Invalid format
execute("separate_stems", audio_id="not-a-uuid")
→ ValueError: Invalid audio_id format
```

**Execution Errors**:
```python
# Audio not found
execute("separate_stems", audio_id="nonexistent-uuid")
→ ValueError: Audio nonexistent-uuid not found

# Database connection failed
execute("get_job_status", job_id="abc-123")
→ RuntimeError: Database connection failed
```

All errors are:
1. Logged to application logs
2. Logged to agent_steps table (type="error")
3. Passed to LLM (so it can explain to user)

---

## Best Practices

### 1. Descriptive Names

**Good**:
- `separate_stems` (verb + noun, clear action)
- `convert_to_midi` (verb + target format)
- `get_job_status` (verb + what you're getting)

**Bad**:
- `process` (too vague)
- `stems` (not a verb)
- `job` (what about the job?)

### 2. Clear Descriptions

**Good**:
```python
description = (
    "Separate an audio file into individual stems: vocals, drums, bass, and other. "
    "This creates a background job that may take 1-5 minutes to complete. "
    "Returns a job_id that can be checked with get_job_status."
)
```

**Bad**:
```python
description = "Separates audio"  # Too brief, no context
```

**Why**: LLM uses description to decide when to use the tool. Be specific!

### 3. Explicit Required vs Optional

```python
parameters = {
    "type": "object",
    "properties": {
        "audio_id": {
            "type": "string",
            "description": "UUID of the audio file"
        },
        "model": {
            "type": "string",
            "description": "Optional model name (default: demucs_v4)",
            "enum": ["demucs_v4", "demucs_v3"]
        }
    },
    "required": ["audio_id"]  # Only audio_id is required
}
```

### 4. Validate Early

```python
def execute(self, audio_id: str, midi_tempo: int = None):
    # Validate UUID format immediately
    try:
        audio_uuid = UUID(audio_id)
    except ValueError:
        raise ValueError(f"Invalid audio_id format: {audio_id}")
    
    # Validate tempo if provided
    if midi_tempo is not None and not (30 <= midi_tempo <= 300):
        raise ValueError(f"midi_tempo must be between 30 and 300, got {midi_tempo}")
    
    # Now proceed with actual logic
    ...
```

### 5. Return Structured Data

**Good**:
```python
return {
    "job_id": str(job_id),
    "status": "queued",
    "message": "Job created successfully",
    "estimated_time_minutes": 3
}
```

**Bad**:
```python
return "Job created with ID xyz-789"  # Unstructured string
```

**Why**: Structured data is easier for LLM to parse and use in follow-up actions.

### 6. Handle Services Correctly

**Good (Inject Services)**:
```python
class MyTool(Tool):
    def __init__(self, job_service, audio_service):
        self.job_service = job_service
        self.audio_service = audio_service
    
    def execute(self, audio_id: str):
        audio = self.audio_service.get_audio(UUID(audio_id))
        ...
```

**Bad (Create Services in Tool)**:
```python
class MyTool(Tool):
    def execute(self, audio_id: str):
        db = SessionLocal()  # BAD: Tool shouldn't manage database
        audio_service = AudioService(db)
        ...
```

**Why**: Services should be injected for testability and proper session management.

### 7. Job-Backed for Heavy Compute

**When to Create a Job**:
- Operation takes >5 seconds
- Operation is CPU/GPU intensive
- Operation might fail and need retries

**When to Execute Directly**:
- Simple database query (<100ms)
- Pure data retrieval
- No compute required

**Example**:
```python
# Job-backed (heavy compute)
def separate_stems(audio_id):
    job_id = create_job(type="stem_separation")
    enqueue_job(job_id)
    return {"job_id": job_id}

# Direct execution (fast query)
def get_job_status(job_id):
    job = db.query(Job).get(job_id)
    return {"status": job.status, "progress": job.progress}
```

### 8. Error Messages for Users

**Good**:
```python
if not audio_path.exists():
    raise ValueError(
        f"Audio file not found. The audio may have been deleted or "
        f"there was an error during upload. Please upload again."
    )
```

**Bad**:
```python
if not audio_path.exists():
    raise FileNotFoundError(f"{audio_path} does not exist")  # Too technical
```

**Why**: Error messages are shown to users via agent. Be user-friendly.

---

## Testing Tools

### Unit Tests

**Test Structure**:

```python
# tests/test_my_tool.py

def test_tool_success():
    """Test successful execution."""
    # Setup: Mock services
    # Execute: Call tool.execute()
    # Verify: Check result structure and values

def test_tool_validation_error():
    """Test input validation."""
    # Setup: Prepare invalid inputs
    # Execute: Call tool.execute()
    # Verify: Raises ValueError with descriptive message

def test_tool_not_found_error():
    """Test resource not found."""
    # Setup: Mock service returns None
    # Execute: Call tool.execute()
    # Verify: Raises ValueError

def test_tool_execution_error():
    """Test execution failure."""
    # Setup: Mock service raises exception
    # Execute: Call tool.execute()
    # Verify: Error is propagated or wrapped
```

### Integration Tests

**Test with Real Services** (use test database):

```python
def test_separate_stems_integration(db_session, test_audio_file):
    """Test separate_stems tool with real services."""
    # Create services with test database
    job_service = JobService(db_session)
    audio_service = AudioService(db_session)
    
    # Upload test audio
    audio_id = audio_service.create_audio(...)
    
    # Create and execute tool
    tool = SeparateStemsTool(job_service, audio_service)
    result = tool.execute(audio_id=str(audio_id))
    
    # Verify job was created
    assert "job_id" in result
    job = job_service.get_job(UUID(result["job_id"]))
    assert job is not None
    assert job.status == "queued"
```

### Testing with Agent

**Manual Test Flow**:

1. Start API server:
```bash
uvicorn app.main:app --reload
```

2. Upload audio:
```bash
curl -X POST http://localhost:8000/api/audio \
  -F "file=@test.mp3"
# Returns: {"audio_id": "abc-123"}
```

3. Test tool via agent:
```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Separate audio abc-123 into stems"
  }'
```

4. Verify agent called tool:
```bash
# Check agent_steps table
SELECT * FROM agent_steps WHERE step_type = 'tool_call';
```

**Automated Agent Test**:

```python
def test_agent_calls_tool():
    """Test that agent correctly calls tool."""
    # Create mock LLM that returns tool call
    mock_llm = Mock()
    mock_llm.chat.return_value = LLMResponse(
        tool_calls=[{
            "name": "separate_stems",
            "arguments": {"audio_id": "abc-123"}
        }]
    )
    
    # Create agent with mock LLM
    agent = AgentExecutor(llm_client=mock_llm, ...)
    
    # Process message
    response = agent.process_message(session_id, "Separate stems")
    
    # Verify tool was called
    mock_llm.chat.assert_called()
    # Check tool call was logged
    ...
```

---

## Appendix: Tool Schema Reference

### JSON Schema Types

**Supported Types**:
- `string`: Text values
- `integer`: Whole numbers
- `number`: Decimal numbers
- `boolean`: true/false
- `array`: Lists
- `object`: Nested structures
- `null`: Null value

**String Formats**:
```python
{
  "type": "string",
  "format": "uuid"  # UUID validation
}
```

**Enums** (constrained values):
```python
{
  "type": "string",
  "enum": ["option1", "option2", "option3"]
}
```

**Ranges**:
```python
{
  "type": "integer",
  "minimum": 1,
  "maximum": 100
}
```

**Arrays**:
```python
{
  "type": "array",
  "items": {
    "type": "string"
  },
  "minItems": 1,
  "maxItems": 10
}
```

### Complete Tool Template

```python
"""Tool template."""
from uuid import UUID
from typing import Dict, Any
from app.agent.tools.base import Tool


class MyTool(Tool):
    """Brief description of what this tool does."""
    
    name = "my_tool"
    
    description = (
        "Detailed description for the LLM. "
        "Include what it does, how long it takes, what it returns. "
        "Be specific and helpful."
    )
    
    parameters = {
        "type": "object",
        "properties": {
            "required_param": {
                "type": "string",
                "description": "What this parameter is for"
            },
            "optional_param": {
                "type": "integer",
                "description": "Optional parameter with default",
                "minimum": 1,
                "maximum": 100
            }
        },
        "required": ["required_param"]
    }
    
    returns = {
        "type": "object",
        "properties": {
            "result_field": {"type": "string"}
        }
    }
    
    def __init__(self, service):
        """Initialize with required services."""
        self.service = service
    
    def execute(self, required_param: str, optional_param: int = None) -> Dict[str, Any]:
        """
        Execute the tool.
        
        Args:
            required_param: Description
            optional_param: Description
        
        Returns:
            Dict with result_field
        
        Raises:
            ValueError: If validation fails
            RuntimeError: If execution fails
        """
        # 1. Validate inputs
        # 2. Check resources exist
        # 3. Perform action
        # 4. Return structured result
        
        return {
            "result_field": "value"
        }
```

---

## Future Tools (v3.0+ - Symbolic Music Analysis)

When symbolic analysis layer is added, these tools become available:

### analyze_chords

```python
{
  "name": "analyze_chords",
  "description": "Analyze chord progression in audio. Returns key, chords with Roman numerals, and harmonic function analysis.",
  "parameters": {
    "type": "object",
    "properties": {
      "audio_id": {"type": "string"}
    },
    "required": ["audio_id"]
  }
}
```

**Output**:
```json
{
  "key": {"tonic": "C", "mode": "major"},
  "chords": [
    {"measure": 1, "chord": "C", "roman": "I", "function": "tonic"},
    {"measure": 2, "chord": "Am", "roman": "vi", "function": "tonic substitute"}
  ]
}
```

### detect_key

```python
{
  "name": "detect_key",
  "description": "Detect the key and modulations in audio",
  "parameters": {"audio_id": {"type": "string"}}
}
```

### extract_melody

```python
{
  "name": "extract_melody",
  "description": "Extract and analyze the main melody line",
  "parameters": {"audio_id": {"type": "string"}}
}
```

---

**For agent framework details, see [`AGENT.md`](./AGENT.md)**
