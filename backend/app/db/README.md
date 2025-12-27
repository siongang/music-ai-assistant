# Database Layer

## Purpose

Manages database connections, sessions, and base configuration for SQLAlchemy.

## Key Components

- **`base.py`**: SQLAlchemy `Base` class for all models
- **`session.py`**: Database session management and connection configuration

## Architecture

```
FastAPI Request
  ↓
get_db() dependency
  ↓
SessionLocal() factory
  ↓
SQLAlchemy Session
  ↓
Service Layer (uses session)
  ↓
Auto-close on request end
```

## Important Notes

1. **Session Lifecycle**: Sessions are created per request and closed automatically
2. **Connection Pooling**: SQLAlchemy manages connection pooling automatically
3. **Database URL**: Read from `DATABASE_URL` environment variable
4. **Auto-commit**: Disabled - explicit commits required
5. **Auto-flush**: Disabled - explicit flushes required
6. **UUID Support**: Uses custom `GUID` TypeDecorator for cross-database UUID support

## Current Configuration

- **Database**: PostgreSQL (configurable via `DATABASE_URL`)
- **Connection**: Managed via SQLAlchemy engine
- **Session Factory**: `SessionLocal` created per request
- **Table Creation**: Auto-created on startup (development only)

## Future Improvements

- [ ] Add Alembic migrations (replace auto-create)
- [ ] Add connection pooling configuration
- [ ] Add database health checks
- [ ] Add read replica support
- [ ] Add transaction management utilities
- [ ] Add database query logging/debugging
- [ ] Add connection retry logic
- [ ] Add database backup utilities
- [ ] Add migration rollback support

## Dependencies

- `sqlalchemy`: ORM and database toolkit
- `psycopg2-binary`: PostgreSQL adapter
