# Project Status – Music Assistant

**Last updated:** January 2026

Quick overview of where the project stands across backend, frontend, and docs.

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| **Backend API** | ✅ Working | FastAPI, **project-owned**: projects CRUD + tree, project-scoped audio/jobs |
| **LLM Agent** | ✅ Working | Sessions, tools (stems, MIDI, job status), chat API |
| **Celery + Redis** | ✅ Working | Stem separation, MIDI conversion jobs |
| **Frontend foundation** | ✅ Done | Types, API client, adapters, object-tree store (Phases 0–4) |
| **Frontend UI** | 🟡 In progress | Layouts and shells built; track area, tools, playback not wired |
| **End-to-end MVP** | 🔲 Not done | Upload → stems → playback in UI not connected |

---

## Backend (Current)

**Stack:** FastAPI, Celery, Redis, PostgreSQL or SQLite, Local file storage

**Design:** Projects own audio and jobs. All audio/job create/list/get are under `/api/projects/{project_id}/...`.

**Working:**
- **Projects:** `POST/GET/PUT/DELETE /api/projects`, `GET/PUT /api/projects/{id}/tree` (object tree snapshot)
- **Audio (project-scoped):** `POST /api/projects/{id}/audio` upload, `GET /api/projects/{id}/audio` list, `GET /api/projects/{id}/audio/{audio_id}`, `GET .../audio/{audio_id}/download`
- **Jobs (project-scoped):** `POST /api/projects/{id}/jobs`, `GET /api/projects/{id}/jobs`, `GET /api/projects/{id}/jobs/{job_id}`; types: `stem_separation`, `midi_conversion`
- **Job outputs:** `GET /api/audio/files/{path}` (e.g. `jobs/{job_id}/stems/...`)
- **Chat/Agent:** `POST /api/chat/sessions`, `POST /api/chat/message`, `GET /api/chat/sessions/{id}/history`; agent tools get project from audio
- **Workers:** Demucs stem separation, BasicPitch MIDI conversion; job status and progress updates

**Run locally:**  
Terminal 1: Redis. Terminal 2: `uvicorn app.main:app --reload`. Terminal 3: `celery -A app.celery_app worker --loglevel=info`

**Docs:** `backend/README.md`, `backend/BACKEND_PROJECTS_UPDATE.md` (API and schema), `docs/ARCHITECTURE.md`, `docs/AGENT.md`, `docs/TOOLS.md`

---

## Frontend (Current)

**Stack:** Next.js 15 (App Router), TypeScript, Tailwind, Zustand

**Done (Phases 0–4):**
- **Phase 0:** App structure, route groups `(marketing)` and `(studio)`
- **Phase 1:** Types – `MusicalObject`, `Project`, `Tool`, `View` in `src/types/`
- **Phase 2:** API client – `src/api-client/` (audio, jobs, chat), matches backend
- **Phase 3:** Adapters – `src/adapters/` (job → musical object, project, status info)
- **Phase 4:** Object tree – Zustand store + hooks in `src/features/object-tree/`

**UI built (not yet wired to data):**
- **Studio home** (`/studio`): Sidebar (Home, Projects, Docs, Examples, Pricing), welcome, upload CTA, recent projects (empty), “View Demo” → `/project/demo`
- **Project workstation** (`/project/[id]`): DAW-style shell – header (project name, tempo/4/4/Am), collapsible Objects panel (empty state, “Add Object”), main area placeholder, transport footer (play/stop/loop, 00:00.0)
- **Project page content:** Placeholder “Waveform Editor – Coming soon”

**Not yet implemented:**
- Object panel wired to object-tree store (show/add/select objects)
- File upload flow (studio or project) → backend → object tree
- Track area, timeline, waveform renderer
- Tool execution (e.g. “Separate Stems”) from UI → job → update tree
- Audio playback (Web Audio API, mute/solo/volume)
- Project list/create from API or persistence

**Docs:** `frontend/START_HERE.md`, `frontend/MVP_ROADMAP.md`, `frontend/DEVELOPMENT_PLAN.md`, `frontend/DOCS_INDEX.md`

---

## Documentation Map

| Doc | Purpose |
|-----|--------|
| **PROJECT_STATUS.md** (this file) | Single place for “where we are” and what’s next |
| **START_HERE.md** (root) | Deployment / Docker / home server path |
| **CURRENT_STATE.md** | Backend + run instructions + limitations |
| **README.md** | Project overview, architecture, quick start |
| **backend/BACKEND_PROJECTS_UPDATE.md** | Backend API and schema (project-owned, routes) |
| **DATABASE_OVERVIEW.md** | Database tables (projects, audio, jobs) |
| **frontend/DOCS_INDEX.md** | Which frontend doc to use when |
| **frontend/MVP_ROADMAP.md** | MVP phases and checklist |
| **frontend/DEVELOPMENT_PLAN.md** | Full development phases |
| **docs/ARCHITECTURE.md** | System design and decisions |

---

## Recommended Next Steps

1. **Wire Object Panel to store**  
   Use `useObjectTree` / `useObjectSelection` in project layout; render root/children, selection, “Add Object” (e.g. open upload or create placeholder).

2. **Wire upload to backend and tree**  
   Create or select project first, then file picker/drop → `POST /api/projects/{id}/audio` → `audioUploadToObject()` → `addObject()`.

3. **Track area + waveform**  
   Implement track list and waveform view for selected object(s); can start with static data from object tree.

4. **Stem separation from UI**  
   Context menu or tool button on audio object → `POST /api/projects/{id}/jobs` (same project as audio) → poll `GET /api/projects/{id}/jobs/{job_id}` → `jobToMusicalObject()` → add stems as children.

5. **Playback**  
   Web Audio API: load selected audio/URLs, play/stop, simple mute/solo/volume for multiple stems.

6. **Projects**  
   Backend has project CRUD and tree: use `GET/POST /api/projects`, `GET/PUT /api/projects/{id}/tree`; wire project list/create and load/save tree.

---

## Quick Reference

- **Backend base URL:** `http://localhost:8000` (API under `/api`)
- **Frontend dev:** `cd frontend && npm run dev` (e.g. `http://localhost:3000`)
- **API docs:** `http://localhost:8000/api/docs`
- **Backend:** Projects own audio/jobs; upload: `POST /api/projects/{project_id}/audio`; create job: `POST /api/projects/{project_id}/jobs`. See `backend/BACKEND_PROJECTS_UPDATE.md`.
