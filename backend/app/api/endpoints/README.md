# API Endpoints

## Purpose

Individual endpoint modules organized by resource. Each module contains related HTTP endpoints.

## Current Endpoints

### `audio.py`

Audio file management endpoints:
- `POST /api/audio`: Upload an audio file and get an `audio_id`

### `jobs.py`

Job management endpoints:
- `POST /api/jobs`: Create a new job using an existing `audio_id`
- `GET /api/jobs/{job_id}`: Get job status by ID

## Structure

Each endpoint module:
1. Defines dependency functions (e.g., `get_job_service()`, `get_storage()`)
2. Creates an `APIRouter` instance
3. Defines route handlers with proper decorators
4. Uses dependency injection for services
5. Returns Pydantic schema responses

## Important Notes

1. **Dependency Functions**: Create service instances per request (FastAPI manages lifecycle)
2. **Error Handling**: Always use `HTTPException` with appropriate status codes
3. **File Validation**: Check file extensions and sizes before processing
4. **Logging**: Log important operations (job creation, errors, etc.)
5. **Type Hints**: Use proper type hints for better IDE support and validation

## Example Pattern

```python
router = APIRouter(prefix="/jobs", tags=["jobs"])

def get_service(db: Session = Depends(get_db)):
    return Service(db)

@router.post("", response_model=ResponseSchema)
def create_resource(
    data: RequestSchema,
    service: Service = Depends(get_service)
):
    # Handle request
    return result
```

## Future Improvements

- [ ] Add more job operations (cancel, retry, delete)
- [ ] Add job listing with filters and pagination
- [ ] Add file download endpoints for stems
- [ ] Add WebSocket endpoints for real-time updates
- [ ] Add batch operations
- [ ] Add job statistics endpoint
- [ ] Add user management endpoints (when auth is added)
