# Music Assistant Backend

FastAPI backend for music analysis and processing. Part of the Music Assistant platform that combines audio processing with LLM-powered music understanding.

## Features

- **Audio Upload**: Upload audio files separately from job creation (upload once, use many times)
- **Flexible Jobs**: Create different types of jobs (stem separation, MIDI conversion, melody extraction, chord analysis)
- **Stem Separation**: Automatically separate audio into stems (vocals, drums, bass, other) using Demucs
- **MIDI Conversion**: Convert audio to MIDI format with note events using Basic Pitch
- **Job Management**: Track job status, progress, and results
- **Background Processing**: Asynchronous job processing via Celery and Redis
- **Extensible Architecture**: Easy to add new job types and processing pipelines

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
   
   **Create tables:**
   - **Fresh install**: Run `psql -U postgres -d music -f setup_db.sql`
   - **Existing database**: Run `psql -U postgres -d music -f migrate_db.sql` to migrate
   - **Auto-create**: Tables will also be created automatically on first startup (development only)
   
   **Option B: SQLite (Quick Testing)**
   ```python
   # In app/db/session.py, change:
   DATABASE_URL = "sqlite:///./test.db"
   ```
   
   **For existing SQLite databases:**
   - If you have an old database, run: `./migrate_sqlite.sh test.db`
   - Or simply delete `test.db` and let the app recreate it on startup

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

### Upload Audio
```
POST /api/audio
Content-Type: multipart/form-data

file: <audio_file>
```

Response:
```json
{
  "audio_id": "abc-123-def",
  "filename": "song.mp3"
}
```

### Create Job
```
POST /api/jobs
Content-Type: application/json

{
  "type": "stem_separation",
  "input": {
    "audio_id": "abc-123-def"
  },
  "params": {
    "model": "demucs_v4"
  }
}
```

Response:
```json
{
  "job_id": "xyz-789",
  "type": "stem_separation",
  "status": "queued",
  "audio_id": "abc-123-def",
  "input": {"audio_id": "abc-123-def"},
  "params": {"model": "demucs_v4"},
  "progress": null,
  "output": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Job Status
```
GET /api/jobs/{job_id}
```

Response (Running):
```json
{
  "job_id": "xyz-789",
  "type": "stem_separation",
  "status": "running",
  "audio_id": "abc-123-def",
  "progress": 0.42,
  "output": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

Response (Stem Separation - Completed):
```json
{
  "job_id": "xyz-789",
  "type": "stem_separation",
  "status": "succeeded",
  "audio_id": "abc-123-def",
  "progress": 1.0,
  "output": {
    "vocals": "jobs/xyz-789/stems/track.vocals.mp3",
    "drums": "jobs/xyz-789/stems/track.drums.mp3",
    "bass": "jobs/xyz-789/stems/track.bass.mp3",
    "other": "jobs/xyz-789/stems/track.other.mp3"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:30Z"
}
```

#### 4. MIDI Conversion

```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "midi_conversion",
    "input": {"audio_id": "abc-123-def"},
    "params": {
      "save_notes": true,
      "midi_tempo": 120
    }
  }'
```

Response (MIDI Conversion - Completed):
```json
{
  "job_id": "abc-456",
  "type": "midi_conversion",
  "status": "succeeded",
  "audio_id": "abc-123-def",
  "progress": 1.0,
  "output": {
    "midi": "jobs/abc-456/midi/track.mid",
    "notes": "jobs/abc-456/midi/track_notes.csv"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:45Z"
}
```

## User Flow

### 1. Upload Audio (Synchronous)
```
POST /api/audio → Returns audio_id
```
- File is saved to `storage/audio/{audio_id}/`
- Audio record created in database
- Returns immediately

### 2. Create Job (Asynchronous)
```
POST /api/jobs → Returns job_id
```
- Validates audio_id exists
- Creates job record with status "queued"
- Enqueues job to Redis
- Returns immediately

### 3. Worker Processes Job (Background)
- Celery worker picks up job from Redis
- Updates status to "running"
- Processes audio based on job type
- Updates status to "succeeded" or "failed"
- Saves output files

### 4. Check Job Status
```
GET /api/jobs/{job_id} → Returns current status and output
```

### 5. Reuse Audio
- Same `audio_id` can be used for multiple jobs
- No need to re-upload for different analysis types

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

### New Architecture (After Refactor)

1. **Upload Audio**: 
   - Client uploads audio file → Saved to `storage/audio/{audio_id}/`
   - Audio record created in database
   - Returns `audio_id` immediately

2. **Create Job**:
   - Client creates job with `audio_id` and job type
   - Job record created with status "queued"
   - Job enqueued to Redis via Celery

3. **Process Job**:
   - Celery worker picks up task from Redis
   - Loads audio file using `audio_id`
   - Processes based on job type (stem separation, etc.)
   - Saves output to `storage/jobs/{job_id}/stems/`
   - Updates job status and output paths

4. **Check Status**:
   - Client queries job status
   - Returns current status, progress, and output paths

### File Storage Structure

```
storage/
├── audio/
│   └── {audio_id}/
│       └── {filename}          # Original uploaded file
└── jobs/
    └── {job_id}/
        └── stems/
            ├── track.vocals.mp3
            ├── track.drums.mp3
            ├── track.bass.mp3
            └── track.other.mp3
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture.

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

### Separation fails

- Verify FFmpeg is installed: `ffmpeg -version`
- Check audio file format is supported
- Ensure sufficient disk space
- Check logs for detailed error messages

## License

[Your License Here]
