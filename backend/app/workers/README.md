# Background Workers (Deprecated)

## ⚠️ Status: Deprecated

**This worker implementation has been replaced with Celery and Redis.**

The application now uses Celery tasks (`app/tasks/`) for asynchronous job processing. See [app/tasks/README.md](../tasks/README.md) for the current implementation.

**Migration:** The old `AudioJobWorker` is kept for reference only. Jobs are now processed via Celery workers.

## Legacy Implementation

- **`audio_job_worker.py`**: Polled database every 5 seconds for pending jobs
- **`fetch_input.py`**: Utility for fetching input files (reserved for future use)

**Note:** This polling approach has been replaced with Celery for better reliability and scalability.
