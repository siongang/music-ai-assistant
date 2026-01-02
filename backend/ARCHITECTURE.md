# Backend Architecture Documentation

## Overview

The Music Assistant backend is a FastAPI application that processes audio files by separating them into individual stems (vocals, drums, bass, other) using the Demucs library.

## Project Structure

```
backend/app/
├── api/                    # API endpoints and routing
│   ├── endpoints/          # Individual endpoint modules
│   │   └── jobs.py        # Job management endpoints
│   ├── health.py          # Health check endpoint
│   └── router.py          # Main API router
├── audio_engine/          # Audio processing engine
│   ├── stems/            # Stem separation
│   │   └── demucs_separator.py
│   └── pipeline/         # Audio processing pipeline
├── core/                  # Core application components
│   └── constants.py      # Application-wide constants
├── db/                    # Database configuration
│   ├── base.py           # SQLAlchemy base class
│   └── session.py        # Database session management
├── models/                # SQLAlchemy database models
│   ├── job.py            # Job model
│   └── audio.py          # Audio model
├── schemas/               # Pydantic schemas for API
│   ├── job.py            # Job request/response schemas
│   └── audio.py          # Audio request/response schemas
├── services/              # Business logic services
│   ├── job_service.py    # Job database operations
│   ├── audio_service.py  # Audio database operations
│   ├── pipeline_runner_service.py  # Audio processing orchestration
│   └── stem_service.py   # Stem separation service
├── storage/               # Storage abstraction
│   ├── base.py           # Storage interface
│   └── local_storage.py  # Local filesystem storage
├── workers/               # Background workers
│   ├── audio_job_worker.py  # Job processing worker
│   └── fetch_input.py    # Input fetching utility
└── main.py               # FastAPI application entry point
```

## Data Flow

### 1. Audio Upload Flow (Synchronous)

```
Client Request (POST /api/audio)
  ↓
audio.py::upload_audio()
  ↓
LocalStorage.save_audio_file() → Filesystem (saves to audio/{audio_id}/)
  ↓
AudioService.create_audio() → Database (creates Audio record)
  ↓
Returns AudioResponse with audio_id
```

**File Paths:**
- Database: `audio` table
- Filesystem: `storage/audio/{audio_id}/{filename}`

### 2. Job Creation Flow (Asynchronous)

```
Client Request (POST /api/jobs)
  ↓
jobs.py::create_job()
  ↓
AudioService.get_audio_path() → Validates audio exists
  ↓
JobService.create_job() → Database (creates Job record)
  ↓
process_audio_job.delay(job_id) → Redis Queue (enqueues Celery task)
  ↓
Returns JobResponse with job_id and status "queued"
```

**File Paths:**
- Database: `jobs` table
- No file operations (audio already uploaded)

### 3. Job Processing Flow (Background)

```
Celery Worker (picks up task from Redis)
  ↓
process_audio_job task (app/tasks/job_tasks.py)
  ↓
JobService.get_job() → Database (loads job)
  ↓
AudioService.get_audio_path() → Gets audio file path
  ↓
JobService.update_job_status("running") → Database
  ↓
Route to processor based on job.type:
  - stem_separation → PipelineRunnerService.process_stem_separation()
  - melody_extraction → PipelineRunnerService.process_melody_extraction()
  - chord_analysis → PipelineRunnerService.process_chord_analysis()
  ↓
PipelineRunnerService processes audio:
  - StemService.separate() → DemucsSeparator.separate()
  - demucs.api.Separator.separate_audio_file() → Demucs library
  - demucs.audio.save_audio() → Filesystem (saves stems)
  ↓
Collect output file paths
  ↓
JobService.update_job_status("succeeded", output={...}) → Database
```

**Note:** The old polling worker (`AudioJobWorker`) has been replaced with Celery tasks. Tasks are automatically retried on transient errors and are not lost if a worker crashes.

**File Paths:**
- Input: `storage/audio/{audio_id}/{filename}` (reused from upload)
- Output: `storage/jobs/{job_id}/stems/{track}.{stem}.mp3`

### 4. Job Status Query Flow

```
Client Request (GET /api/jobs/{job_id})
  ↓
jobs.py::get_job()
  ↓
JobService.get_job() → Database
  ↓
Extract audio_id from job.input
  ↓
Returns JobResponse with status, progress, output
```

## Key Components

### API Layer (`api/`)

- **Purpose**: HTTP endpoints and request/response handling
- **Responsibilities**:
  - Validate incoming requests
  - Call appropriate services
  - Return formatted responses
  - Handle HTTP errors

**Key Files:**
- `api/endpoints/audio.py`: Audio upload endpoint
- `api/endpoints/jobs.py`: Job CRUD operations
- `api/health.py`: Health check endpoint
- `api/router.py`: Aggregates all routers

