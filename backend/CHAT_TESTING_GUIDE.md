# Chat/LLM Testing Guide

This guide helps you test and debug the LLM chat functionality.

## Quick Start

1. **Start the server:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Run the test script:**
   ```bash
   python test_chat.py
   ```

3. **Or test via Swagger UI:**
   - Open http://localhost:8000/api/docs
   - Find `/chat/message` endpoint
   - Click "Try it out"
   - Send a test message

## Common Issues & Solutions

### Issue 1: Model Name Error

**Symptom:** API returns error about invalid model or model not found.

**Check:**
- Verify the model name is correct for your OpenAI account
- Some models may require special access or beta features
- Current default: `gpt-5`

**If you need to change the model:**
```python
# In backend/app/api/endpoints/chat.py line 72
llm_client = create_llm_client(provider="openai", model="your-model-name")
```

### Issue 2: OpenAI API Key Missing

**Symptom:** Error about API key required or authentication failed.

**Solution:**
1. Check `.env` file exists in `backend/` directory
2. Add: `OPENAI_API_KEY=sk-your-key-here`
3. Restart the server

**Verify:**
```bash
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('Key set' if os.getenv('OPENAI_API_KEY') else 'Key missing')"
```

### Issue 3: Responses API Not Available

**Symptom:** Error about `responses` endpoint not existing or 404.

**Problem:** The Responses API requires a compatible model (e.g., gpt-5) and may require beta access.

**Check:**
1. Verify OpenAI SDK version:
   ```bash
   pip show openai
   ```
   Should be recent (>= 1.0.0)

2. Check model name:
   - Default: `gpt-5`
   - Can be set via `OPENAI_MODEL` or `LLM_MODEL` env var
   - Model must support Responses API

3. Verify API access:
   ```python
   from openai import OpenAI
   client = OpenAI()
   # Try calling responses.create() - may require beta access
   ```

**Note:** The agent framework is designed for Responses API (event-based). If you need to use a different API, you'll need to implement a different LLM client.

### Issue 4: Timeout Errors

**Symptom:** Requests timeout after 30 seconds.

**Possible causes:**
- LLM is taking too long to respond
- Network issues
- API rate limiting

**Solution:**
- Increase timeout in test script
- Check server logs for actual errors
- Verify API key has credits/quota

### Issue 5: No Response or Empty Response

**Symptom:** Request succeeds but response is empty or generic error message.

**Check:**
1. Server logs (terminal running uvicorn)
2. Look for Python exceptions
3. Check if LLM client is actually being called

**Debug:**
- Enable debug logging:
  ```python
  import logging
  logging.basicConfig(level=logging.DEBUG)
  ```

## Testing Checklist

### Basic Functionality

- [ ] Health endpoint works (`GET /api/health`)
- [ ] Can create session (`POST /api/chat/sessions`)
- [ ] Can send message (`POST /api/chat/message`)
- [ ] Receives response from LLM
- [ ] Can get session history (`GET /api/chat/sessions/{id}/history`)

### LLM Integration

- [ ] LLM responds with relevant text
- [ ] Conversation context is maintained
- [ ] Multiple messages in same session work
- [ ] System prompt is being used correctly

### Tool Calling (Advanced)

- [ ] LLM can call tools when appropriate
- [ ] Tool results are returned correctly
- [ ] Multi-step tool execution works
- [ ] Error handling for tool failures works

## Manual Testing Steps

### Step 1: Test Basic Chat

```bash
# Create session
curl -X POST http://localhost:8000/api/chat/sessions

# Send message (replace SESSION_ID)
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "message": "Hello, what can you do?"
  }'
```

### Step 2: Check Server Logs

Watch the terminal where uvicorn is running. Look for:
- `INFO` messages about processing messages
- `ERROR` messages about API failures
- Python tracebacks

### Step 3: Test with Swagger UI

1. Open http://localhost:8000/api/docs
2. Find `/chat/message` endpoint
3. Click "Try it out"
4. Fill in:
   ```json
   {
     "message": "Hello"
   }
   ```
5. Click "Execute"
6. Check response and status code

## Debugging Tips

### Enable Verbose Logging

Add to `backend/app/main.py`:
```python
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO to DEBUG
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
```

### Check LLM Client Directly

Create a test script:
```python
from app.agent.llm_client import create_llm_client

client = create_llm_client(provider="openai", model="gpt-5")
response = client.run(
    input_items=[{"role": "user", "content": "Hello"}],
    instructions="You are a helpful assistant."
)
print(response)
print(f"Output items: {response.output}")
print(f"Has tool calls: {response.has_tool_calls}")
print(f"Has content: {response.has_content}")
```

### Verify Database

Check if messages are being stored:
```bash
# If using SQLite
sqlite3 backend/test.db "SELECT * FROM agent_steps ORDER BY created_at DESC LIMIT 5;"
```

## Expected Behavior

### Successful Flow

1. User sends message → `POST /api/chat/message`
2. Server creates/loads session
3. Server calls LLM with conversation history
4. LLM processes and responds
5. Response saved to database
6. Response returned to user

### Response Format

```json
{
  "session_id": "uuid",
  "message": "LLM response text here",
  "metadata": {
    "steps": 1,
    "tools_used": []
  }
}
```

## Next Steps After Basic Testing Works

1. Test with audio upload
2. Test tool calling (separate_stems, convert_to_midi)
3. Test error scenarios
4. Test conversation continuity
5. Test with longer conversations

## Getting Help

If issues persist:

1. **Check server logs** - Most errors will appear there
2. **Run test script** - `python test_chat.py` provides detailed diagnostics
3. **Verify environment** - API key, model name, dependencies
4. **Check OpenAI status** - API might be down
5. **Review code** - Check `executor.py` and `llm_client.py` for issues
