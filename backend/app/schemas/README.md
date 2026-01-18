# Pydantic Schemas

## Purpose

Pydantic models for request/response validation and serialization in the API layer.

## Key Components

- **`job.py`**: Job-related schemas (JobCreate, JobResponse)
- **`audio.py`**: Audio-related schemas (AudioResponse)
- **`chat.py`**: Chat/agent schemas (ChatMessageRequest, ChatMessageResponse)

## Current Schemas

- **Audio**: `AudioResponse` (audio_id, filename)
- **Jobs**: `JobCreate` (type, input, params), `JobResponse` (status, progress, output)
- **Chat**: `ChatMessageRequest` (session_id, message), `ChatMessageResponse` (session_id, message, metadata)

## Important Notes

1. **Validation**: Pydantic automatically validates data types and constraints
2. **Serialization**: Automatic JSON serialization for API responses
3. **Documentation**: Schemas generate OpenAPI documentation automatically
4. **Type Safety**: Type hints required for validation

## Future Improvements

- [ ] Pagination schemas
- [ ] Error response schemas
- [ ] Query parameter schemas
- [ ] Schema versioning
