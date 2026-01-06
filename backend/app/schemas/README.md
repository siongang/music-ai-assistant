# Pydantic Schemas

## Purpose

Pydantic models for request/response validation and serialization in the API layer.

## Key Components

- **`job.py`**: Job-related schemas (request/response models)
- **`audio.py`**: Audio-related schemas (request/response models)

## Current Schemas

### Audio Schemas

- **`AudioResponse`**: Response schema for audio upload
  - Returns `audio_id` and `filename` after upload

### Job Schemas

- **`JobCreate`**: Request schema for job creation
  - Validates `type`, `input` (with `audio_id`), and optional `params`
- **`JobResponse`**: Response schema for job information
  - Returns job status, progress, output, and metadata
- **`JobInput`**: Input data schema (contains `audio_id`)
- **`JobParams`**: Job parameters schema (model selection, etc.)

## Important Notes

1. **Validation**: Pydantic automatically validates data types and constraints
2. **Serialization**: Automatic JSON serialization for API responses
3. **Documentation**: Schemas automatically generate OpenAPI documentation
4. **Type Safety**: Use type hints for better IDE support and validation

## Schema Pattern

```python
class JobResponse(BaseModel):
    id: UUID
    status: str
    created_at: datetime
    # ... other fields
```

## Future Improvements

- [ ] Add request validation schemas
- [ ] Add pagination schemas
- [ ] Add error response schemas
- [ ] Add file upload schemas
- [ ] Add query parameter schemas
- [ ] Add schema versioning
- [ ] Add schema documentation
- [ ] Add custom validators
- [ ] Add schema examples for OpenAPI

## Dependencies

- `pydantic`: Data validation library
- `fastapi`: Uses Pydantic for request/response models
