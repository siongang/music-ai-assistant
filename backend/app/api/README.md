# API Layer

## Purpose

Handles all HTTP requests and responses. Validates incoming data, calls services, and formats responses.

## Key Components

- **`router.py`**: Aggregates all API routers
- **`health.py`**: Health check endpoint
- **`endpoints/`**: Individual endpoint modules (audio, jobs, chat)

## Architecture

Client Request → FastAPI Router → Endpoint Handler → Dependency Injection → Service Layer → Response

## Important Notes

1. **Dependency Injection**: FastAPI's `Depends()` for services and sessions
2. **Error Handling**: `HTTPException` for client errors
3. **Validation**: Pydantic schemas handle automatic validation
4. **File Uploads**: `UploadFile` for multipart/form-data

## Current Endpoints

- Audio: Upload files
- Jobs: Create and check job status
- Chat: LLM agent conversation endpoints

## Future Improvements

- [ ] Authentication/authorization
- [ ] Rate limiting
- [ ] Request logging/monitoring
- [ ] WebSocket for real-time updates
