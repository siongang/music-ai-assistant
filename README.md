# Music Assistant

> An AI-powered music processing platform with conversational LLM orchestration

[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

---

## What is Music Assistant?

Music Assistant is a **hybrid digital music processing platform** that combines:

1. **AI/ML Audio Tools**: Run professional audio processing models (Demucs stem separation, BasicPitch MIDI conversion)
2. **LLM Agent Orchestration**: Interact with tools conversationally through a reliable, minimal agent framework
3. **Job-Based Execution**: All heavy compute runs asynchronously with full observability

### Current Focus (v2.0)

We provide a **foundational platform** where:
- Users upload audio and request processing via natural language
- An LLM agent orchestrates tool execution (creates jobs, monitors status, explains results)
- Processing happens in the background using Celery workers
- The agent is **reliable about tool usage** but **dumb about music theory** (by design)

### Future Direction (v3.0+)

The architecture supports adding a **symbolic music analysis layer** that will:
- Convert raw MIDI → structured music data (chords, key, harmonic function)
- Enable deep music theory reasoning by LLM
- Provide advanced analysis tools

**But we're explicitly NOT building this yet.** We're focusing on rock-solid foundations first.

---

## Key Features

### Current (v2.0)

✅ **Audio Processing**
- Upload audio files (MP3, WAV, FLAC, etc.)
- Separate audio into stems (vocals, drums, bass, other) using Demucs
- Convert audio to MIDI using BasicPitch
- Download processed results

✅ **LLM Agent**
- Conversational interface for audio processing
- Tool orchestration (agent selects and calls appropriate tools)
- Session-based conversations with full history
- Transparent tool execution (all actions logged)

✅ **Job System**
- Async processing with Celery + Redis
- Job status tracking (queued, running, succeeded, failed)
- Automatic retries on transient errors
- Full observability

✅ **Production-Ready Infrastructure**
- FastAPI backend with Pydantic validation
- PostgreSQL/SQLite database support
- Local file storage (cloud-ready architecture)
- Docker-first deployment

### Planned (v3.0+)

🔄 **Symbolic Music Analysis**
- Chord progression analysis with Roman numerals
- Key and modulation detection
- Melodic contour analysis
- Harmonic function labeling

🔄 **Advanced Features**
- Streaming responses (SSE)
- Job completion webhooks
- Multi-file batch processing
- User authentication & authorization

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      User (Web UI / API Client)                      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTP
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ /audio   │  │ /jobs    │  │ /chat    │  │ /sessions        │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
└────────────────────┬──────────────────────────┬─────────────────────┘
                     │                          │
         ┌───────────┴────────┐      ┌─────────┴──────────┐
         ▼                    ▼      ▼                    ▼
┌─────────────────┐   ┌──────────────────────────────────────────────┐
│  Audio/Job      │   │          LLM Agent Layer                     │
│  Services       │   │  ┌───────────────────────────────────┐      │
│                 │   │  │  AgentExecutor                     │      │
│                 │   │  │  - Tool selection via LLM          │      │
│                 │   │  │  - Step execution (guarded)        │      │
│                 │   │  │  - Session state management        │      │
│                 │   │  └───────────────────────────────────┘      │
│                 │   │  ┌───────────────────────────────────┐      │
│                 │   │  │  Tool Registry                     │      │
│                 │   │  │  - separate_stems                  │      │
│                 │   │  │  - convert_to_midi                 │      │
│                 │   │  │  - get_job_status                  │      │
│                 │   │  └───────────────────────────────────┘      │
└────────┬────────┘   └──────────────────┬───────────────────────────┘
         │                               │
         ▼                               ▼
┌──────────────────────┐     ┌──────────────────────────┐
│   Celery Workers     │     │   LLM Provider           │
│   (Audio Processing) │     │   (OpenAI, Anthropic)    │
└──────────┬───────────┘     └──────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  Audio Processing Engine                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Demucs       │  │ BasicPitch   │  │ [Future] Symbolic        │  │
│  │ (Stem Sep)   │  │ (MIDI Conv)  │  │ Analysis                 │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└──────────┬───────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  Storage & Database                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ PostgreSQL │  │ LocalStore │  │ Redis      │  │ Future:    │    │
│  │ - audio    │  │ - files    │  │ - queue    │  │ S3/Azure   │    │
│  │ - jobs     │  │ - results  │  │ - results  │  │            │    │
│  │ - sessions │  │            │  │            │  │            │    │
│  │ - steps    │  │            │  │            │  │            │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- PostgreSQL (or SQLite for development)
- Redis
- FFmpeg
- PyTorch with CUDA (optional, for GPU acceleration)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/music-assistant.git
cd music-assistant/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see Configuration section)

