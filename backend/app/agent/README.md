# Agent Framework

## Purpose

LLM-powered agent that orchestrates tool execution for conversational audio processing. Uses event-based Responses API for tool calling and conversation management.

## Key Components

- **`executor.py`**: Main agent runtime loop using Responses API
- **`llm_client.py`**: LLM client abstraction (OpenAI Responses API)
- **`session_service.py`**: Session and conversation state management
- **`tools/`**: Tool registry and tool definitions

## Architecture

Event-based conversation flow:
1. User message → Build input_items from conversation history
2. Call Responses API with input_items, tools, instructions
3. Process output items (function_call, message)
4. Execute tools → Add function_call_output → Loop
5. Return final message to user

## Key Features

- **Event-based**: Uses Responses API with input_items/output_items
- **Session-scoped**: Each conversation has isolated context
- **Tool orchestration**: LLM selects and calls appropriate tools
- **Step limits**: Max 10 steps per request (safety)
- **Full observability**: All steps logged to database

## Important Notes

1. **Responses API**: Event-based API, not Chat Completions
2. **Input Items**: Accumulate across iterations (messages + function_call_output)
3. **String Sanitization**: function_call_output and function_call arguments must be JSON strings
4. **Primary Audio**: Each session has one primary audio file (auto-used by agent)

## Dependencies

- OpenAI SDK (Responses API)
- Tool registry
- Session service
- Database (for session/step storage)
