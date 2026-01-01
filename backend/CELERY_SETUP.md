# Celery & Redis Setup Guide

## Overview

The application now uses Celery with Redis for asynchronous job processing instead of polling workers. When a job is created via the API, it's automatically enqueued for processing by Celery workers.

## Prerequisites

1. **Redis** must be installed and running
2. **Celery** and **redis** packages (already in `requirements.txt`)

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start Redis

**Linux/WSL:**
```bash
sudo service redis-server start
# or
redis-server
```

**macOS:**
```bash
brew services start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### 3. Start Celery Worker

**Option A: Use the startup script**
```bash
./start_celery_worker.sh
```

**Option B: Manual start**
```bash
celery -A app.celery_app worker --loglevel=info
```

### 4. Start FastAPI Application

In a separate terminal:
```bash
uvicorn app.main:app --reload
```

## Configuration

### Redis Configuration

By default, Celery connects to Redis at `localhost:6379/0`. You can override this with environment variables:

```bash
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_DB=0
export REDIS_PASSWORD=your_password  # Optional, for production
```

### Celery Configuration

Celery is configured in `app/celery_app.py` with production-ready settings:

**Task Settings:**
- Task time limit: 1 hour (3600 seconds)
- Soft time limit: 55 minutes (3300 seconds)
- Task acknowledgment: Late acknowledgment (`task_acks_late=True`) - prevents task loss on worker crash
- Task rejection: Re-queue tasks if worker dies (`task_reject_on_worker_lost=True`)
- Result expiration: 1 hour (prevents Redis memory issues)

**Retry Configuration:**
- Automatic retries for transient errors (`ConnectionError`, `TimeoutError`, `IOError`)
- Exponential backoff with jitter (max 10 minutes between retries)
- Maximum 3 retries per task

**Worker Settings:**
- Worker prefetch: 1 task at a time per worker
- Worker max tasks per child: 50 (prevents memory leaks)
- Serialization: JSON

## Running Multiple Workers

To scale processing, run multiple workers:

```bash
# Terminal 1
celery -A app.celery_app worker --loglevel=info --concurrency=2

# Terminal 2
celery -A app.celery_app worker --loglevel=info --concurrency=2
```

Or use the `--concurrency` flag to run multiple processes in one worker:

```bash
celery -A app.celery_app worker --loglevel=info --concurrency=4
```

## Monitoring (Optional)

### Flower - Web-based Monitoring

Install Flower:
```bash
pip install flower
```

Start Flower:
```bash
celery -A app.celery_app flower
```

Visit `http://localhost:5555` to view:
- Active workers
- Task history
- Task statistics
- Real-time task monitoring

## Architecture

```
┌─────────────┐
│   FastAPI   │
│  (API App)  │
└──────┬──────┘
       │
       │ Creates Job & Enqueues Task
       ↓
┌─────────────┐
│    Redis    │
│  (Message   │
│   Broker)   │
└──────┬──────┘
       │
       │ Task Queue
       ↓
┌─────────────┐
│   Celery    │
│   Worker    │
│ (Processes  │
│   Jobs)     │
└──────┬──────┘
       │
       │ Updates Job Status
       ↓
┌─────────────┐
│  Database   │
│ (PostgreSQL │
│  / SQLite)  │
└─────────────┘
```

## Troubleshooting

### Worker Not Processing Tasks

1. **Check Redis connection:**
   ```bash
   redis-cli ping
   ```

2. **Check worker logs** for connection errors

3. **Verify task is enqueued:**
   ```bash
   redis-cli
   > KEYS *
   > LLEN celery  # Check queue length
   ```

### Task Failing

1. Check worker logs for error messages
2. Verify job status in database: `GET /api/jobs/{job_id}`
3. Check error_message field in job record

### Database Connection Issues

Each Celery task creates its own database session. If you see connection errors:
- Check database is running
- Verify `DATABASE_URL` environment variable
- Check connection pool settings

## Migration Notes

The old `AudioJobWorker` that polled the database has been replaced. The old worker code is still available in `app/workers/audio_job_worker.py` for reference but is no longer needed.

**Benefits:**
- ✅ No polling overhead
- ✅ Better scalability
- ✅ Task retries and error handling
- ✅ Distributed processing support
- ✅ Task monitoring capabilities

## Features & Reliability

### Task Reliability
- ✅ **Late acknowledgment**: Tasks are only acknowledged after completion, preventing loss on worker crash
- ✅ **Automatic retries**: Transient errors (connection issues, timeouts) are automatically retried
- ✅ **Error handling**: Comprehensive error handling with proper logging
- ✅ **Input validation**: Job IDs are validated before processing

### Error Handling
- Tasks automatically retry on transient errors (database connection, file I/O, network issues)
- Failed tasks update job status with error messages
- Worker crashes don't lose tasks (they're re-queued)
- Invalid job IDs are caught and handled gracefully

### Monitoring
- Task status tracking in database
- Comprehensive logging at all levels
- Flower integration for real-time monitoring
- Redis queue inspection for debugging

## Production Considerations

1. **Use a process manager** (systemd, supervisord, etc.) to keep workers running
2. **Set up monitoring** (Flower, Prometheus, etc.)
3. **Configure Redis password** via `REDIS_PASSWORD` environment variable
4. **Use Redis persistence** for production
5. **Set up Redis authentication** if exposed
6. **Monitor worker memory usage** (workers restart after 50 tasks by default)
7. **Configure connection pooling** for database connections under high load
8. **Set up alerting** for failed tasks and worker health