# Initialize database
python -c "from app.db.session import engine; from app.db.base import Base; Base.metadata.create_all(engine)"

# Start Redis (if not already running)
redis-server
```

### Running the Application

You need **3 terminal windows**:

**Terminal 1: API Server**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2: Celery Worker**
```bash
cd backend
source venv/bin/activate
celery -A app.celery_app worker --loglevel=info
```

**Terminal 3: Redis (if not running as service)**
```bash
redis-server
```

The API will be available at:
- **API Docs**: http://localhost:8000/api/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/health

---

## Configuration

Create a `.env` file in the `backend/` directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/music_assistant
# Or for SQLite: sqlite:///./test.db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Storage
STORAGE_ROOT=./tmp

# LLM (for agent features)
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai
LLM_MODEL=gpt-4

# Agent Configuration
MAX_AGENT_STEPS=10
TOOL_TIMEOUT=30
```

---

## Usage Examples

### Example 1: Direct API (No Agent)

**Upload Audio**:
```bash
curl -X POST http://localhost:8000/api/audio \
  -F "file=@song.mp3"

# Response:
# {
#   "audio_id": "550e8400-e29b-41d4-a716-446655440000",
#   "filename": "song.mp3"
# }
```

**Create Stem Separation Job**:
```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "stem_separation",
    "input": {
      "audio_id": "550e8400-e29b-41d4-a716-446655440000"
    },
    "params": {}
  }'

# Response:
# {
#   "job_id": "660e8400-e29b-41d4-a716-446655440111",
#   "type": "stem_separation",
#   "status": "queued",
#   ...
# }
```

**Check Job Status**:
```bash
curl http://localhost:8000/api/jobs/660e8400-e29b-41d4-a716-446655440111

# Response (when complete):
# {
#   "job_id": "660e8400-e29b-41d4-a716-446655440111",
#   "status": "succeeded",
#   "output": {
#     "vocals": "jobs/660e8400-.../stems/track.vocals.mp3",
#     "drums": "jobs/660e8400-.../stems/track.drums.mp3",
#     "bass": "jobs/660e8400-.../stems/track.bass.mp3",
#     "other": "jobs/660e8400-.../stems/track.other.mp3"
#   }
# }
```

**Download Results**:
```bash
curl http://localhost:8000/api/audio/files/jobs/660e8400-.../stems/track.vocals.mp3 \
  -o vocals.mp3
```

### Example 2: Using LLM Agent (Conversational)

**Create Session**:
```bash
curl -X POST http://localhost:8000/api/chat/sessions

# Response:
# {
#   "session_id": "770e8400-e29b-41d4-a716-446655440222",
#   "created_at": "2026-01-17T10:00:00Z"
# }
```

**Send Message to Agent**:
```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "770e8400-e29b-41d4-a716-446655440222",
    "message": "Separate audio 550e8400-e29b-41d4-a716-446655440000 into stems"
  }'

# Response:
# {
#   "session_id": "770e8400-e29b-41d4-a716-446655440222",
#   "message": "I've started separating your audio into stems. The job is running in the background and should complete in 2-5 minutes. Job ID: 660e8400-e29b-41d4-a716-446655440111. I'll check the status for you...",
#   "metadata": {
#     "steps": 3,
#     "tools_used": ["separate_stems"]
#   }
# }
```

**Follow-Up Message**:
```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "770e8400-e29b-41d4-a716-446655440222",
    "message": "Is it done yet?"
  }'

# Agent checks job status and responds:
# {
#   "message": "Yes! Your stem separation is complete. I've separated the audio into 4 stems: vocals, drums, bass, and other. You can download them from the job output."
# }
```

**View Conversation History**:
```bash
curl http://localhost:8000/api/chat/sessions/770e8400-e29b-41d4-a716-446655440222/history

# Returns full conversation with all agent steps (tool calls, results, etc.)
```

---

## Documentation

### For Users
- **[START_HERE.md](./START_HERE.md)** - Home server deployment guide (if deploying locally)
- **[CURRENT_STATE.md](./CURRENT_STATE.md)** - What's currently working and how to run it
- **[DATABASE_OVERVIEW.md](./DATABASE_OVERVIEW.md)** - Understanding the database schema

### For Developers
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - **START HERE** - Complete system architecture, design decisions, future roadmap
- **[docs/AGENT.md](./docs/AGENT.md)** - LLM agent framework deep dive
- **[docs/TOOLS.md](./docs/TOOLS.md)** - Tools system and how to create new tools
- **[docs/EXECUTION_PLAN.md](./docs/EXECUTION_PLAN.md)** - Step-by-step implementation guide

