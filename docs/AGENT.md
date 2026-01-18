# Agent Framework Documentation

**Purpose**: Developer guide for understanding and extending the agent system  
**Audience**: Backend developers, contributors  
**Status**: Foundational implementation (v2.0)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Agent Runtime Loop](#agent-runtime-loop)
5. [Session Management](#session-management)
6. [LLM Integration](#llm-integration)
7. [Safety & Constraints](#safety--constraints)
8. [Extending the Agent](#extending-the-agent)
9. [Debugging](#debugging)

---

## Overview

The agent framework provides a **minimal, transparent LLM orchestration layer** for Music Assistant. It allows users to interact with audio processing tools conversationally while maintaining full control and observability.

### Design Philosophy

1. **No Magic**: Everything is explicit and inspectable
2. **Job-Backed Execution**: Long-running operations go through the job system
3. **Session-Scoped State**: Each conversation is isolated
4. **Safety First**: Step limits, timeouts, input validation
5. **Future-Proof**: Easy to add new tools without modifying agent logic

### What the Agent Does

- Accepts natural language requests from users
- Determines which tool(s) to call using LLM reasoning
- Executes tools with proper error handling
- Monitors job status
- Formulates responses to users

### What the Agent Does NOT Do

- Understand music theory (no symbolic analysis yet - deferred to v3.0)
- Block on long-running compute (delegates to job system)
- Make up information (must query tools for facts)
- Execute arbitrary code (only registered tools)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                              │
│              "Separate my audio into stems"                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Endpoint                                │
│              POST /api/chat/message                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  AgentExecutor                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  1. Load session context                           │     │
│  │  2. Add user message to history                    │     │
│  │  3. Build prompt (system + history + tools)        │     │
│  │  4. Call LLM                                       │     │
│  │  5. Parse response (text or tool calls)            │     │
│  │  6. Execute tools if requested                     │     │
│  │  7. Loop until final response                      │     │
│  │  8. Return to user                                 │     │
│  └────────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────────┐
    │   LLM    │  │  Tools   │  │   Session    │
    │  Client  │  │ Registry │  │   Service    │
    └──────────┘  └──────────┘  └──────────────┘
```

---

## Components

### 1. AgentExecutor

**Location**: `backend/app/agent/executor.py`

**Responsibilities**:
- Main agent runtime loop
- Orchestrates LLM calls and tool execution
- Manages conversation flow
- Enforces safety constraints (step limits)

**Key Methods**:

```python
class AgentExecutor:
    def process_message(
        self, 
        session_id: UUID, 
        user_message: str
    ) -> AgentResponse:
        """
        Process user message and return agent response.
        
        This is the main entry point for agent interactions.
        """
```

**Configuration**:
- `max_steps`: Maximum iterations per request (default: 10)
- System prompt: Defines agent role and capabilities
- Temperature: LLM sampling parameter (default: 0.7)

### 2. SessionService

**Location**: `backend/app/agent/session_service.py`

**Responsibilities**:
- Create and retrieve sessions
- Store conversation history
- Log agent steps (tool calls, results, errors)
- Provide context for LLM prompts

**Key Methods**:

```python
class SessionService:
    def create_session(self) -> Session:
        """Create new session"""
    
    def add_step(self, session_id, step_type, content) -> AgentStep:
        """Log a step in the conversation"""
    
    def get_messages_for_llm(self, session_id) -> List[Dict]:
        """Get formatted conversation history for LLM"""
```

**Step Types**:
- `user_message`: Message from user
- `tool_call`: Agent decided to call a tool
- `tool_result`: Result from tool execution
- `agent_response`: Agent's response to user
- `error`: Error during processing

### 3. ToolRegistry

**Location**: `backend/app/agent/tools/registry.py`

**Responsibilities**:
- Register available tools
- Provide tool schemas for LLM function calling
- Execute tools with validation and error handling
- Enforce timeouts

**Key Methods**:

```python
class ToolRegistry:
    def register(self, tool: Tool):
        """Register a tool"""
    
    def get_tool_schemas(self) -> List[Dict]:
        """Get schemas for LLM function calling"""
    
    def execute(self, tool_name: str, **kwargs) -> Dict:
        """Execute a tool by name"""
```

### 4. LLMClient

**Location**: `backend/app/agent/llm_client.py`

**Responsibilities**:
- Abstract over LLM providers (OpenAI, Anthropic, local models)
- Handle function calling / tool use API
- Parse LLM responses
- Error handling for API failures

**Implementations**:
- `OpenAIClient`: Uses OpenAI API (gpt-4, gpt-3.5-turbo)
- Future: `AnthropicClient`, `LocalLLMClient`

---

## Agent Runtime Loop

### High-Level Flow

```
1. User sends message → API → AgentExecutor
2. Load session context (previous messages, tool results)
3. Build prompt:
   - System prompt (agent role, capabilities)
   - Conversation history
   - Available tools (schemas)
   - Recent tool results
4. Call LLM with function calling enabled
5. Parse LLM response:
   a. If tool calls → Execute tools → Log results → Loop to step 4
   b. If text response → Return to user
   c. If error → Return error message
6. Return final response to user
```

### Detailed Loop (Pseudocode)

```python
def process_message(session_id, user_message):
    # Initialize
    session = get_or_create_session(session_id)
    add_user_message(session_id, user_message)
    step_count = 0
    tool_results = []
    
    # Agent loop
    while step_count < MAX_STEPS:
        step_count += 1
        
        # Build prompt
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *get_conversation_history(session_id),
            *format_tool_results(tool_results)
        ]
        
        # Call LLM
        llm_response = llm_client.chat(
            messages=messages,
            tools=tool_registry.get_tool_schemas()
        )
        
        # Handle response
        if llm_response.has_tool_calls():
            # Execute tools
            for tool_call in llm_response.tool_calls:
                try:
                    result = tool_registry.execute(
                        tool_call.name, 
                        **tool_call.arguments
                    )
                    log_tool_call(session_id, tool_call, result)
                    tool_results.append(result)
                except Exception as e:
                    log_error(session_id, tool_call, e)
                    tool_results.append({"error": str(e)})
            
            # Continue loop (LLM will see tool results)
            continue
        
        elif llm_response.has_text():
            # Final response to user
            response_text = llm_response.text
            log_agent_response(session_id, response_text)
            return AgentResponse(message=response_text)
        
        else:
            # Unexpected response
            return AgentResponse(message="Error processing request")
    
    # Max steps reached
    return AgentResponse(message="Request too complex, please simplify")
```

### Step Limit Rationale

**Why 10 steps?**
- Prevents infinite loops
- Forces LLM to be efficient
- Limits token costs
- Reasonable for most use cases

**What happens if limit reached?**
- Agent returns partial response: "This task is too complex. Let's break it down."
- User can send follow-up message to continue
- Session context persists

---

## Session Management

### Session Lifecycle

```
1. Create Session (optional - auto-created if not provided)
   POST /api/chat/sessions → session_id

2. Send Messages
   POST /api/chat/message
   {
     "session_id": "...",
     "message": "Separate my audio"
   }

3. View History
   GET /api/chat/sessions/{session_id}/history

4. Session persists indefinitely
   (Future: Add session expiration, cleanup)
```

### Session Isolation

- Each session is completely independent
- No shared context between sessions
- Tool results are session-scoped
- Safe for multi-user systems

### Session Context

What the agent "remembers" within a session:
- All previous user messages
- All previous agent responses
- All tool calls made and their results
- Errors that occurred

What the agent does NOT remember:
- Audio IDs (must be mentioned explicitly each time)
- Job IDs (unless recently mentioned)
- Results from other sessions

### Future: Context Management

For v3.0+:
- Automatic context: Remember audio_id from earlier in conversation
- Context summarization: Compress long conversations
- Cross-session memory: "Remember my preferences"

---

## LLM Integration

### Function Calling

The agent uses OpenAI's **function calling** feature (similar for other providers):

**Tool Schema Example**:
```json
{
  "type": "function",
  "function": {
    "name": "separate_stems",
    "description": "Separate audio into vocals, drums, bass, other",
    "parameters": {
      "type": "object",
      "properties": {
        "audio_id": {
          "type": "string",
          "description": "UUID of audio file"
        }
      },
      "required": ["audio_id"]
    }
  }
}
```

**LLM Response (Tool Call)**:
```json
{
  "role": "assistant",
  "tool_calls": [
    {
      "id": "call_xyz",
      "type": "function",
      "function": {
        "name": "separate_stems",
        "arguments": "{\"audio_id\": \"abc-123\"}"
      }
    }
  ]
}
```

### System Prompt

The system prompt defines the agent's role and capabilities:

```
You are a music processing assistant. You help users process audio files.

Available capabilities:
- Separate audio into stems (vocals, drums, bass, other)
- Convert audio to MIDI format
- Check status of processing jobs

Important:
- Processing jobs run in the background (1-5 minutes)
- Always create jobs first, then check status
- You cannot analyze music theory yet
- Be helpful and explain what you're doing
```

**Why this works**:
- Clear role definition
- Explicit capabilities
- Important constraints (no music theory)
- Behavioral guidelines (be helpful)

### Temperature & Sampling

- **Temperature 0.7**: Balanced creativity and consistency
- Lower (0.2): More deterministic, less creative
- Higher (1.0): More creative, less consistent

For tool selection, 0.7 works well - deterministic enough to call correct tools, creative enough to handle varied phrasing.

---

## Safety & Constraints

### Step Limit (10 steps per request)

**Purpose**: Prevent infinite loops, limit token costs

**Example**:
```
User: "Separate audio abc-123"

Step 1: LLM → Tool call: separate_stems(abc-123)
Step 2: Tool result: {"job_id": "xyz-789"}
Step 3: LLM → Response: "I've started separating your audio..."
→ Done in 3 steps
```

**Edge Case - Max Steps Reached**:
```
User: "Process all my audio files" (ambiguous, no specific IDs)

Step 1-10: LLM keeps trying to clarify, tool calls fail
→ Max steps reached
→ Agent: "This task is too complex. Can you specify which audio?"
```

### Tool Execution Timeout (30 seconds)

**Purpose**: Prevent hanging on slow tools

**Note**: This is timeout for tool *execution*, not job *completion*. Jobs run async in background.

**Example**:
```python
# This completes in <1 second (just creates job)
separate_stems(audio_id="abc-123")  
→ Returns: {"job_id": "xyz-789", "status": "queued"}

# The actual processing happens async
# User checks later: get_job_status("xyz-789")
```

### Input Validation

All tool inputs validated against JSON schema:

```python
# Invalid input
separate_stems(audio_id="not-a-uuid")
→ ValueError: Invalid audio_id format

# Missing required parameter
convert_to_midi()  # Missing audio_id
→ ValueError: audio_id is required
```

### Tool Whitelist

Agent can ONLY call registered tools. No arbitrary code execution.

```python
# This works (registered tool)
tool_registry.execute("separate_stems", audio_id="abc-123")

# This fails (not registered)
tool_registry.execute("delete_all_files")
→ ValueError: Unknown tool: delete_all_files
```

### Rate Limiting (Future)

Not yet implemented, but planned:
- 100 messages/hour per session
- 10 concurrent jobs per user
- LLM API rate limits (handled by provider)

---

## Extending the Agent

### Adding a New Tool

1. **Create Tool Class**

```python
# backend/app/agent/tools/my_new_tool.py
from app.agent.tools.base import Tool

class MyNewTool(Tool):
    name = "my_new_tool"
    description = "Does something useful"
    parameters = {
        "type": "object",
        "properties": {
            "input_param": {"type": "string"}
        },
        "required": ["input_param"]
    }
    
    def execute(self, input_param: str) -> Dict[str, Any]:
        # Implementation
        return {"result": "success"}
```

2. **Register Tool**

```python
# backend/app/agent/tools/registry.py
def create_default_registry(...):
    registry = ToolRegistry()
    registry.register(MyNewTool(...))
    return registry
```

3. **Test Tool**

```python
# backend/tests/test_my_new_tool.py
def test_my_new_tool():
    tool = MyNewTool(...)
    result = tool.execute(input_param="test")
    assert result["result"] == "success"
```

4. **Agent Automatically Uses It**

No changes to agent code needed! LLM will see the new tool in the schema and can call it.

### Modifying System Prompt

Edit `AgentExecutor.SYSTEM_PROMPT` to change agent behavior:

```python
SYSTEM_PROMPT = """
You are a music processing assistant.

[Add new capabilities here]
- New feature: Batch processing

[Add new constraints here]
- Maximum 5 jobs per request
"""
```

### Adding New LLM Provider

```python
# backend/app/agent/llm_client.py

class AnthropicClient(LLMClient):
    def __init__(self, api_key: str):
        import anthropic
        self.client = anthropic.Anthropic(api_key=api_key)
    
    def chat(self, messages, tools=None, temperature=0.7):
        # Implement Anthropic API call
        # Map function calling to Anthropic's tool use
        pass
```

Then update `create_llm_client()`:

```python
def create_llm_client(provider="openai"):
    if provider == "openai":
        return OpenAIClient()
    elif provider == "anthropic":
        return AnthropicClient()
```

---

## Debugging

### Viewing Agent Steps

**Database Query**:
```sql
SELECT 
    step_number, 
    step_type, 
    content,
    created_at
FROM agent_steps
WHERE session_id = 'your-session-id'
ORDER BY step_number ASC;
```

**API Endpoint**:
```bash
curl http://localhost:8000/api/chat/sessions/{session_id}/history
```

### Logging

**Enable Debug Logging**:

```python
# backend/app/main.py
logging.basicConfig(level=logging.DEBUG)
```

**Key Log Messages**:
- `"Processing message for session {session_id}"` - New message received
- `"Executing tool: {tool_name} with args: {args}"` - Tool execution started
- `"Tool {tool_name} completed successfully"` - Tool execution succeeded
- `"Tool {tool_name} failed: {error}"` - Tool execution failed
- `"Agent step {step}/{max_steps}"` - Current step in loop

### Common Issues

#### Agent Not Calling Tools

**Symptom**: Agent responds with text, never calls tools

**Debug Steps**:
1. Check tool schemas: `curl http://localhost:8000/api/tools`
2. Verify system prompt mentions tools
3. Check LLM response parsing (log `llm_response`)
4. Ensure model supports function calling (gpt-4, not gpt-3.5-turbo-instruct)

**Fix**: Use gpt-4 or gpt-3.5-turbo (not instruct models)

#### Tools Failing with Errors

**Symptom**: Agent says "Tool failed: ..."

**Debug Steps**:
1. Check tool execution logs
2. Verify input arguments match schema
3. Check database (audio/job exists?)
4. Test tool directly: `tool.execute(**args)`

**Fix**: Usually missing data or invalid inputs

#### Session History Not Persisting

**Symptom**: Agent has no memory of previous messages

**Debug Steps**:
1. Verify session_id is same between requests
2. Check database: `SELECT * FROM sessions WHERE id = '...'`
3. Check database: `SELECT * FROM agent_steps WHERE session_id = '...'`
4. Verify database connection (not using in-memory SQLite)

**Fix**: Use persistent database, ensure session_id consistency

#### Max Steps Reached Every Time

**Symptom**: Agent always returns "request too complex"

**Debug Steps**:
1. Check step logs to see what agent is doing
2. Look for repeated tool calls (infinite loop)
3. Check if tools are returning valid results
4. Check if LLM is parsing tool results correctly

**Fix**: Usually tool results not formatted correctly, or system prompt unclear

---

## Performance Considerations

### Token Usage

Each agent turn consumes tokens:
- System prompt: ~150 tokens
- Conversation history: ~50 tokens per message
- Tool schemas: ~100 tokens per tool
- LLM response: ~100-500 tokens

**Example** (3 tools, 10-message conversation):
- System: 150
- Tools: 300
- History: 500
- Response: 200
- **Total: ~1,150 tokens per request**

**At $0.03/1K tokens (gpt-4)**: ~$0.03 per agent turn

### Database Queries

Each agent turn:
- 1 SELECT (get session)
- 3-5 INSERTs (log steps)
- 1-3 SELECTs per tool call (validate inputs)

**Optimization**: Use connection pooling, index session_id and step_number

### Response Latency

Typical latency:
- LLM API call: 1-3 seconds
- Tool execution: <1 second (just creates job)
- Database operations: <100ms
- **Total: 1-4 seconds per agent turn**

**Future Optimization**: Streaming responses (SSE)

---

## Future Enhancements

### v3.0: Symbolic Music Analysis

When symbolic analysis layer is added, new tools become available:

```python
class AnalyzeChordsToolTool):
    name = "analyze_chords"
    description = "Analyze chord progression in audio"
    
    def execute(self, audio_id: str):
        # Internally: convert to MIDI → symbolic analysis
        return {
            "key": "C major",
            "chords": [
                {"measure": 1, "chord": "C", "roman": "I"},
                {"measure": 2, "chord": "Am", "roman": "vi"}
            ]
        }
```

**Agent automatically gains music theory capabilities** - no changes to agent code!

### Advanced Features (Future)

1. **Streaming Responses**: Return partial responses as agent works
2. **Multi-Turn Orchestration**: Auto-chain tools (convert to MIDI → analyze chords)
3. **Job Polling**: Agent automatically waits for jobs to complete
4. **Context Summarization**: Compress long conversations
5. **User Preferences**: Remember user's preferred settings
6. **Batch Operations**: Process multiple audio files at once
7. **Webhooks**: Notify external systems of agent actions
8. **A/B Testing**: Test different prompts/strategies
9. **Agent Analytics**: Track tool usage, success rates

---

## API Reference

### POST /api/chat/sessions

Create a new chat session.

**Response**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-01-17T10:00:00Z"
}
```

### POST /api/chat/message

Send a message to the agent.

**Request**:
```json
{
  "session_id": "550e8400-...",  // Optional, creates new if omitted
  "message": "Separate my audio into stems"
}
```

**Response**:
```json
{
  "session_id": "550e8400-...",
  "message": "I've started separating your audio. Job ID: xyz-789",
  "metadata": {
    "steps": 3,
    "tools_used": ["separate_stems"]
  }
}
```

### GET /api/chat/sessions/{session_id}/history

Get conversation history for a session.

**Query Parameters**:
- `limit`: Max number of steps to return (default: 50)

**Response**:
```json
{
  "session_id": "550e8400-...",
  "history": [
    {
      "step_type": "user_message",
      "content": {"role": "user", "content": "Separate stems"},
      "created_at": "2026-01-17T10:00:00Z"
    },
    {
      "step_type": "tool_call",
      "content": {"tool": "separate_stems", "arguments": {...}},
      "created_at": "2026-01-17T10:00:01Z"
    },
    {
      "step_type": "tool_result",
      "content": {"tool": "separate_stems", "result": {...}},
      "created_at": "2026-01-17T10:00:02Z"
    },
    {
      "step_type": "agent_response",
      "content": {"role": "assistant", "content": "I've started..."},
      "created_at": "2026-01-17T10:00:03Z"
    }
  ]
}
```

---

## Glossary

- **Agent**: The LLM-powered system that orchestrates tool calls
- **Session**: A conversation thread with isolated context
- **Step**: A single action in the agent loop (message, tool call, etc.)
- **Tool**: A capability the agent can invoke (separate stems, check job status, etc.)
- **Tool Registry**: Central system for managing available tools
- **Function Calling**: LLM feature that allows structured tool invocation
- **System Prompt**: Instructions that define agent's role and capabilities
- **Context**: The information available to the agent (conversation history, tool results)

---

**For implementation details, see [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md)**
