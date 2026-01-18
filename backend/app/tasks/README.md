# Celery Tasks

## Purpose

Celery tasks for asynchronous job processing. Jobs are enqueued via Redis and processed by Celery workers.

## Architecture

FastAPI Endpoint → Creates Job → Enqueues Task → Redis Queue → Celery Worker → Updates Job Status

## Tasks

### `process_audio_job`

Processes an audio job asynchronously:
1. Validates job_id format (UUID)
2. Updates job status to "processing"
3. Finds input audio file
4. Runs processing pipeline
5. Updates job status to "completed" or "failed"

**Error Handling**: Automatic retries for transient errors (connection, timeout, I/O)

## Configuration

Celery configured in `app/celery_app.py`:
- **Broker/Backend**: Redis
- **Task Time Limit**: 1 hour
- **Late Acknowledgment**: Prevents task loss
- **Auto-retry**: Enabled for transient errors (3 attempts, exponential backoff)

## Environment Variables

- `REDIS_HOST` (default: `localhost`)
- `REDIS_PORT` (default: `6379`)
- `REDIS_DB` (default: `0`)
- `REDIS_PASSWORD` (optional)

## Running Workers

```bash
celery -A app.celery_app worker --loglevel=info
```

## Reliability Features

- **Task Loss Prevention**: Late acknowledgment, auto re-queue on worker loss
- **Error Recovery**: Automatic retries with exponential backoff
- **Resource Management**: Workers restart after 50 tasks, results expire after 1 hour