### Backend Specific
- **[backend/README.md](./backend/README.md)** - Backend setup and development
- **[backend/TESTING.md](./backend/TESTING.md)** - Testing guide
- **[backend/ARCHITECTURE.md](./backend/ARCHITECTURE.md)** - Backend architecture (legacy, see docs/ARCHITECTURE.md)

---

## Project Structure

```
music-assistant/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── agent/       # LLM agent framework (NEW in v2.0)
│   │   │   ├── tools/   # Tool definitions
│   │   │   ├── executor.py
│   │   │   ├── session_service.py
│   │   │   └── llm_client.py
│   │   ├── api/         # REST API endpoints
│   │   │   ├── endpoints/
│   │   │   │   ├── audio.py
│   │   │   │   ├── jobs.py
│   │   │   │   └── chat.py    # NEW in v2.0
│   │   │   └── router.py
│   │   ├── audio_engine/  # Audio processing
│   │   │   ├── stems/     # Demucs stem separation
│   │   │   ├── midi/      # BasicPitch MIDI conversion
│   │   │   └── pipeline/  # Processing orchestration
│   │   ├── core/        # Constants and config
│   │   ├── db/          # Database setup
│   │   ├── models/      # SQLAlchemy models
│   │   │   ├── audio.py
│   │   │   ├── job.py
│   │   │   ├── session.py      # NEW in v2.0
│   │   │   └── agent_step.py   # NEW in v2.0
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   ├── storage/     # File storage abstraction
│   │   ├── tasks/       # Celery tasks
│   │   └── workers/     # Background workers (legacy)
│   ├── tests/           # Test suite
│   └── requirements.txt
├── docs/                # Comprehensive documentation (NEW)
│   ├── ARCHITECTURE.md
│   ├── AGENT.md
│   ├── TOOLS.md
│   └── EXECUTION_PLAN.md
├── output/              # Default output directory
└── README.md           # This file
```

---

## API Reference

### Audio Endpoints

- **`POST /api/audio`** - Upload audio file
- **`GET /api/audio/{audio_id}`** - Get audio metadata
- **`GET /api/audio/files/{path}`** - Download audio file

### Job Endpoints

- **`POST /api/jobs`** - Create processing job
- **`GET /api/jobs/{job_id}`** - Get job status
- **`GET /api/jobs`** - List jobs (with filtering and pagination)

### Chat/Agent Endpoints (NEW in v2.0)

- **`POST /api/chat/sessions`** - Create new chat session
- **`POST /api/chat/message`** - Send message to agent
- **`GET /api/chat/sessions/{session_id}/history`** - Get conversation history

### Utility Endpoints

- **`GET /health`** - Health check

Full API documentation available at `/api/docs` (Swagger UI) when running.

---

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database
- **Pydantic** - Data validation
- **Celery** - Async task queue
- **Redis** - Message broker and result backend

### Audio Processing
- **Demucs** (PyTorch) - State-of-the-art stem separation
- **BasicPitch** (TensorFlow) - Audio-to-MIDI conversion
- **FFmpeg** - Audio format conversion

### LLM Integration (NEW)
- **OpenAI API** - GPT-4 for agent reasoning
- Future: Anthropic, local models

### Database
- **PostgreSQL** (production)
- **SQLite** (development)

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

---

## Development

### Running Tests

```bash
cd backend
pytest

# With coverage
pytest --cov=app tests/

# Specific test file
pytest tests/test_tools.py
```

### Code Quality

```bash
# Format code
black app/

# Lint
flake8 app/

# Type checking
mypy app/
```

### Adding a New Tool

See [docs/TOOLS.md](./docs/TOOLS.md) for complete guide.

Quick example:

```python
# backend/app/agent/tools/my_tool.py
from app.agent.tools.base import Tool

class MyTool(Tool):
    name = "my_tool"
    description = "What this tool does"
    parameters = {...}  # JSON Schema
    
    def execute(self, **kwargs):
        # Implementation
        return {"result": "..."}

# Register in backend/app/agent/tools/registry.py
registry.register(MyTool(...))
```

Agent automatically discovers and uses the new tool!

---

## Deployment

### Docker Compose (Recommended)

```yaml
# docker-compose.yml (example, to be created)
services:
  api:
    build: backend/
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
  
  worker:
    build: backend/
    command: celery -A app.celery_app worker
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
  
  postgres:
    image: postgres:15
    volumes: ["pgdata:/var/lib/postgresql/data"]
  
  redis:
    image: redis:7

volumes:
  pgdata:
```

```bash
docker-compose up -d
```

### Manual Deployment

See [backend/README.md](./backend/README.md) for detailed deployment instructions.

---

## Roadmap

