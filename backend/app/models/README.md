# Database Models

## Purpose

SQLAlchemy ORM models representing database tables and their relationships.

## Key Components

- **`job.py`**: `Job` model for audio processing jobs
- **`audio.py`**: `Audio` model for uploaded audio files
- **`session.py`**: `Session` model for agent conversations
- **`agent_step.py`**: `AgentStep` model for conversation step logging

## Current Models

### Job Model

Audio processing job with lifecycle: `queued` → `running` → `succeeded`/`failed`

**Key Fields**: `id` (UUID), `type`, `status`, `input` (JSON), `output` (JSON), `progress`, `error_message`

### Audio Model

Uploaded audio file metadata.

**Key Fields**: `id` (UUID), `filename`, `file_path`, `created_at`

### Session Model

Agent conversation session.

**Key Fields**: `id` (UUID), `created_at`, `last_activity_at`

### AgentStep Model

Individual step in agent conversation (user_message, tool_call, tool_result, agent_response, error).

**Key Fields**: `id` (UUID), `session_id`, `step_number`, `step_type`, `content` (JSON)

## Important Notes

1. **UUID Support**: Custom `GUID` TypeDecorator for PostgreSQL/SQLite compatibility
2. **Timestamps**: Auto-managed by database
3. **Model Discovery**: All models imported in `__init__.py` for Alembic
4. **Base Class**: All models inherit from `app.db.base.Base`

## Future Improvements

- [ ] Add relationships between models
- [ ] Add indexes for common queries
- [ ] Add model validation
- [ ] Add soft delete support
