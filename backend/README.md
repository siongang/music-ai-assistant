# Music Assistant Backend

This backend is a FastAPI application for project-based music workflows. It stores project state in a database, stores uploaded and generated files on disk, and runs long audio jobs through Celery workers.

## What Stays True

- Projects are the top-level aggregate.
- Audio and jobs belong to a project.
- The API handles validation and orchestration.
- Long-running processing happens asynchronously through Celery and Redis.
- Files live under a storage root on disk.
- OpenAPI is the source of truth for current request and response shapes.

## Main Runtime Pieces

- `app/main.py`: FastAPI bootstrap and router registration.
- `app/api/`: HTTP routes.
- `app/services/`: business logic around projects, audio, jobs, and processing.
- `app/tasks/`: Celery tasks for background work.
- `app/audio_engine/`: processing implementations such as stem separation and MIDI conversion.
- `app/agent/`: chat and tool execution flow.
- `app/models/`, `app/schemas/`, `app/db/`: persistence and API schemas.
- `app/storage/`: file storage abstraction, currently local-disk backed.

## Running Locally

From `backend/`:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

If you want background job execution, start Redis and a worker in separate terminals:

```bash
celery -A app.celery_app worker --loglevel=info
```

`./start_celery_worker.sh` is an optional helper for local worker startup.

## Required Infrastructure

- Python
- A database via `DATABASE_URL`
- Redis for Celery-backed async jobs
- FFmpeg on `PATH`

SQLite is acceptable for lightweight local development. Production should use a real database and explicit migrations.

Depending on which processing paths you use, model/runtime dependencies such as PyTorch and Demucs may also be required.

## Configuration

The backend is primarily configured through environment variables:

- `DATABASE_URL`: SQLAlchemy connection string
- `STORAGE_ROOT`: root directory for uploads and job outputs; defaults to `backend/tmp`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, `REDIS_PASSWORD`: Celery broker/backend configuration
- `OPENAI_API_KEY`: required for chat/agent features
- `OPENAI_MODEL` or `LLM_MODEL`: optional chat model override

## API Surface

The stable API shape is:

- project routes under `/api/projects`
- project-owned audio under `/api/projects/{project_id}/audio`
- project-owned jobs under `/api/projects/{project_id}/jobs`
- chat routes under `/api/chat`
- file downloads under `/api/audio/files/{path}`

Use the live schema instead of this README for endpoint details:

- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`
- Health check: `http://localhost:8000/api/health`

## Storage Model

- Source audio is stored under the storage root.
- Job outputs are stored as files and referenced from job records.
- Database records track ownership and metadata; projects own both audio and jobs.

## Documentation Rule

Keep this file limited to durable concepts. Avoid adding route-by-route docs, setup permutations, or migration notes here.
