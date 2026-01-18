# Music Assistant - Current State Documentation

**Date**: January 6, 2026  
**Purpose**: Document what's currently working and what needs to be done

---

## What You Have Right Now ✅

### Backend API (FastAPI)
**Status**: ✅ Working

**What it does:**
- Accepts audio file uploads
- Creates processing jobs
- Returns job status
- Provides file downloads

**How to run:**
```bash
cd backend
uvicorn app.main:app --reload
```

**Available at**: http://localhost:8000

### Celery Workers
**Status**: ✅ Working

**What it does:**
- Processes jobs in the background
- Runs stem separation (Demucs)
- Runs MIDI conversion (Basic Pitch)
- Updates job status in database

**How to run:**
```bash
cd backend
celery -A app.celery_app worker --loglevel=info
```

### Redis
**Status**: ✅ Required, Running Locally

**What it does:**
- Message queue between API and workers
- Stores task results temporarily

**How to run:**
```bash
# Linux/WSL
sudo service redis-server start

# Check if running
redis-cli ping
# Should return: PONG
```

### Database
**Status**: ⚠️ Currently using SQLite (file-based)

**Current setup:**
- Database file: `backend/test.db`
- Easy for development
- **Not ideal for production/home server**

**What it stores:**
- Audio metadata (filename, upload date, file path)
- Job records (type, status, progress, results)

### File Storage
**Status**: ✅ Working (Local filesystem)

**Where files are stored:**
```
backend/tmp/
├── audio/              # Uploaded audio files
│   └── {audio_id}/
│       └── {filename}
└── jobs/               # Processing results
    └── {job_id}/
        ├── stems/      # Separated audio stems
        │   ├── track.vocals.mp3
        │   ├── track.drums.mp3
        │   ├── track.bass.mp3
        │   └── track.other.mp3
        └── midi/       # MIDI conversion outputs
            ├── track.mid
            └── track_notes.csv
```

---

## What's Currently Running (Development Mode)

You need **3 separate terminals** to run everything:

### Terminal 1: Redis
```bash
sudo service redis-server start
redis-cli ping  # Verify it's running
```

### Terminal 2: FastAPI
```bash
cd backend
source venv/bin/activate  # If using virtual environment
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 3: Celery Worker
```bash
cd backend
source venv/bin/activate
celery -A app.celery_app worker --loglevel=info
```

---

## Current Workflow

### 1. Upload Audio
```bash
curl -X POST http://localhost:8000/api/audio \
  -F "file=@mysong.mp3"

# Returns:
{
  "audio_id": "abc-123-def-456",
  "filename": "mysong.mp3"
}
```

### 2. Create Job
```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "stem_separation",
    "input": {"audio_id": "abc-123-def-456"},
    "params": {}
  }'

# Returns:
{
  "job_id": "xyz-789",
  "status": "queued",
  ...
}
```

### 3. Check Status
```bash
curl http://localhost:8000/api/jobs/xyz-789

# Returns:
{
  "job_id": "xyz-789",
  "status": "succeeded",
  "output": {
    "vocals": "jobs/xyz-789/stems/track.vocals.mp3",
    ...
  }
}
```

### 4. Download Results
```bash
curl http://localhost:8000/api/audio/files/jobs/xyz-789/stems/track.vocals.mp3 \
  -o vocals.mp3
