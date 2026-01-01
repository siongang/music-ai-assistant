# Celery Tasks

## Overview

This package contains Celery tasks for asynchronous job processing. Jobs are enqueued via Redis and processed by Celery workers.

## Architecture

```
FastAPI Endpoint (POST /jobs)
  ↓
Creates Job in Database (status: "pending")
  ↓
Saves Audio File to Storage
  ↓
Enqueues Celery Task (process_audio_job.delay())
  ↓
Redis Queue
  ↓
Celery Worker (processes task)
  ↓
Updates Job Status (processing → completed/failed)
```

## Tasks

### `process_audio_job`

Processes an audio job asynchronously:
1. Validates job_id format (UUID)
2. Updates job status to "processing"
3. Finds the input audio file
4. Runs the separation pipeline
5. Updates job status to "completed" or "failed"

**Parameters:**
- `job_id` (str): UUID string of the job to process

**Returns:**
- `dict`: Result with status and optional error message
  - `{"status": "completed"}` on success
  - `{"status": "failed", "error": "error message"}` on failure

**Error Handling:**
- Invalid job_id format: Returns error immediately (no retry)
- File not found: Updates job status to failed
- Processing errors: Updates job status with error message
- Database errors: Creates new session for error reporting
- Automatic retries: Transient errors (connection, timeout, I/O) are retried automatically

## Configuration

Celery is configured in `app/celery_app.py` with production-ready settings:

**Broker & Backend:**
- **Broker**: Redis (default: `redis://localhost:6379/0`)
- **Backend**: Redis (for result storage)
- **Result Expiration**: 1 hour (prevents Redis memory issues)

**Task Settings:**
- **Task Time Limit**: 1 hour (3600 seconds)
- **Soft Time Limit**: 55 minutes (3300 seconds)
- **Task Acknowledgment**: Late acknowledgment (`task_acks_late=True`) - prevents task loss
- **Task Rejection**: Re-queue on worker loss (`task_reject_on_worker_lost=True`)
- **Worker Prefetch**: 1 (process one task at a time per worker)
- **Worker Max Tasks**: 50 (restart worker after 50 tasks to prevent memory leaks)

**Retry Configuration:**
- **Auto-retry**: Enabled for `ConnectionError`, `TimeoutError`, `IOError`
- **Retry Backoff**: Exponential backoff with jitter
- **Max Retries**: 3 attempts
- **Max Backoff**: 10 minutes between retries

## Environment Variables

- `REDIS_HOST`: Redis host (default: `localhost`)
- `REDIS_PORT`: Redis port (default: `6379`)
- `REDIS_DB`: Redis database number (default: `0`)
- `REDIS_PASSWORD`: Redis password (optional, for production)

## Running Workers

### Start Celery Worker

```bash
# From the backend directory
celery -A app.celery_app worker --loglevel=info
```

### Start with Multiple Workers

```bash
# Start with 4 worker processes
celery -A app.celery_app worker --loglevel=info --concurrency=4
```

### Start with Logging to File

```bash
celery -A app.celery_app worker --loglevel=info --logfile=celery.log
```

### Start in Background (Development)

```bash
celery -A app.celery_app worker --loglevel=info --detach
```

## Monitoring

### Flower (Optional)

Flower is a web-based tool for monitoring Celery workers:

```bash
pip install flower
celery -A app.celery_app flower
```

Then visit `http://localhost:5555` to view worker status, active tasks, and task history.

## Troubleshooting

### Redis Connection Issues

If workers can't connect to Redis:
1. Ensure Redis is running: `redis-cli ping` (should return `PONG`)
2. Check Redis host/port in environment variables
3. Verify Redis is accessible from the worker process

### Task Not Processing

1. Check worker logs for errors
2. Verify task is enqueued: Check Redis with `redis-cli`
3. Ensure worker is running and connected to Redis
4. Check task name matches: `process_audio_job`

### Database Connection Issues

Each task creates its own database session. If you see connection errors:
1. Check database connection settings
2. Ensure database connection pool is large enough
3. Verify database is accessible from worker process

## Reliability Features

**Task Loss Prevention:**
- Late acknowledgment ensures tasks are only marked complete after successful processing
- Worker crashes don't lose tasks (they're automatically re-queued)
- Invalid job IDs are caught before processing

**Error Recovery:**
- Automatic retries for transient errors (database connections, network issues, file I/O)
- Exponential backoff prevents overwhelming the system
- Comprehensive error logging for debugging

**Resource Management:**
- Each task creates its own database session (proper cleanup)
- Workers restart after 50 tasks to prevent memory leaks
- Task results expire after 1 hour to prevent Redis memory issues

## Migration from Polling Worker

The old `AudioJobWorker` that polled the database has been replaced with Celery tasks. The old worker code is still available in `app/workers/audio_job_worker.py` for reference but is no longer needed.

**Benefits of Celery:**
- ✅ No polling overhead
- ✅ Better scalability (multiple workers)
- ✅ Automatic task retries for transient errors
- ✅ Task loss prevention (late acknowledgment)
- ✅ Task monitoring and visibility
- ✅ Distributed processing support
- ✅ Production-ready error handling

