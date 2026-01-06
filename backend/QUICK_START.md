# Quick Start Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Database

**PostgreSQL (Recommended):**

1. Make sure PostgreSQL is installed and running
2. Create the database:
   ```bash
   createdb music
   ```
3. Update `app/db/session.py` with your PostgreSQL credentials:
   ```python
   DATABASE_URL = "postgresql://your_username:your_password@localhost:5432/music"
   ```

**Or use SQLite (Quick Testing):**

In `app/db/session.py`, change:
```python
DATABASE_URL = "sqlite:///./test.db"
```

### 3. Verify FFmpeg

```bash
ffmpeg -version
```

If not installed:
- **Windows**: Download from https://ffmpeg.org/download.html and add to PATH
- **WSL/Ubuntu**: `sudo apt-get install ffmpeg`
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt-get install ffmpeg`

### 4. Start Redis

**Linux/WSL:**
```bash
sudo service redis-server start
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

### 5. Run the Application

**You need THREE terminals open:**

#### Terminal 1: API Server

```bash
cd backend
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

#### Terminal 2: Celery Worker

```bash
cd backend
./start_celery_worker.sh
# or manually:
celery -A app.celery_app worker --loglevel=info
```

You should see:
```
[INFO] celery@hostname ready.
```

#### Terminal 3: (Optional) Monitor with Flower

```bash
pip install flower
celery -A app.celery_app flower
```

Visit `http://localhost:5555` to monitor workers and tasks.

### 6. Test It

**Option A: Use Swagger UI**
1. Open http://localhost:8000/docs
2. First, upload audio: Click `POST /api/audio`, upload a file, get `audio_id`
3. Then create job: Click `POST /api/jobs`, use the `audio_id` from step 2
4. Check the response for `job_id`
5. Use `GET /api/jobs/{job_id}` to check status

**Option B: Use Test Script**
```bash
python test_api.py path/to/your/audio.mp3
```

**Option C: Use curl**
```bash
# 1. Upload audio
curl -X POST "http://localhost:8000/api/audio" \
  -F "file=@your_audio.mp3"
# Save the audio_id from response

# 2. Create job (replace audio_id with actual ID)
curl -X POST "http://localhost:8000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "stem_separation",
    "input": {"audio_id": "YOUR_AUDIO_ID"},
    "params": {}
  }'

# 3. Check status (replace {job_id} with actual ID)
curl "http://localhost:8000/api/jobs/{job_id}"
```

## Verify It's Working

1. **Health Check:**
   ```bash
   curl http://localhost:8000/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Check Output Files:**
   After a job completes, check:
   ```
   backend/tmp/jobs/{job_id}/stems/
   ```
   You should see separated stem files (vocals, drums, bass, other)

## Troubleshooting

**API won't start?**
- Check if port 8000 is already in use
- Verify database connection in `app/db/session.py`
- Check database is running: `psql -U your_username -d music`
- Make sure PostgreSQL service is running

**Worker not processing?**
- Make sure Redis is running: `redis-cli ping`
- Check Celery worker is running and connected to Redis
- Look for errors in worker terminal
- Verify audio file exists in `backend/tmp/audio/{audio_id}/`
- Check if task is enqueued: `redis-cli LLEN celery`

**Separation fails?**
- Verify FFmpeg: `ffmpeg -version`
- Check audio file format is supported (mp3, wav, flac, etc.)
- Ensure sufficient disk space
- Check logs for detailed error messages

## What's Running?

- **API Server**: http://localhost:8000 (handles HTTP requests)
- **Redis**: Message broker (queues tasks for processing)
- **Celery Worker**: Background process (processes jobs from Redis queue)
- **Database**: Local PostgreSQL (stores job status and audio metadata) - or SQLite
- **Storage**: `backend/tmp/` directory (stores uploaded audio and job outputs)
  - `tmp/audio/` - Uploaded audio files
  - `tmp/jobs/` - Job output files (stems, MIDI)

## Next Steps

- Read [TESTING.md](./TESTING.md) for detailed testing instructions
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
- See folder READMEs for component details