```

---

## Database Schema

### Audio Table
```sql
CREATE TABLE audio (
    id UUID PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**What it stores:**
- `id`: Unique identifier for the audio file
- `filename`: Original filename (e.g., "mysong.mp3")
- `file_path`: Relative path in storage (e.g., "audio/abc-123/mysong.mp3")
- `created_at`: When it was uploaded

### Job Table
```sql
CREATE TABLE job (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    input JSONB NOT NULL,
    params JSONB,
    output JSONB,
    progress FLOAT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**What it stores:**
- `id`: Unique job identifier
- `type`: Job type (stem_separation, midi_conversion, etc.)
- `status`: Current status (queued, running, succeeded, failed)
- `input`: Job input data (contains audio_id)
- `params`: Job parameters (model settings, etc.)
- `output`: Job results (file paths to stems, MIDI, etc.)
- `progress`: Processing progress (0.0 to 1.0)
- `error_message`: Error details if job failed
- `created_at`: When job was created
- `updated_at`: Last time job was updated

---

## Current Limitations

### 🔴 Development Mode Issues

1. **Multiple terminals required**
   - Need to start Redis, API, and Worker separately
   - If one crashes, need to restart manually
   - Hard to manage on a home server

2. **SQLite Database**
   - Not suitable for production
   - File locking issues with multiple processes
   - No proper concurrent access

3. **No automatic restart**
   - If server reboots, nothing starts automatically
   - Need to manually start all 3 services

4. **Port management**
   - Need to remember which ports are used
   - Port conflicts if running other services

5. **No isolation**
   - All services share system resources
   - Python dependencies conflict with other projects
   - Hard to clean up

---

## Why Docker Would Help

### Problem: Multiple Terminals
**Docker Solution**: All services start with one command
```bash
docker-compose up
```

### Problem: SQLite Not Suitable
**Docker Solution**: Run PostgreSQL in a container
```bash
# No need to install PostgreSQL system-wide
# Just run it in Docker
```

### Problem: No Auto-Restart
**Docker Solution**: Containers can auto-restart
```yaml
restart: unless-stopped
```

### Problem: Port Management
**Docker Solution**: Internal networking
- Services talk to each other by name
- No need to expose all ports externally

### Problem: No Isolation
**Docker Solution**: Each service in its own container
- Python dependencies isolated
- Can't conflict with other projects
- Easy to clean up: `docker-compose down`

---

## What You Need to Learn (Beginner-Friendly)

### 1. Docker Basics

**What is Docker?**
Think of Docker as a "shipping container" for your code:
- Just like shipping containers, Docker containers are standardized
- They work the same way on any computer (your laptop, home server, cloud)
- They contain everything the app needs to run

**Key Concepts:**

**Container**: A running instance of your application
- Like a lightweight virtual machine
- Isolated from other containers
- Has its own filesystem, network

**Image**: A blueprint for containers
- Like a recipe that creates containers
- Built from a Dockerfile
- Can be shared and reused

**Dockerfile**: Instructions to build an image
```dockerfile
FROM python:3.10          # Start with Python
COPY . /app              # Copy your code
RUN pip install -r requirements.txt  # Install dependencies
CMD ["uvicorn", "app.main:app"]     # Run your app
```

**docker-compose**: Orchestrates multiple containers
```yaml
services:
  api:
    # Your FastAPI container
  worker:
    # Your Celery worker container
  postgres:
    # Database container
  redis:
    # Redis container
```

### 2. PostgreSQL Basics

**What is PostgreSQL?**
- A proper database (not a file like SQLite)
- Handles multiple connections simultaneously
- Production-ready
- Reliable

**You already have the schema!**
Your current SQLite database can be migrated to PostgreSQL with minimal changes.

### 3. Home Server Basics

**What is a home server?**
- A computer at your home that runs 24/7
- Could be:
  - Old laptop
  - Raspberry Pi
  - Desktop PC
  - Dedicated server hardware

**Requirements for your project:**
- **CPU**: 4 cores minimum (audio processing is intensive)
- **RAM**: 16GB minimum (Demucs model needs ~8GB)
- **Disk**: 100GB+ free space (models + audio files)
- **OS**: Linux (Ubuntu recommended)
- **Network**: Good upload speed (for serving files)

---

## Next Steps (In Order)

### Step 1: Understand What You Have ✅ (You're here!)
Read this document to understand your current setup.

### Step 2: Learn Docker Basics (Recommended)
- [ ] Read "Docker for Beginners" tutorial
- [ ] Install Docker on your machine
- [ ] Run a simple "Hello World" container
- [ ] Understand Dockerfile and docker-compose

**Resources:**
- Docker official tutorial: https://docs.docker.com/get-started/
- Docker Compose tutorial: https://docs.docker.com/compose/gettingstarted/

### Step 3: Plan Dockerization
- [ ] Decide what goes in each container
- [ ] Design docker-compose.yml
- [ ] Plan database migration (SQLite → PostgreSQL)

### Step 4: Create Dockerfiles
- [ ] Dockerfile for FastAPI
- [ ] Dockerfile for Celery Worker
- [ ] docker-compose.yml for orchestration

### Step 5: Test Locally
- [ ] Build Docker images
- [ ] Run with docker-compose
- [ ] Test all functionality

### Step 6: Deploy to Home Server
- [ ] Set up home server
- [ ] Install Docker on server
- [ ] Deploy your Docker setup
- [ ] Configure port forwarding (if needed)
- [ ] Set up domain/DNS (optional)

---

## Questions to Answer Before Dockerizing

### About Your Home Server

1. **Do you have a home server already?**
   - [ ] Yes, it's running
   - [ ] Yes, but need to set it up
   - [ ] No, need to get one

2. **What OS is/will be on it?**
   - [ ] Ubuntu/Debian Linux (recommended)
   - [ ] Windows with WSL2
   - [ ] Other: ___________

3. **Specs?**
   - CPU: ___ cores
   - RAM: ___ GB
   - Disk: ___ GB free

4. **Network?**
   - [ ] Fast home internet (100+ Mbps upload)
   - [ ] Slow internet (< 100 Mbps upload)
   - [ ] Will access locally only
   - [ ] Want to access from internet

### About Docker Knowledge

1. **Have you used Docker before?**
   - [ ] Yes, comfortable
   - [ ] A little bit
   - [ ] No, complete beginner

2. **Do you have Docker installed?**
   - [ ] Yes, on development machine
   - [ ] Yes, on home server
   - [ ] No, need to install

---

## Resources for Beginners

### Docker Learning
- **Docker Official Docs**: https://docs.docker.com/get-started/
- **Docker Compose**: https://docs.docker.com/compose/
- **Video Tutorial**: "Docker Tutorial for Beginners" (YouTube)

### PostgreSQL Learning
- **PostgreSQL Tutorial**: https://www.postgresqltutorial.com/
- **Why PostgreSQL over SQLite**: https://www.sqlite.org/whentouse.html

### Home Server Setup
- **r/homelab** (Reddit community for home servers)
- **Ubuntu Server Guide**: https://ubuntu.com/server/docs

---

## Summary

**You currently have:**
- ✅ Working FastAPI backend
- ✅ Working Celery workers
- ✅ Working Redis
- ✅ Working SQLite database
- ✅ Local file storage
- ✅ All core features implemented

**You need:**
- 🔄 Docker containers for easier deployment
- 🔄 PostgreSQL instead of SQLite
- 🔄 Orchestration with docker-compose
- 🔄 Home server setup

**But first:**
- 📚 Learn Docker basics (if you haven't already)
- 🤔 Answer the questions above
- 📝 Create a deployment plan specific to your home server

---

**Next Document**: Once you're ready, we'll create a beginner-friendly Docker tutorial specific to your project.



