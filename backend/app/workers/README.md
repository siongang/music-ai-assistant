# Background Workers

## Purpose

Background processes that handle asynchronous job processing. Workers poll the database for pending jobs and process them.

## Key Components

- **`audio_job_worker.py`**: Main worker that processes audio jobs
- **`fetch_input.py`**: Utility for fetching input files (reserved for future use)

## Architecture

```
Worker Process (runs continuously)
  ↓
Poll Database (every 5 seconds)
  ↓
Find Pending Jobs
  ↓
Process Job (audio separation)
  ↓
Update Job Status
  ↓
Repeat
```

## Current Implementation

### AudioJobWorker

- Polls database every 5 seconds for pending jobs
- Processes jobs by:
  1. Updating status to "processing"
  2. Finding input audio file
  3. Running separation pipeline
  4. Saving separated stems
  5. Updating status to "completed" or "failed"
- Handles errors gracefully with logging

## Important Notes

1. **Polling Interval**: Currently 5 seconds (configurable)
2. **Single Worker**: One worker processes one job at a time
3. **Error Handling**: Errors are caught and logged, job status updated to "failed"
4. **Database Sessions**: Worker creates its own database session
5. **Storage**: Worker uses LocalStorage for file operations
6. **Graceful Shutdown**: Handles KeyboardInterrupt for clean shutdown

## Running the Worker

```bash
python -m app.workers.audio_job_worker
```

Make sure the database is running and accessible before starting the worker.

## Future Improvements

- [ ] Add job queue system (Redis, RabbitMQ, etc.)
- [ ] Add worker scaling (multiple workers)
- [ ] Add worker health checks
- [ ] Add worker monitoring/metrics
- [ ] Add job priority system
- [ ] Add job retry logic
- [ ] Add job timeout handling
- [ ] Add worker load balancing
- [ ] Add worker graceful shutdown
- [ ] Add worker restart on failure
- [ ] Add GPU worker support
- [ ] Add distributed worker coordination

## Dependencies

- Database session (SQLAlchemy)
- Storage implementation
- Pipeline runner service
- Job service
