# Application Package

## Purpose

Main application package containing all backend components organized by layer.

## Structure

```
app/
├── api/              # API endpoints and routing
├── audio_engine/     # Audio processing (Demucs)
├── core/            # Core constants and configuration
├── db/              # Database configuration and session management
├── models/          # SQLAlchemy database models
├── schemas/         # Pydantic request/response schemas
├── services/        # Business logic services
├── storage/         # Storage abstraction layer
├── tasks/           # Celery tasks for background processing (current)
├── workers/         # Legacy workers (deprecated)
├── celery_app.py    # Celery application configuration
└── main.py          # FastAPI application entry point
```

## Architecture Layers

1. **API Layer** (`api/`): HTTP endpoints, request/response handling
2. **Service Layer** (`services/`): Business logic and orchestration
3. **Storage Layer** (`storage/`): File storage abstraction
4. **Audio Engine** (`audio_engine/`): Audio processing (Demucs)
5. **Database Layer** (`db/`, `models/`): Data persistence
6. **Task Layer** (`tasks/`): Celery tasks for asynchronous job processing (current)
7. **Worker Layer** (`workers/`): Legacy workers (deprecated)

## Data Flow

```
Client Request
  ↓
API Endpoint (api/)
  ↓
Service Layer (services/)
  ↓
Celery Task (tasks/) - enqueued to Redis
  ↓
Celery Worker (processes task)
  ↓
Storage / Audio Engine / Database
  ↓
Response / Job Status Update
```

See [CELERY_SETUP.md](../CELERY_SETUP.md) for detailed Celery architecture.

## Key Principles

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Dependency Injection**: FastAPI's `Depends()` for services and sessions
3. **Abstraction**: Storage and services use interfaces/abstract classes
4. **Type Safety**: Type hints throughout for better IDE support
5. **Error Handling**: Proper error handling and logging at each layer

## Entry Point

`main.py`: FastAPI application instance, router registration, database initialization

## Future Improvements

- [ ] Add authentication/authorization layer
- [ ] Add caching layer
- [ ] Add monitoring/metrics layer
- [ ] Add event system for decoupled communication
- [ ] Add plugin system for extensibility
- [ ] Add configuration management system
- [ ] Add health check system
- [ ] Add API versioning
