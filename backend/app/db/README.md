# Database Layer

## Purpose

Manages database connections, sessions, and base configuration for SQLAlchemy.

## Key Components

- **`base.py`**: SQLAlchemy `Base` class for all models
- **`session.py`**: Database session management and connection configuration

## Architecture

FastAPI Request → `get_db()` dependency → `SessionLocal()` factory → SQLAlchemy Session → Service Layer → Auto-close on request end

## Important Notes

1. **Session Lifecycle**: Sessions created per request, closed automatically
2. **Connection Pooling**: SQLAlchemy manages pooling automatically
3. **Database URL**: Read from `DATABASE_URL` environment variable
4. **UUID Support**: Custom `GUID` TypeDecorator for PostgreSQL/SQLite compatibility

## Current Configuration

- **Database**: PostgreSQL (configurable via `DATABASE_URL`)
- **Session Factory**: `SessionLocal` created per request
- **Table Creation**: Auto-created on startup (development only)

## Future Improvements

- [ ] Alembic migrations (replace auto-create)
- [ ] Connection pooling configuration
- [ ] Database health checks
- [ ] Read replica support
