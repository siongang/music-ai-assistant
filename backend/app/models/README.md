# Database Models

## Purpose

SQLAlchemy ORM models representing database tables and their relationships.

## Key Components

- **`job.py`**: `Job` model representing audio processing jobs
- **`audio.py`**: `Audio` model representing uploaded audio files

## Current Models

### Job Model

Represents an audio processing job. Each job represents a single audio processing task that operates on an uploaded audio file.

**Attributes:**
- `id`: UUID primary key (cross-database compatible via `GUID` TypeDecorator)
- `type`: Job type (e.g., "stem_separation", "melody_extraction", "chord_analysis")
- `status`: Job status ("queued", "running", "succeeded", or "failed")
- `input`: JSON object containing input data (e.g., `{"audio_id": "..."}`)
- `params`: JSON object containing job parameters (e.g., `{"model": "demucs_v4"}`) - nullable
- `output`: JSON object containing output data (e.g., `{"vocals": "...", "drums": "..."}`) - nullable
- `progress`: Progress value (0.0 to 1.0) - nullable, defaults to 0.0
- `error_message`: Error message if job failed - nullable
- `created_at`: Timestamp when job was created
- `updated_at`: Timestamp when job was last updated

**Job Lifecycle:**
- `queued`: Job created, waiting to be processed
- `running`: Job is currently being processed
- `succeeded`: Job completed successfully
- `failed`: Job failed with an error

### Audio Model

Represents an uploaded audio file. Each audio file can be used by multiple jobs without re-uploading.

**Attributes:**
- `id`: UUID primary key (cross-database compatible via `GUID` TypeDecorator)
- `filename`: Original filename (sanitized)
- `file_path`: Path to the stored file (relative to storage root)
- `created_at`: Timestamp when audio was uploaded
- `updated_at`: Timestamp when audio was last updated

## Important Notes

1. **UUID Support**: Uses custom `GUID` TypeDecorator for PostgreSQL UUID and SQLite string compatibility
2. **Timestamps**: Auto-managed by database (`server_default=func.now()`)
3. **Model Discovery**: All models imported in `__init__.py` for Alembic discovery
4. **Base Class**: All models inherit from `app.db.base.Base`

## GUID TypeDecorator

Custom SQLAlchemy type that:
- Uses PostgreSQL native UUID type when available
- Falls back to String(36) for SQLite
- Handles conversion between UUID objects and strings

## Future Improvements

- [ ] Add relationships (e.g., Job -> Artifacts)
- [ ] Add indexes for common queries
- [ ] Add model validation
- [ ] Add model methods for business logic
- [ ] Add soft delete support
- [ ] Add audit fields (created_by, updated_by)
- [ ] Add model versioning
- [ ] Add model serialization utilities
- [ ] Add model factories for testing

## Dependencies

- `sqlalchemy`: ORM framework
- `app.db.base.Base`: Base class for all models
