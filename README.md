# Music Assistant

> An AI-powered music analysis platform that enriches audio with structured data and enables intelligent music understanding through LLM integration.

## Overview

Music Assistant is a comprehensive music analysis platform that combines advanced audio processing with large language model (LLM) capabilities. The system processes audio files to extract structured musical information (stems, MIDI, chords, melody) and enriches this data for intelligent querying and visualization.

### Core Concept

1. **Audio Processing**: Upload music files and automatically separate them into stems (vocals, drums, bass, other)
2. **Musical Analysis**: Extract MIDI information, chord progressions, and melodic content
3. **LLM Enrichment**: Feed structured musical data to an LLM along with other analysis results
4. **Intelligent Querying**: Ask questions about the music using natural language
5. **Visualization**: View musical content in DAW-like interfaces (piano roll, sheet music)

## Features

### Current (Backend)
- ✅ **Audio Upload**: Upload audio files via REST API
- ✅ **Stem Separation**: Automatically separate audio into stems using Demucs
- ✅ **MIDI Conversion**: Convert audio to MIDI format using Basic Pitch
- ✅ **Job Management**: Asynchronous job processing with status tracking
- ✅ **Flexible Architecture**: Support for multiple job types (stem separation, MIDI conversion, melody extraction, chord analysis)

### Planned
- 🔄 **MusicXML Conversion**: Convert MIDI to MusicXML for sheet music display
- 🔄 **LLM Integration**: Enrich musical data with LLM for intelligent querying
- 🔄 **DAW-like UI**: View notes in piano roll and sheet music formats
- 🔄 **Music Analysis**: Chord detection, melody extraction, rhythm analysis

## Architecture

```
┌─────────────┐
│   Frontend  │  (Future: DAW-like interface)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  FastAPI    │  REST API
│  Backend    │
└──────┬──────┘
       │
       ├──► Audio Upload ──► Storage
       │
       ├──► Job Creation ──► Redis Queue
       │
       └──► Celery Workers ──► Audio Processing
                              │
                              ├──► Stem Separation (Demucs)
                              ├──► MIDI Conversion (Basic Pitch)
                              ├──► Chord Analysis (Future)
                              └──► Melody Extraction (Future)
```

## Project Structure

```
music-assistant/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # REST API endpoints
│   │   ├── services/ # Business logic
│   │   ├── tasks/    # Celery background tasks
│   │   ├── models/   # Database models
│   │   └── ...
│   └── README.md
└── README.md         # This file
```

## Quick Start

See [backend/README.md](./backend/README.md) for detailed setup instructions.

### Prerequisites
- Python 3.10+
- PostgreSQL (or SQLite for testing)
- Redis
- FFmpeg
- PyTorch

### Basic Setup

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Start Redis
redis-server

# 3. Start API server
uvicorn app.main:app --reload

# 4. Start Celery worker (in another terminal)
celery -A app.celery_app worker --loglevel=info
```

## API Usage

### 1. Upload Audio
```bash
POST /api/audio
Content-Type: multipart/form-data

file: <audio_file>
```

Response:
```json
{
  "audio_id": "abc-123-def",
  "filename": "song.mp3"
}
```

### 2. Create Job

**Stem Separation:**
```bash
POST /api/jobs
Content-Type: application/json

{
  "type": "stem_separation",
  "input": {
    "audio_id": "abc-123-def"
  },
  "params": {
    "model": "demucs_v4"
  }
}
```

**MIDI Conversion:**
```bash
POST /api/jobs
Content-Type: application/json

{
  "type": "midi_conversion",
  "input": {
    "audio_id": "abc-123-def"
  },
  "params": {
    "save_notes": true,
    "midi_tempo": 120
  }
}
```

Response:
```json
{
  "job_id": "xyz-789",
  "type": "stem_separation",
  "status": "queued",
  "audio_id": "abc-123-def",
  ...
}
```

### 3. Check Job Status
```bash
GET /api/jobs/{job_id}
```

Response (Stem Separation):
```json
{
  "job_id": "xyz-789",
  "status": "succeeded",
  "output": {
    "vocals": "jobs/xyz-789/stems/track.vocals.mp3",
    "drums": "jobs/xyz-789/stems/track.drums.mp3",
    "bass": "jobs/xyz-789/stems/track.bass.mp3",
    "other": "jobs/xyz-789/stems/track.other.mp3"
  }
}
```

Response (MIDI Conversion):
```json
{
  "job_id": "abc-456",
  "status": "succeeded",
  "output": {
    "midi": "jobs/abc-456/midi/track.mid",
    "notes": "jobs/abc-456/midi/track_notes.csv"
  }
}
```

## Use Cases

### 1. Music Analysis & Understanding
- Upload a song and get detailed analysis
- Ask questions like "What key is this song in?" or "What's the chord progression?"
- Get insights powered by LLM understanding of the musical structure

### 2. Music Education
- Upload a piano piece and see the MIDI notes
- View sheet music representation
- Understand musical structure and theory

### 3. Music Production
- Separate stems for remixing
- Analyze chord progressions
- Extract melodic content

## Technology Stack

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL / SQLite
- **Queue**: Redis + Celery
- **Audio Processing**: 
  - Demucs (PyTorch) for stem separation
  - Basic Pitch (TensorFlow) for MIDI conversion
- **Future**: LLM integration, MusicXML

## Development Status

- ✅ **Phase 1**: Audio upload and stem separation (Complete)
- ✅ **Phase 2**: MIDI conversion (Complete)
- 🔄 **Phase 3**: Music analysis (chord detection, melody extraction) (In Progress)
- 📋 **Phase 4**: LLM integration (Planned)
- 📋 **Phase 5**: Frontend DAW-like interface (Planned)

## Contributing

## License

[Your License Here]

## Roadmap

- [x] MIDI conversion from audio
- [ ] MusicXML conversion
- [ ] Chord detection and analysis
- [ ] Melody extraction
- [ ] LLM integration for music understanding
- [ ] Frontend DAW-like interface
- [ ] Real-time processing
- [ ] Batch processing
- [ ] User authentication
- [ ] Cloud storage integration

