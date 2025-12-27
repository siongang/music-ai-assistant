# Services Layer

## Purpose

Business logic and orchestration layer. Services coordinate between different components and implement business rules.

## Key Components

- **`job_service.py`**: Database operations for jobs (CRUD)
- **`pipeline_runner_service.py`**: Orchestrates audio processing pipeline
- **`stem_service.py`**: High-level interface for stem separation

## Architecture

```
API Endpoint
  ↓
Service Layer (this folder)
  ↓
Storage / Audio Engine / Database
```

## Service Responsibilities

### JobService
- Create, read, update jobs in database
- Query jobs by status
- Handle job status transitions

### PipelineRunnerService
- Orchestrate stem separation workflow
- Coordinate between StemService and file saving
- Handle pipeline errors

### StemService
- High-level interface for stem separation
- Wraps DemucsSeparator
- Provides clean API for rest of application

## Important Notes

1. **Single Responsibility**: Each service has a focused responsibility
2. **Dependency Injection**: Services receive dependencies via constructor
3. **Error Handling**: Services should handle and log errors appropriately
4. **Transaction Management**: Services use database sessions for transactions
5. **No HTTP Logic**: Services are framework-agnostic (no FastAPI imports)

## Future Improvements

- [ ] Add service interfaces/abstract base classes
- [ ] Add service-level caching
- [ ] Add service-level validation
- [ ] Add service-level logging/metrics
- [ ] Add service-level retry logic
- [ ] Add service-level rate limiting
- [ ] Add service-level circuit breakers
- [ ] Add service tests
- [ ] Add service documentation

## Dependencies

- Database sessions (SQLAlchemy)
- Storage implementations
- Audio engine components
