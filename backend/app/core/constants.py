"""
Application-wide constants.

This module contains constants used across the application to avoid
magic strings and ensure consistency.
"""

# Supported audio file extensions for input/output processing
AUDIO_EXTENSIONS = {
    '.mp3',
    '.wav',
    '.flac',
    '.m4a',
    '.ogg',
    '.wma',
    '.aac',
    '.aiff'
}

# Default output format for separated stems
DEFAULT_STEM_FORMAT = "mp3"

# Job status values
class JobStatus:
    """Job status constants"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# Storage paths
# Reads from environment variable, falls back to default for local development
import os
from pathlib import Path

# Get the backend directory (where this file is located)
BACKEND_DIR = Path(__file__).parent.parent.parent

# Storage root: defaults to backend/tmp, but can be overridden via environment variable
# If STORAGE_ROOT is set, use it (can be absolute or relative)
# Otherwise, use backend/tmp relative to the backend directory
_storage_root_env = os.getenv("STORAGE_ROOT")
if _storage_root_env:
    # If environment variable is set, use it (resolve if relative)
    STORAGE_ROOT = Path(_storage_root_env).resolve()
else:
    # Default: backend/tmp relative to backend directory
    STORAGE_ROOT = BACKEND_DIR / "tmp"

JOBS_DIR = "jobs"
INPUT_DIR = "input"
STEMS_DIR = "stems"
