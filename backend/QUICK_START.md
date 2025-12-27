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
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt-get install ffmpeg`

### 4. Run the Application

**You need TWO terminals open:**

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

#### Terminal 2: Worker

```bash
cd backend
python -m app.workers.audio_job_worker
```

You should see:
```
INFO:     AudioJobWorker initialized
INFO:     Worker started. Polling every 5 seconds...
```

### 5. Test It

**Option A: Use Swagger UI**
1. Open http://localhost:8000/docs
2. Click `POST /api/jobs`
3. Click "Try it out"
4. Upload an audio file
5. Check the response for `job_id`
6. Use `GET /api/jobs/{job_id}` to check status

**Option B: Use Test Script**
```bash
python test_api.py path/to/your/audio.mp3
```

**Option C: Use curl**
```bash
# Create job
curl -X POST "http://localhost:8000/api/jobs" \
  -F "file=@your_audio.mp3"

# Check status (replace {job_id} with actual ID)
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
- Make sure API server is running first
- Check database connection
- Look for errors in worker terminal
- Verify input file exists in `backend/tmp/jobs/{job_id}/input/`

**Separation fails?**
- Verify FFmpeg: `ffmpeg -version`
- Check audio file format is supported (mp3, wav, flac, etc.)
- Ensure sufficient disk space
- Check logs for detailed error messages

## What's Running?

- **API Server**: http://localhost:8000 (handles HTTP requests)
- **Worker**: Background process (processes jobs every 5 seconds)
- **Database**: Local PostgreSQL (stores job status) - or SQLite
- **Storage**: `backend/tmp/` directory (stores audio files)

## Next Steps

- Read [TESTING.md](./TESTING.md) for detailed testing instructions
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
- See folder READMEs for component details
