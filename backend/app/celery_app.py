"""
Celery application configuration.

This module configures the Celery application for asynchronous job processing.
Celery uses Redis as the message broker and result backend.
"""
from celery import Celery
import os
import logging

# Configure logging for Celery tasks
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Redis configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_DB = os.getenv("REDIS_DB", "0")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Build Redis URL
if REDIS_PASSWORD:
    REDIS_URL = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
else:
    REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# Create Celery app
celery_app = Celery(
    "music_assistant",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.job_tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3300,  # 55 minutes soft limit
    worker_prefetch_multiplier=1,  # Process one task at a time per worker
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks to prevent memory leaks
    # Task acknowledgment: acknowledge tasks only after completion to prevent task loss
    task_acks_late=True,
    task_reject_on_worker_lost=True,  # Re-queue tasks if worker dies
    # Task result expiration: results expire after 1 hour to prevent Redis memory issues
    result_expires=3600,
    # Task retry configuration for transient errors
    task_autoretry_for=(ConnectionError, TimeoutError, IOError),
    task_retry_backoff=True,
    task_retry_backoff_max=600,  # Max 10 minutes between retries
    task_retry_jitter=True,  # Add randomness to retry delays
)

