# Testing Readiness Checklist

## ✅ Implementation Complete

All phases from the execution plan have been implemented:

- ✅ **Phase 1**: Database Models (Session, AgentStep)
- ✅ **Phase 2**: Tool Layer (Base class, 3 tools, Registry)
- ✅ **Phase 3**: Agent Runtime (SessionService, LLM Client with Responses API, AgentExecutor)
- ✅ **Phase 4**: API Endpoints (Chat endpoints, Router integration)
- ✅ **Environment**: .env.example created

## Pre-Testing Setup

### 1. Environment Variables

```bash
cd backend
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY
```

**Required:**
- `OPENAI_API_KEY` - Your OpenAI API key (required for agent to work)

**Optional (have defaults):**
- `DATABASE_URL` - Defaults to SQLite (`sqlite:///./test.db`)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB` - Defaults to localhost:6379
- `STORAGE_ROOT` - Defaults to `./tmp`

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**New dependencies added:**
- `jsonschema` - For tool input validation
- `openai` - For LLM client (Responses API)

### 3. Database Setup

**Option A: SQLite (Easiest - No setup needed)**
- Tables will be auto-created on server startup
- Database file: `backend/test.db`

**Option B: PostgreSQL**
```bash
# Create database
createdb music

# Set DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/music

# Tables will be auto-created on server startup
```

### 4. Redis (Optional - Only needed for background jobs)

If you want to test job processing:
```bash
# Start Redis (if not running)
redis-server
```

If Redis is not running, the agent will still work but job processing won't.

### 5. Start the Server

```bash
cd backend
uvicorn app.main:app --reload
```

The server will:
- Auto-create database tables (Session, AgentStep, Job, Audio)
- Start on http://localhost:8000
- API docs at http://localhost:8000/api/docs

## Quick Test

### 1. Create a Session

```bash
curl -X POST http://localhost:8000/api/chat/sessions
```

Expected response:
```json
{
  "session_id": "uuid-here",
  "created_at": "2024-..."
}
```

### 2. Send a Message (without audio)

```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "message": "Hello, what can you do?"
  }'
```

Expected: Agent responds explaining its capabilities.

### 3. Upload Audio and Send Message

```bash
curl -X POST http://localhost:8000/api/chat/message-with-upload \
  -F "file=@your-audio-file.mp3" \
  -F "message=Separate this into stems"
```

Expected: Agent acknowledges upload and creates stem separation job.

### 4. Check Session History

```bash
curl http://localhost:8000/api/chat/sessions/{session_id}/history
```

Expected: Returns conversation history with all steps.

## What to Test

1. **Session Management**
   - Create session
   - Send messages
   - Retrieve history

2. **Agent Responses**
   - Basic conversation
   - Tool calling (separate_stems, convert_to_midi, get_job_status)
   - Error handling

3. **Audio Upload**
   - Upload audio file
   - Set as primary audio
   - Agent uses primary audio automatically

4. **Tool Execution**
   - Agent calls tools correctly
   - Tool results are logged
   - Multi-step tool execution works

## Known Limitations

- **OpenAI Responses API**: Requires `gpt-5` model (or compatible). If you get API errors, check your OpenAI account has access.
- **Background Jobs**: Require Redis and Celery worker running
- **One Audio Per Session**: Beta design - each session has one primary audio

## Troubleshooting

### "Module not found" errors
- Make sure you're in the backend directory
- Activate virtual environment: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`

### "Table doesn't exist" errors
- Check database connection
- Restart server (tables auto-create on startup)
- For SQLite, delete `test.db` and restart

### "OpenAI API key required" errors
- Set `OPENAI_API_KEY` in `.env` file
- Restart server after setting env var

### Agent not calling tools
- Check tool schemas are correct
- Verify LLM model supports function calling
- Check logs for errors

## Next Steps

After basic testing works:
1. Test with real audio files
2. Test job status checking
3. Test error scenarios
4. Review logs for any issues
