# Music Assistant Backend

FastAPI backend for audio processing and stem separation using Demucs.

## Features

- **Audio Upload**: Upload audio files via REST API
- **Stem Separation**: Automatically separate audio into stems (vocals, drums, bass, other)
- **Job Management**: Track job status and processing progress
- **Background Processing**: Asynchronous job processing via Celery and Redis

## Quick Start

### Prerequisites

- **Python 3.10+**
- **PostgreSQL** database (or SQLite for quick testing)
- **Redis** for job queue (required for Celery)
- **FFmpeg** installed and in PATH
- **PyTorch** (CUDA-enabled recommended for GPU acceleration, or CPU-only)
  - See [PYTORCH_SETUP.md](./PYTORCH_SETUP.md) for installation instructions

### Installation

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Set up database:**

   **Option A: Local PostgreSQL (Recommended)**
   ```bash
   # Create database
   createdb music
   
   # Update DATABASE_URL in app/db/session.py with your credentials:
   # Default: postgresql://postgres:password@localhost:5432/music
   # Change username/password as needed
   ```
   
   Tables will be created automatically on first startup.
   
   **Option B: SQLite (Quick Testing)**
   ```python
   # In app/db/session.py, change:
   DATABASE_URL = "sqlite:///./test.db"
   ```

4. **Verify FFmpeg:**
```bash
ffmpeg -version
```

If not installed:
- **Windows**: Download from https://ffmpeg.org/download.html and add to PATH
- **WSL/Ubuntu**: `sudo apt-get install ffmpeg`
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt-get install ffmpeg`

### Running the Application

You need **two terminals** running simultaneously:

#### Terminal 1: Start the API Server

```bash
cd backend
uvicorn app.main:app --reload
```

API will be available at:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

#### Terminal 2: Start Redis (if not already running)

```bash
# Linux/WSL
sudo service redis-server start

# macOS
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return: PONG
```

#### Terminal 3: Start the Celery Worker

```bash
cd backend
./start_celery_worker.sh
# or manually:
celery -A app.celery_app worker --loglevel=info
```

The Celery worker will:
- Process jobs from the Redis queue automatically
- Retry failed tasks for transient errors
- Update job status in the database
- Handle worker crashes gracefully (tasks are re-queued)

See [CELERY_SETUP.md](./CELERY_SETUP.md) for detailed Celery configuration.

### Quick Test

1. **Start Redis, API server, and Celery worker** (see above - three terminals)
2. **Test with the automated script:**
```bash
python test_api.py path/to/your/audio.mp3
```

Or test manually:
- **Upload file**: Use Swagger UI at http://localhost:8000/docs
- **Check status**: `GET /api/jobs/{job_id}`
- **View results**: Check `backend/tmp/jobs/{job_id}/stems/`

See [TESTING.md](./TESTING.md) for detailed testing instructions.

## API Endpoints

### Health Check
```
GET /api/health
```

### Create Job
```
POST /api/jobs
Content-Type: multipart/form-data

file: <audio_file>
```

Response:
```json
{
  "id": "uuid",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Job Status
```
GET /api/jobs/{job_id}
```

Response:
```json
{
  "id": "uuid",
  "status": "completed",
  "error_message": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:01Z"
}
```

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

Each folder contains a `README.md` with detailed information about its purpose, components, and future improvements:

```
backend/app/
├── api/              # API endpoints (see app/api/README.md)
│   └── endpoints/    # Individual endpoints (see app/api/endpoints/README.md)
├── audio_engine/     # Audio processing (see app/audio_engine/README.md)
│   ├── stems/       # Stem separation (see app/audio_engine/stems/README.md)
│   └── pipeline/    # Audio pipeline (see app/audio_engine/pipeline/README.md)
├── core/            # Core constants (see app/core/README.md)
├── db/              # Database config (see app/db/README.md)
├── models/          # Database models (see app/models/README.md)
├── schemas/         # Pydantic schemas (see app/schemas/README.md)
├── services/        # Business logic (see app/services/README.md)
├── storage/         # File storage (see app/storage/README.md)
├── tasks/           # Celery tasks (see app/tasks/README.md)
└── workers/         # Legacy workers (deprecated - see app/workers/README.md)
```

**Quick Reference:**
- [Application Overview](./app/README.md) - Overall architecture
- [API Layer](./app/api/README.md) - HTTP endpoints
- [Services Layer](./app/services/README.md) - Business logic
- [Storage Layer](./app/storage/README.md) - File storage
- [Audio Engine](./app/audio_engine/README.md) - Audio processing
- [Celery Tasks](./app/tasks/README.md) - Background processing (current)
- [Workers](./app/workers/README.md) - Legacy workers (deprecated)

## Data Flow

1. **Upload**: Client uploads audio file → Saved to `backend/tmp/jobs/{job_id}/input/`
2. **Enqueue**: Job is enqueued to Redis via Celery → Task added to queue
3. **Process**: Celery worker picks up task → Separates audio → Saves stems to `backend/tmp/jobs/{job_id}/stems/`
4. **Status**: Client queries job status → Returns current status

See [CELERY_SETUP.md](./CELERY_SETUP.md) for detailed architecture.

## Configuration

### Environment Variables

The application uses environment variables for configuration (useful for cloud deployment later):

- `DATABASE_URL`: Database connection string (defaults to PostgreSQL local)
- `STORAGE_ROOT`: Root directory for file storage (defaults to `backend/tmp`)
- `REDIS_HOST`: Redis host (default: `localhost`)
- `REDIS_PORT`: Redis port (default: `6379`)
- `REDIS_DB`: Redis database number (default: `0`)
- `REDIS_PASSWORD`: Redis password (optional, for production)

Set these in your environment or modify defaults in:
- `app/db/session.py` - Database connection
- `app/core/constants.py` - Storage paths
- `app/celery_app.py` - Redis/Celery configuration

### Constants

Edit `app/core/constants.py` to modify:
- Supported audio formats
- Default output format
- Storage paths

### Database

Edit `app/db/session.py` to configure:
- Database connection URL
- Connection pool settings

## Development

### Code Style

- Follow PEP 8
- Use type hints
- Add docstrings to all public functions/classes
- Use logging instead of print statements

### Adding New Features

1. **New Endpoint**: Add to `app/api/endpoints/`
2. **New Service**: Add to `app/services/`
3. **New Model**: Add to `app/models/` and import in `app/db/base.py`
4. **New Schema**: Add to `app/schemas/`

## Testing

```bash
# Run tests (when implemented)
pytest
```

## Troubleshooting

### Worker not processing jobs

- Check Redis is running: `redis-cli ping` (should return `PONG`)
- Verify Celery worker is running and connected to Redis
- Check worker logs for errors
- Ensure input file exists in job directory
- Verify task is enqueued (check Redis queue)

See [CELERY_SETUP.md](./CELERY_SETUP.md) for detailed troubleshooting.

### Separation fails

- Verify FFmpeg is installed: `ffmpeg -version`
- Check audio file format is supported
- Ensure sufficient disk space
- Check logs for detailed error messages

## License

[Your License Here]
