# Local Testing Guide

This guide will help you test the Music Assistant backend locally.

## Prerequisites Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Setup Database

#### Option A: Using PostgreSQL (Recommended)

1. Install PostgreSQL if not already installed
2. Create database:
```bash
createdb music
```

3. Update database URL in `app/db/session.py`:
```python
DATABASE_URL = "postgresql://your_username:your_password@localhost:5432/music"
```

4. Create tables (if using Alembic):
```bash
alembic upgrade head
```

Or manually create the table:
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Option B: Using SQLite (Quick Testing)

Modify `app/db/session.py`:
```python
DATABASE_URL = "sqlite:///./test.db"
```

SQLite doesn't support UUID natively, so you'll need to adjust the Job model temporarily or use a different approach.

### 3. Verify FFmpeg

```bash
ffmpeg -version
```

If not installed, install it:
- **Windows**: Download from https://ffmpeg.org/download.html
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt-get install ffmpeg`

## Running the Application

### Terminal 1: Start API Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Terminal 2: Start Worker

```bash
cd backend
python -m app.workers.audio_job_worker
```

You should see:
```
INFO:     AudioJobWorker initialized
INFO:     Worker started. Polling every 5 seconds...
```

## Testing the API

### 1. Health Check

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{"status":"ok"}
```

### 2. Create a Job (Upload Audio File)

```bash
curl -X POST "http://localhost:8000/api/jobs" \
  -F "file=@/path/to/your/audio.mp3"
```

**Windows PowerShell:**
```powershell
$filePath = "C:\path\to\your\audio.mp3"
Invoke-RestMethod -Uri "http://localhost:8000/api/jobs" `
  -Method Post `
  -InFile $filePath `
  -ContentType "multipart/form-data"
```

**Linux/WSL (Ubuntu):**
```bash
curl -X POST "http://localhost:8000/api/jobs" \
  -F "file=@/path/to/your/audio.mp3"
```

**Using Python requests:**
```python
import requests

url = "http://localhost:8000/api/jobs"
with open("path/to/your/audio.mp3", "rb") as f:
    files = {"file": f}
    response = requests.post(url, files=files)
    print(response.json())
```

Expected response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "error_message": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": null
}
```

**Save the `id` from the response!**

### 3. Check Job Status

```bash
curl http://localhost:8000/api/jobs/{job_id}
```

Replace `{job_id}` with the ID from step 2.

Expected responses:

**While processing:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "error_message": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:01Z"
}
```

**After completion:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "error_message": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:05Z"
}
```

### 4. Verify Output Files

Check that stems were created:

```bash
# Linux/macOS/WSL
ls -la backend/tmp/jobs/{job_id}/stems/

# Windows (PowerShell)
dir backend\tmp\jobs\{job_id}\stems\
```

You should see files like:
- `{track}.vocals.mp3`
- `{track}.drums.mp3`
- `{track}.bass.mp3`
- `{track}.other.mp3`

## Testing with Python Script

Create a test script `test_api.py`:

```python
import requests
import time
import sys

API_BASE = "http://localhost:8000/api"

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{API_BASE}/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    print("✓ Health check passed")

def test_create_job(audio_file_path):
    """Test job creation"""
    print(f"\nCreating job with file: {audio_file_path}")
    with open(audio_file_path, "rb") as f:
        files = {"file": f}
        response = requests.post(f"{API_BASE}/jobs", files=files)
    
    assert response.status_code == 201
    job = response.json()
    job_id = job["id"]
    print(f"✓ Job created: {job_id}")
    print(f"  Status: {job['status']}")
    return job_id

def test_get_job(job_id):
    """Test getting job status"""
    print(f"\nChecking job status: {job_id}")
    response = requests.get(f"{API_BASE}/jobs/{job_id}")
    assert response.status_code == 200
    job = response.json()
    print(f"  Status: {job['status']}")
    return job["status"]

def wait_for_completion(job_id, max_wait=300):
    """Wait for job to complete"""
    print(f"\nWaiting for job to complete (max {max_wait}s)...")
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        status = test_get_job(job_id)
        if status == "completed":
            print("✓ Job completed successfully!")
            return True
        elif status == "failed":
            print("✗ Job failed!")
            # Get error message
            response = requests.get(f"{API_BASE}/jobs/{job_id}")
            error = response.json().get("error_message")
            print(f"  Error: {error}")
            return False
        time.sleep(2)
    
    print("✗ Job timed out")
    return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_api.py <audio_file_path>")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    
    try:
        test_health()
        job_id = test_create_job(audio_file)
        success = wait_for_completion(job_id)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"✗ Test failed: {e}")
        sys.exit(1)
```

Run it:
```bash
python test_api.py path/to/your/audio.mp3
```

## Testing the Worker Directly

You can also test the worker with a pre-existing job:

1. Create a job via API (or manually insert into database)
2. Place an audio file in `backend/tmp/jobs/{job_id}/input/`
3. The worker should pick it up automatically

## Common Issues and Solutions

### Issue: "No module named 'app'"

**Solution**: Make sure you're running from the `backend` directory:
```bash
cd backend
python -m app.workers.audio_job_worker
```

### Issue: Database connection error

**Solution**: 
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `app/db/session.py`
- Check database exists: `psql -l | grep music`

### Issue: FFmpeg not found

**Solution**:
- Add FFmpeg to PATH
- Or specify full path in environment variable

### Issue: Worker not processing jobs

**Solution**:
- Check worker logs for errors
- Verify database connection
- Ensure input file exists in job directory
- Check file permissions

### Issue: Separation fails

**Solution**:
- Verify audio file format is supported
- Check disk space
- Look at worker logs for detailed error
- Try a different audio file

## Using FastAPI Interactive Docs

FastAPI provides automatic interactive documentation:

1. Start the server
2. Open browser to: `http://localhost:8000/docs`
3. You can test endpoints directly from the browser!

## Monitoring

### Check Logs

Both the API server and worker output logs. Watch for:
- `INFO`: Normal operations
- `WARNING`: Potential issues
- `ERROR`: Errors that need attention

### Database Queries

Check job status directly:
```sql
SELECT id, status, error_message, created_at, updated_at 
FROM jobs 
ORDER BY created_at DESC 
LIMIT 10;
```

## Performance Testing

For load testing, you can use tools like:
- **Apache Bench**: `ab -n 100 -c 10 http://localhost:8000/api/health`
- **Locust**: Python-based load testing
- **wrk**: High-performance HTTP benchmarking

## Next Steps

Once basic testing works:
1. Test with different audio formats
2. Test error scenarios (invalid files, etc.)
3. Test concurrent job processing
4. Monitor resource usage (CPU, memory, disk)
