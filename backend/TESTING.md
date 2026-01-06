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

4. Create tables:

**Option A: Use setup script (Recommended)**
```bash
psql -U postgres -d music -f setup_db.sql
```

**Option B: Use migration script (if tables already exist)**
```bash
psql -U postgres -d music -f migrate_db.sql
```

**Option C: Manual creation**
```sql
-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'queued',
    input JSONB NOT NULL,
    params JSONB,
    output JSONB,
    progress REAL DEFAULT 0.0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio table
CREATE TABLE IF NOT EXISTS audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Option B: Using SQLite (Quick Testing)

Modify `app/db/session.py`:
```python
DATABASE_URL = "sqlite:///./test.db"
```

**Note:** SQLite is supported via the custom `GUID` TypeDecorator which stores UUIDs as TEXT. The application will automatically handle the conversion.

**For existing SQLite databases:** If you have an old database, you may need to migrate it. See `migrate_db.sql` for instructions, or simply delete the database file and let the application recreate it on startup.

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

### Terminal 2: Start Redis

```bash
# Linux/WSL
sudo service redis-server start

# macOS
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return: PONG
```

### Terminal 3: Start Celery Worker

```bash
cd backend
./start_celery_worker.sh
# or manually:
celery -A app.celery_app worker --loglevel=info
```

You should see:
```
[INFO] celery@hostname ready.
[INFO] Connected to redis://localhost:6379/0
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

### 2. Upload Audio File

```bash
curl -X POST "http://localhost:8000/api/audio" \
  -F "file=@/path/to/your/audio.mp3"
```

Expected response:
```json
{
  "audio_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "audio.mp3"
}
```

**Save the `audio_id` from the response!**

### 3. Create a Job

Use the `audio_id` from step 2 to create a job:

```bash
curl -X POST "http://localhost:8000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "stem_separation",
    "input": {
      "audio_id": "550e8400-e29b-41d4-a716-446655440000"
    },
    "params": {}
  }'
```

**Or for MIDI conversion:**
```bash
curl -X POST "http://localhost:8000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "midi_conversion",
    "input": {
      "audio_id": "550e8400-e29b-41d4-a716-446655440000"
    },
    "params": {
      "save_notes": true,
      "midi_tempo": 120
    }
  }'
```

**Using Python requests:**
```python
import requests

# Create stem separation job
url = "http://localhost:8000/api/jobs"
job_data = {
    "type": "stem_separation",
    "input": {"audio_id": "550e8400-e29b-41d4-a716-446655440000"},
    "params": {}
}
response = requests.post(url, json=job_data)
print(response.json())
```

Expected response:
```json
{
  "job_id": "abc-123-def",
  "type": "stem_separation",
  "status": "queued",
  "audio_id": "550e8400-e29b-41d4-a716-446655440000",
  "input": {
    "audio_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "params": {},
  "output": null,
  "progress": 0.0,
  "error_message": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

**Save the `job_id` from the response!**

### 4. Check Job Status

```bash
curl http://localhost:8000/api/jobs/{job_id}
```

Replace `{job_id}` with the ID from step 2.

Expected responses:

**While processing:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "stem_separation",
  "status": "running",
  "input": {
    "audio_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "params": {},
  "progress": 0.5,
  "error_message": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:01Z"
}
```

**After completion (Stem Separation):**
```json
{
  "job_id": "abc-123-def",
  "type": "stem_separation",
  "status": "succeeded",
  "audio_id": "550e8400-e29b-41d4-a716-446655440000",
  "input": {
    "audio_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "params": {},
  "output": {
    "vocals": "jobs/abc-123-def/stems/track.vocals.mp3",
    "drums": "jobs/abc-123-def/stems/track.drums.mp3",
    "bass": "jobs/abc-123-def/stems/track.bass.mp3",
    "other": "jobs/abc-123-def/stems/track.other.mp3"
  },
  "progress": 1.0,
  "error_message": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:05Z"
}
```

**After completion (MIDI Conversion):**
```json
{
  "job_id": "xyz-456-789",
  "type": "midi_conversion",
  "status": "succeeded",
  "audio_id": "550e8400-e29b-41d4-a716-446655440000",
  "input": {
    "audio_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "params": {
    "save_notes": true,
    "midi_tempo": 120
  },
  "output": {
    "midi": "jobs/xyz-456-789/midi/track.mid",
    "notes": "jobs/xyz-456-789/midi/track_notes.csv"
  },
  "progress": 1.0,
  "error_message": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:10Z"
}
```

### 5. Verify Output Files

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

def test_upload_audio(audio_file_path):
    """Test audio upload"""
    print(f"\nUploading audio file: {audio_file_path}")
    with open(audio_file_path, "rb") as f:
        files = {"file": f}
        response = requests.post(f"{API_BASE}/audio", files=files)
    
    assert response.status_code == 201
    audio = response.json()
    audio_id = audio["audio_id"]
    print(f"✓ Audio uploaded: {audio_id}")
    print(f"  Filename: {audio['filename']}")
    return audio_id

def test_create_job(audio_id):
    """Test job creation"""
    print(f"\nCreating job for audio: {audio_id}")
    job_data = {
        "type": "stem_separation",
        "input": {"audio_id": audio_id},
        "params": {}
    }
    response = requests.post(f"{API_BASE}/jobs", json=job_data)
    
    assert response.status_code == 201
    job = response.json()
    job_id = job["job_id"]
    print(f"✓ Job created: {job_id}")
    print(f"  Type: {job['type']}")
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
        if status == "succeeded":
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
        audio_id = test_upload_audio(audio_file)
        job_id = test_create_job(audio_id)
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

## Testing with Celery

### Monitor Celery Tasks

Check Redis queue:
```bash
# View queued tasks
redis-cli LLEN celery

# View task keys
redis-cli KEYS "celery*"
```

### Monitor with Flower

Install and run Flower for a web-based monitoring interface:
```bash
pip install flower
celery -A app.celery_app flower
```

Then visit `http://localhost:5555` to see:
- Active tasks
- Worker status
- Task history
- Task details and results

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
- Check Redis is running: `redis-cli ping` (should return `PONG`)
- Verify Celery worker is running and connected to Redis
- Check worker logs for errors
- Verify database connection
- Ensure task is enqueued: `redis-cli LLEN celery`
- Check audio file exists in `tmp/audio/{audio_id}/`

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
SELECT id, type, status, progress, error_message, created_at, updated_at 
FROM jobs 
ORDER BY created_at DESC 
LIMIT 10;
```

Check audio files:
```sql
SELECT id, filename, file_path, created_at 
FROM audio 
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
