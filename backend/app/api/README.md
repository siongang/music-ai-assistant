# API Layer

## Purpose

The API layer handles all HTTP requests and responses. It validates incoming data, calls appropriate services, and formats responses for clients.

## Key Components

- **`router.py`**: Aggregates all API routers and includes them in the main FastAPI app
- **`health.py`**: Health check endpoint (`GET /api/health`) for monitoring
- **`endpoints/`**: Individual endpoint modules organized by resource

## Architecture

```
Client Request
  ↓
FastAPI Router (router.py)
  ↓
Endpoint Handler (endpoints/jobs.py)
  ↓
Dependency Injection (get_job_service, get_storage)
  ↓
Service Layer (services/)
  ↓
Response
```

## Important Notes

1. **Dependency Injection**: All endpoints use FastAPI's `Depends()` for services and database sessions
2. **Error Handling**: Use `HTTPException` for client errors (400, 404, etc.)
3. **Status Codes**: Use appropriate HTTP status codes (201 for creation, 200 for retrieval)
4. **Validation**: Pydantic schemas handle request/response validation automatically
5. **File Uploads**: Use `UploadFile` from FastAPI for multipart/form-data uploads

## Current Endpoints

- `POST /api/jobs`: Create a new job and upload audio file
- `GET /api/jobs/{job_id}`: Get job status by ID
- `GET /api/health`: Health check endpoint

## Future Improvements

- [ ] Add authentication/authorization middleware
- [ ] Add rate limiting
- [ ] Add request logging/monitoring
- [ ] Add OpenAPI documentation enhancements
- [ ] Add file download endpoints for processed stems
- [ ] Add job cancellation endpoint
- [ ] Add batch job creation endpoint
- [ ] Add job list/search endpoint with pagination
- [ ] Add WebSocket support for real-time job status updates

## Dependencies

- FastAPI for HTTP framework
- Pydantic for request/response validation
- SQLAlchemy sessions via dependency injection
