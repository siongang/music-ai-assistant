# Music Assistant Backend

FastAPI backend for audio processing and stem separation using Demucs.

## Features

- **Audio Upload**: Upload audio files via REST API
- **Stem Separation**: Automatically separate audio into stems (vocals, drums, bass, other)
- **Job Management**: Track job status and processing progress
- **Background Processing**: Asynchronous job processing via worker

## Quick Start

### Prerequisites

- **Python 3.10+**
- **PostgreSQL** database (or SQLite for quick testing)
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

#### Terminal 2: Start the Worker

```bash
cd backend
python -m app.workers.audio_job_worker
```

The worker will:
- Poll the database every 5 seconds for pending jobs
- Process jobs automatically
- Update job status in the database

### Quick Test

1. **Start both the API server and worker** (see above - two terminals)
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
└── workers/         # Background workers (see app/workers/README.md)
```

**Quick Reference:**
- [Application Overview](./app/README.md) - Overall architecture
- [API Layer](./app/api/README.md) - HTTP endpoints
- [Services Layer](./app/services/README.md) - Business logic
- [Storage Layer](./app/storage/README.md) - File storage
- [Audio Engine](./app/audio_engine/README.md) - Audio processing
- [Workers](./app/workers/README.md) - Background processing

## Data Flow

1. **Upload**: Client uploads audio file → Saved to `backend/tmp/jobs/{job_id}/input/`
2. **Process**: Worker picks up job → Separates audio → Saves stems to `backend/tmp/jobs/{job_id}/stems/`
3. **Status**: Client queries job status → Returns current status

## Configuration

### Environment Variables

The application uses environment variables for configuration (useful for cloud deployment later):

- `DATABASE_URL`: Database connection string (defaults to PostgreSQL local)
- `STORAGE_ROOT`: Root directory for file storage (defaults to `backend/tmp`)

Set these in your environment or modify defaults in:
- `app/db/session.py` - Database connection
- `app/core/constants.py` - Storage paths

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

- Check database connection
- Verify worker is running
- Check logs for errors
- Ensure input file exists in job directory

### Separation fails

- Verify FFmpeg is installed: `ffmpeg -version`
- Check audio file format is supported
- Ensure sufficient disk space
- Check logs for detailed error messages

## License

[Your License Here]