### v2.0 - Current (LLM Agent Foundation)
- ✅ Core audio processing (Demucs, BasicPitch)
- ✅ Job system with Celery
- ✅ LLM agent framework
- ✅ Tool registry and execution
- ✅ Session management
- ✅ Conversational API

### v2.1 - Near Term Improvements
- [ ] Streaming responses (SSE)
- [ ] Job completion webhooks
- [ ] User authentication
- [ ] More robust error handling
- [ ] Performance optimization

### v3.0 - Symbolic Music Analysis
- [ ] MIDI → structured music data pipeline
- [ ] Chord progression analysis
- [ ] Key and modulation detection
- [ ] Harmonic function analysis
- [ ] New tools: analyze_chords, detect_key, extract_melody

### v3.1+ - Advanced Features
- [ ] Music theory reasoning by LLM
- [ ] Multi-file batch processing
- [ ] Cloud storage integration (S3, Azure)
- [ ] Advanced visualization
- [ ] Learning from user feedback

---

## Design Principles

### 1. No External Agent Frameworks
We build our own minimal agent framework instead of using LangChain, LlamaIndex, etc. This gives us:
- Full control over tool execution
- Better observability
- Integration with our job system
- No version churn

### 2. Jobs Are Source of Truth
All long-running operations go through the job system:
- Audio processing never blocks API
- Automatic retries on transient errors
- Full observability (status, progress, logs)
- Jobs persist across worker restarts

### 3. Future-Proof Architecture
The system is designed to support symbolic music analysis (v3.0) without rewrites:
- Clear insertion point for new analysis layer
- Tool registry makes adding capabilities easy
- Agent framework agnostic about tool capabilities

### 4. Boring Technology
We prioritize reliability over novelty:
- PostgreSQL (battle-tested database)
- Celery + Redis (proven job queue)
- FastAPI (modern but stable)
- Explicit over implicit (no magic)

---

## Contributing

We welcome contributions! Please:

1. Read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) to understand the system
2. Check existing issues or create a new one
3. Fork the repository
4. Create a feature branch
5. Make your changes with tests
6. Submit a pull request

### Development Setup

```bash
# Fork and clone
git clone https://github.com/yourfork/music-assistant.git

# Set up development environment
cd music-assistant/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt  # If exists

# Run tests
pytest

# Start development server
uvicorn app.main:app --reload
```

---

## FAQ

### Q: Can the agent understand music theory?

**A**: Not yet. In v2.0, the agent is excellent at orchestrating tools but doesn't have deep music understanding. It can't answer questions like "What key is this in?" or "What's the chord progression?" 

This is **intentional**. We're waiting for v3.0 (symbolic analysis layer) before adding music theory reasoning. This prevents the agent from hallucinating music theory facts.

### Q: Why not use LangChain?

**A**: LangChain introduces heavy abstractions and hidden state that make debugging difficult. Our use case (job-backed tool execution) requires tight integration that's easier to build from scratch. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for full reasoning.

### Q: How long does processing take?

**A**: Typical times:
- Stem separation: 1-5 minutes (depends on song length)
- MIDI conversion: 1-3 minutes
- Jobs run in background - you can check status anytime

### Q: Can I run this locally?

**A**: Yes! See [Quick Start](#quick-start). For home server deployment, see [START_HERE.md](./START_HERE.md).

### Q: What audio formats are supported?

**A**: MP3, WAV, FLAC, M4A, OGG, WMA, AAC, AIFF. See `app/core/constants.py` for full list.

### Q: Can I add custom tools?

**A**: Yes! See [docs/TOOLS.md](./docs/TOOLS.md) for complete guide. Tools are automatically discovered by the agent.

---

## License

[Your License Here - e.g., MIT, Apache 2.0]

---

## Credits

- **Demucs** - Audio source separation (Meta Research)
- **BasicPitch** - Audio-to-MIDI conversion (Spotify)
- **FastAPI** - Web framework
- **Celery** - Task queue

---

## Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/music-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/music-assistant/discussions)
- **Email**: your.email@example.com

---

## Changelog

### v2.0.0 (2026-01-17)
- ✨ Added LLM agent framework
- ✨ Added tool registry and execution system
- ✨ Added session management
- ✨ Added conversational chat API
- 📚 Comprehensive documentation rewrite
- 🏗️ Architecture redesign for future symbolic analysis

### v1.0.0 (2025-XX-XX)
- ✨ Initial release
- ✨ Audio upload and storage
- ✨ Stem separation (Demucs)
- ✨ MIDI conversion (BasicPitch)
- ✨ Job system with Celery
- ✨ REST API

---

**Ready to get started? Read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for developers or [Quick Start](#quick-start) for users.**
