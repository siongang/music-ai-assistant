# API Endpoints

## Purpose

Individual endpoint modules organized by resource. Each module contains related HTTP endpoints.

## Current Endpoints

- **`audio.py`**: Audio file upload (`POST /api/audio`)
- **`jobs.py`**: Job management (`POST /api/jobs`, `GET /api/jobs/{job_id}`)
- **`chat.py`**: LLM agent endpoints (`POST /api/chat/message`, `POST /api/chat/sessions`)

## Structure

Each endpoint module:
- Defines dependency functions for services
- Creates `APIRouter` instance
- Uses FastAPI dependency injection
- Returns Pydantic schema responses

## Important Notes

1. **Dependency Injection**: Services created per request (FastAPI manages lifecycle)
2. **Error Handling**: Use `HTTPException` with appropriate status codes
3. **File Validation**: Check extensions and sizes before processing
4. **Type Hints**: Required for validation and IDE support

## Future Improvements

- [ ] Job operations (cancel, retry, delete)
- [ ] Job listing with filters and pagination
- [ ] File download endpoints
- [ ] WebSocket for real-time updates
- [ ] Batch operations
