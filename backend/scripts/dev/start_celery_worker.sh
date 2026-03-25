#!/bin/bash
# Start Celery worker for music assistant

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Warning: Redis does not appear to be running."
    echo "Please start Redis before running Celery workers."
    echo ""
    echo "To start Redis:"
    echo "  - Linux/WSL: sudo service redis-server start"
    echo "  - macOS: brew services start redis"
    echo "  - Docker: docker run -d -p 6379:6379 redis"
    exit 1
fi

# Start Celery worker
echo "Starting Celery worker..."
echo "Press Ctrl+C to stop"
echo ""

# Configure Python logging for Celery tasks
export PYTHONUNBUFFERED=1

celery -A app.celery_app worker --loglevel=info

