# Application Package

## Purpose

Main application package containing all backend components organized by layer.

## Structure

- **`api/`**: HTTP endpoints and routing
- **`agent/`**: LLM agent framework (Responses API, tool orchestration)
- **`audio_engine/`**: Audio processing (Demucs, Basic Pitch)
- **`core/`**: Constants and configuration
- **`db/`**: Database configuration and session management
- **`models/`**: SQLAlchemy database models
- **`schemas/`**: Pydantic request/response schemas
- **`services/`**: Business logic services
- **`storage/`**: Storage abstraction layer
- **`tasks/`**: Celery tasks for background processing
- **`utils/`**: Utility functions
- **`workers/`**: Legacy workers (deprecated)

## Architecture Layers

1. **API Layer**: HTTP endpoints, request/response handling
2. **Agent Layer**: LLM agent with tool orchestration (Responses API)
3. **Service Layer**: Business logic and orchestration
4. **Storage Layer**: File storage abstraction
5. **Audio Engine**: Audio processing (Demucs, Basic Pitch)
6. **Database Layer**: Data persistence
7. **Task Layer**: Celery tasks for async processing

## Data Flow

Client Request → API Endpoint → Service/Agent Layer → Celery Task → Storage/Audio Engine/Database → Response

## Key Principles

1. **Separation of Concerns**: Each layer has specific responsibility
2. **Dependency Injection**: FastAPI's `Depends()` for services
3. **Abstraction**: Storage and services use interfaces
4. **Type Safety**: Type hints throughout
5. **Error Handling**: Proper error handling at each layer

## Entry Point

`main.py`: FastAPI application instance, router registration, database initialization
