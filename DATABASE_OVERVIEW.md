# Database Overview - What You Have

**Purpose**: Understand your current database structure  
**Database Type**: SQLite (currently) → PostgreSQL (target)  
**Location**: `backend/test.db`

---

## Overview

Your database has **2 main tables** that store everything your application needs:

1. **Audio** - Stores information about uploaded audio files
2. **Job** - Stores information about processing jobs

---

## Table 1: Audio

### Purpose
Stores metadata about every audio file that gets uploaded.

### Schema

```sql
CREATE TABLE audio (
    id           UUID          PRIMARY KEY,
    filename     VARCHAR(255)  NOT NULL,
    file_path    VARCHAR(512)  NOT NULL,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
```

### Columns Explained

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `id` | UUID | Unique identifier for the audio | `a1b2c3d4-e5f6-...` |
| `filename` | VARCHAR(255) | Original filename uploaded by user | `"mysong.mp3"` |
| `file_path` | VARCHAR(512) | Relative path where file is stored | `"audio/a1b2c3d4.../mysong.mp3"` |
| `created_at` | TIMESTAMP | When the audio was uploaded | `2026-01-06 10:30:00` |

### Real Example

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "filename": "beethoven_sonata.mp3",
  "file_path": "audio/a1b2c3d4-e5f6-7890-abcd-ef1234567890/beethoven_sonata.mp3",
  "created_at": "2026-01-06T10:30:00Z"
}
```

### Workflow

```
1. User uploads "mysong.mp3"
2. System generates UUID: a1b2c3d4...
3. File saved to: backend/tmp/audio/a1b2c3d4.../mysong.mp3
4. Record created in database:
   - id = a1b2c3d4...
   - filename = "mysong.mp3"
   - file_path = "audio/a1b2c3d4.../mysong.mp3"
   - created_at = now()
```

### How It's Used

```python
# When user uploads
audio_service.create_audio(
    audio_id=uuid4(),
    filename="mysong.mp3",
    file_path="audio/a1b2c3d4.../mysong.mp3"
)

# When creating a job (need to verify audio exists)
audio_path = audio_service.get_audio_path(audio_id)
if not audio_path:
    raise "Audio not found"