### Services Layer (`services/`)

- **Purpose**: Business logic and orchestration
- **Responsibilities**:
  - Coordinate between different components
  - Implement business rules
  - Handle complex operations

**Key Services:**
- `AudioService`: Database operations for audio files
- `JobService`: Database operations for jobs
- `PipelineRunnerService`: Orchestrates different audio processing operations
  - `process_stem_separation()`: Stem separation workflow
  - `process_melody_extraction()`: Melody extraction (future)
  - `process_chord_analysis()`: Chord analysis (future)
- `StemService`: Wraps stem separation functionality

### Storage Layer (`storage/`)

- **Purpose**: Abstract file storage operations
- **Responsibilities**:
  - Manage file paths
  - Save/retrieve files
  - Provide consistent interface

**Current Implementation:**
- `LocalStorage`: Filesystem-based storage
- Future: Could add S3Storage, AzureStorage, etc.

### Audio Engine (`audio_engine/`)

- **Purpose**: Audio processing functionality
- **Responsibilities**:
  - Separate audio into stems
  - Handle audio format conversion
  - Manage audio processing models

**Key Components:**
- `DemucsSeparator`: Wrapper around Demucs library
- `StemService`: High-level interface for separation

### Tasks (`tasks/`) - Current Implementation

- **Purpose**: Asynchronous job processing via Celery
- **Responsibilities**:
  - Process jobs from Redis queue
  - Handle task retries and error recovery
  - Update job status

**Key Components:**
- `process_audio_job`: Celery task that processes audio jobs
- Automatic retries for transient errors
- Late acknowledgment to prevent task loss

**Configuration:**
- See `app/celery_app.py` for Celery configuration
- See `app/tasks/README.md` for detailed documentation

### Workers (`workers/`) - Deprecated

- **Purpose**: Legacy background job processing (deprecated)
- **Status**: Replaced by Celery tasks in `app/tasks/`
- **Note**: Kept for reference only. Jobs are now processed via Celery.

### Database Layer (`db/`, `models/`)

- **Purpose**: Data persistence
- **Responsibilities**:
  - Define data models
  - Manage database connections
  - Provide session management

**Key Components:**
- `Job` model: Represents a processing job
- `get_db()`: FastAPI dependency for database sessions

## Dependency Injection

The application uses FastAPI's dependency injection system:

1. **Database Sessions**: `get_db()` provides a session per request
2. **Services**: `get_job_service()` creates JobService with db session
3. **Storage**: `get_storage()` creates LocalStorage instance

This ensures:
- Proper resource cleanup
- Testability (easy to mock dependencies)
- Request-scoped resources

## Constants

All application-wide constants are defined in `core/constants.py`:

- `AUDIO_EXTENSIONS`: Supported audio file formats
- `JobStatus`: Job status values
- `STORAGE_ROOT`: Root directory for file storage
- `DEFAULT_STEM_FORMAT`: Default output format

## Error Handling

1. **API Level**: HTTP exceptions with appropriate status codes
2. **Service Level**: Raises exceptions that bubble up to API layer
3. **Worker Level**: Catches exceptions, updates job status to "failed"

## Job Status Lifecycle

```
pending → processing → completed
                ↓
             failed
```

- **pending**: Job created, waiting to be processed
- **processing**: Worker is currently processing the job
- **completed**: Job completed successfully
- **failed**: Job failed with an error (error_message contains details)

## File Organization

### Input Files
- Location: `backend/tmp/jobs/{job_id}/input/{filename}`
- Created: When job is created via POST /api/jobs
- Format: Original uploaded file format

### Output Files (Stems)
- Location: `backend/tmp/jobs/{job_id}/stems/{track}.{stem}.mp3`
- Created: When job is processed
- Format: `{track}.vocals.mp3`, `{track}.drums.mp3`, etc.

## Future Enhancements

1. **Storage Backends**: Support for S3, Azure Blob Storage
2. **Job Queue**: Replace polling with proper job queue (Celery, RQ)
3. **Progress Tracking**: Add progress callbacks for long-running jobs
4. **Multiple Input Sources**: Support URLs, cloud storage links
5. **Authentication**: Add user authentication and authorization
6. **Webhooks**: Notify clients when jobs complete
7. **Rate Limiting**: Prevent abuse of API endpoints

## Running the Application

### API Server
```bash
uvicorn app.main:app --reload
```

### Worker
```bash
python -m app.workers.audio_job_worker
```

## Environment Variables (Future)

- `DATABASE_URL`: PostgreSQL connection string
- `STORAGE_ROOT`: Root directory for file storage
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)
