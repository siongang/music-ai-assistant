# Database Models

## Purpose

SQLAlchemy ORM models representing database tables and their relationships.

## Key Components

- **`job.py`**: `Job` model representing audio processing jobs
- **`artifact.py`**: Artifact model (if exists)

## Current Models

### Job Model

Represents an audio processing job:
- `id`: UUID primary key (cross-database compatible via `GUID` TypeDecorator)
- `status`: Job status (pending, processing, completed, failed)
- `error_message`: Error message if job failed
- `created_at`: Timestamp when job was created
- `updated_at`: Timestamp when job was last updated

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