```

---

## Table 2: Job

### Purpose
Stores information about every processing job (stem separation, MIDI conversion, etc.)

### Schema

```sql
CREATE TABLE job (
    id              UUID          PRIMARY KEY,
    type            VARCHAR(50)   NOT NULL,
    status          VARCHAR(20)   NOT NULL,
    input           JSONB         NOT NULL,
    params          JSONB         NULL,
    output          JSONB         NULL,
    progress        FLOAT         NULL,
    error_message   TEXT          NULL,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
```

### Columns Explained

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `id` | UUID | Unique identifier for the job | `xyz-789-...` |
| `type` | VARCHAR(50) | Type of processing job | `"stem_separation"` |
| `status` | VARCHAR(20) | Current job status | `"succeeded"` |
| `input` | JSONB | Input data (what to process) | `{"audio_id": "a1b2..."}` |
| `params` | JSONB | Job parameters/settings | `{"model": "htdemucs"}` |
| `output` | JSONB | Results after processing | `{"vocals": "path/to/vocals.mp3", ...}` |
| `progress` | FLOAT | Processing progress (0.0 to 1.0) | `0.75` (75% complete) |
| `error_message` | TEXT | Error details if job failed | `"File not found"` or NULL |
| `created_at` | TIMESTAMP | When job was created | `2026-01-06 10:31:00` |
| `updated_at` | TIMESTAMP | Last time job was updated | `2026-01-06 10:35:00` |

### Job Types (Currently Implemented)

| Type | What It Does | Output |
|------|--------------|--------|
| `stem_separation` | Separates audio into vocals, drums, bass, other | 4 MP3 files |
| `midi_conversion` | Converts audio to MIDI notes | 1 MIDI file + CSV |
| `melody_extraction` | Extracts melody (future) | TBD |
| `chord_analysis` | Analyzes chords (future) | TBD |

### Job Status Values

| Status | Meaning | Next Status |
|--------|---------|-------------|
| `queued` | Job created, waiting for worker | → `running` |
| `running` | Worker is processing | → `succeeded` or `failed` |
| `succeeded` | Job completed successfully | (final) |
| `failed` | Job failed with error | (final) |

### Real Example (Stem Separation)

**When Created:**
```json
{
  "id": "xyz-789-abc-def",
  "type": "stem_separation",
  "status": "queued",
  "input": {
    "audio_id": "a1b2c3d4-e5f6-..."
  },
  "params": {
    "model": "htdemucs"
  },
  "output": null,
  "progress": null,
  "error_message": null,
  "created_at": "2026-01-06T10:31:00Z",
  "updated_at": "2026-01-06T10:31:00Z"
}
```

**While Processing:**
```json
{
  "id": "xyz-789-abc-def",
  "status": "running",
  "progress": 0.45,  // 45% complete
  "updated_at": "2026-01-06T10:32:30Z"
  // ... other fields unchanged
}
```

**When Complete:**
```json
{
  "id": "xyz-789-abc-def",
  "status": "succeeded",
  "output": {
    "vocals": "jobs/xyz-789-abc-def/stems/track.vocals.mp3",
    "drums": "jobs/xyz-789-abc-def/stems/track.drums.mp3",
    "bass": "jobs/xyz-789-abc-def/stems/track.bass.mp3",
    "other": "jobs/xyz-789-abc-def/stems/track.other.mp3"
  },
  "progress": 1.0,  // 100% complete
  "updated_at": "2026-01-06T10:35:00Z"
  // ... other fields unchanged
}
```

### Real Example (MIDI Conversion)

**When Complete:**
```json
{
  "id": "abc-456-def",
  "type": "midi_conversion",
  "status": "succeeded",
  "input": {
    "audio_id": "a1b2c3d4-..."
  },
  "params": {
    "save_notes": true,
    "midi_tempo": 120
  },
  "output": {
    "midi": "jobs/abc-456-def/midi/track.mid",
    "notes": "jobs/abc-456-def/midi/track_notes.csv"
  },
  "progress": 1.0,
  "created_at": "2026-01-06T10:40:00Z",
  "updated_at": "2026-01-06T10:42:00Z"
}
```

---

## Database Relationships

### One Audio → Many Jobs

One audio file can be used for multiple jobs:

```
Audio: beethoven_sonata.mp3 (id: a1b2...)
  ├─ Job 1: stem_separation (id: xyz-789)
  ├─ Job 2: midi_conversion (id: abc-456)
  └─ Job 3: melody_extraction (id: def-123) [future]
```

**Why this design?**
- Upload once, process many ways
- Efficient: Don't re-upload for each job type
- Flexible: Can run different analyses on same audio

### How It Works

```python
# 1. Upload audio once
audio_id = upload_audio("beethoven.mp3")
# Creates record in Audio table

# 2. Create multiple jobs using same audio_id
job1 = create_job(type="stem_separation", audio_id=audio_id)
job2 = create_job(type="midi_conversion", audio_id=audio_id)
# Each creates a record in Job table, referencing same audio_id
```

### Current "Relationship"

**Note**: Currently there's no formal foreign key constraint between Job.input.audio_id and Audio.id because:
- `input` is a JSON field
- SQLite has limited JSON support
- It works, but it's loose

**When migrating to PostgreSQL**: You could add a proper foreign key for better data integrity.

---

## Data Flow Example

### Complete Workflow

```
1. User uploads "mysong.mp3"
   ↓
2. Audio table record created
   {
     id: a1b2...,
     filename: "mysong.mp3",
     file_path: "audio/a1b2.../mysong.mp3"
   }
   ↓
3. User creates stem separation job
   ↓
4. Job table record created
   {
     id: xyz...,
     type: "stem_separation",
     status: "queued",
     input: {audio_id: "a1b2..."}
   }
   ↓
5. Worker picks up job
   - Updates status to "running"
   - Updates progress periodically
   ↓
6. Worker completes processing
   - Saves stems to disk
   - Updates job:
     {
       status: "succeeded",
       progress: 1.0,
       output: {
         vocals: "path/to/vocals.mp3",
         ...
       }
     }
   ↓
7. User queries job status
   - Gets job record from database
   - Downloads files using paths in output
```

---

## Queries You're Currently Using

### Get Audio by ID
```python
audio = db.query(Audio).filter(Audio.id == audio_id).first()
```

### Create Audio
```python
audio = Audio(
    id=audio_id,
    filename=filename,
    file_path=file_path
)
db.add(audio)
db.commit()
```

### Get Job by ID
```python
job = db.query(Job).filter(Job.id == job_id).first()
```

### Create Job
```python
job = Job(
    id=job_id,
    type=job_type,
    status="queued",
    input={"audio_id": str(audio_id)},
    params=params or {}
)
db.add(job)
db.commit()
```

### Update Job Status
```python
job.status = "running"
job.progress = 0.5
db.commit()
```

### List All Jobs (New!)
```python
jobs = db.query(Job).order_by(Job.created_at.desc()).limit(10).all()
```

---

## Database Size Estimates

### What Takes Up Space

**Audio table**: Very small
- ~200 bytes per record
- 1000 audio files = ~200 KB
- Negligible

**Job table**: Small
- ~500 bytes per record (depends on output JSON size)
- 1000 jobs = ~500 KB
- Negligible

**Actual files**: This is what takes up space!
- Average MP3: 5-10 MB
- Stems (4 files): 5-10 MB each = 20-40 MB per job
- MIDI: ~100 KB
- 1000 audio files + 1000 stem jobs = ~35 GB

**Conclusion**: Database is tiny, files are what you need disk space for.

---

## Migration to PostgreSQL

### Why Migrate?

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Concurrent writes | ❌ Locks entire DB | ✅ Row-level locks |
| Multiple connections | ⚠️ Limited | ✅ Unlimited (practically) |
| JSON support | ⚠️ Basic | ✅ Advanced (JSONB) |
| Performance | ⚠️ OK for small data | ✅ Optimized for large data |
| Production-ready | ❌ Not recommended | ✅ Industry standard |

### Migration Steps (Overview)

1. **Export SQLite data**
   ```bash
   sqlite3 test.db .dump > backup.sql
   ```

2. **Set up PostgreSQL** (in Docker)
   ```yaml
   postgres:
     image: postgres:15-alpine
   ```

3. **Create tables** (same schema, but in PostgreSQL)
   ```python
   Base.metadata.create_all(bind=engine)
   ```

4. **Import data** (if you have existing data)
   ```bash
   # Convert SQLite backup to PostgreSQL format
   # Import into PostgreSQL
   ```

5. **Update connection string**
   ```python
   # Before
   DATABASE_URL = "sqlite:///./test.db"
   
   # After
   DATABASE_URL = "postgresql://user:pass@postgres:5432/music"
   ```

**Good news**: Your SQLAlchemy models don't change! Same Python code works with both.

---

## Database Backup Strategy

### Current State (SQLite)
```bash
# Simple: just copy the file
cp backend/test.db backend/test.db.backup
```

### Future State (PostgreSQL in Docker)
```bash
# Dump database to SQL file
docker compose exec postgres pg_dump -U postgres music > backup.sql

# Restore from backup
cat backup.sql | docker compose exec -T postgres psql -U postgres music
```

### What to Backup

1. **Database** (Audio and Job tables)
   - Frequency: Daily
   - Size: Very small (< 1 MB for thousands of records)

2. **Files** (Audio files and job outputs)
   - Frequency: After each job completes (they don't change)
   - Size: Large (GBs)

---

## Summary

### What You Have
- ✅ 2 tables (Audio, Job)
- ✅ Simple but effective design
- ✅ Works with SQLite currently
- ✅ Can migrate to PostgreSQL without code changes

### What's Stored
- ✅ Audio metadata (not the actual audio files - those are on disk)
- ✅ Job records (status, progress, results)
- ✅ Relationships (via audio_id in job.input)

### Database Is Not The Bottleneck
- Database records are tiny (< 1 MB)
- Files are what takes space (GBs)
- Database queries are fast
- Processing (Demucs, Basic Pitch) is what takes time

### Next Steps
1. ✅ Understand current database (you're doing this!)
2. ⏳ Plan PostgreSQL migration
3. ⏳ Set up PostgreSQL in Docker
4. ⏳ Migrate data (if needed)
5. ⏳ Test everything works

---

**Key Takeaway**: Your database design is good! It's simple, clear, and will work fine with PostgreSQL. The migration is mostly about:
1. Running PostgreSQL in Docker
2. Changing the connection string
3. Everything else stays the same!



