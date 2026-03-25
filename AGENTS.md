# Agent Instructions

This file is the entry point for AI coding agents (Codex, Cursor, etc.) working in this repository.  
Read this entirely before writing any code.

---

## What This Project Is

A music understanding platform. Musicians upload audio. The backend applies ML models to produce:
- Separated stems (vocals, drums, bass, other)
- MIDI transcriptions
- Chord progressions (future)
- Sheet music (future)

The frontend is intentionally parked. **The backend is the product.**

---

## Required Reading Before Coding

Always read these before touching backend code:

1. `docs/ARCHITECTURE.md` — system design, layer rules, core concepts
2. `docs/CAPABILITIES.md` — what capabilities exist, their status, and their contracts
3. `docs/TECH_DEBT.md` — what is broken; don't introduce more of the same
4. `docs/DEV_PROCESS.md` — the workflow every agent must follow

---

## The Most Important Rule

**ML model libraries may only be imported inside `backend/app/providers/`.**

If you are about to write `import demucs`, `import basic_pitch`, `import torch` etc. anywhere
outside a file in `backend/app/providers/`, stop and reconsider.

The architecture is:
```
API  →  Services  →  Job Handlers  →  Provider Registry  →  Providers
                                                                 ↑
                                                     (only here: model libs)
```

---

## How to Add a New ML Capability

1. Define schemas in `backend/app/capabilities/{name}.py` (InputSchema, OutputSchema)
2. Implement provider in `backend/app/providers/{name}/{model}.py`
3. Register it in `backend/app/providers/registry.py`
4. Add a job handler in `backend/app/jobs/handlers/{name}.py`
5. Update `docs/CAPABILITIES.md`

## How to Swap a Model

1. Create a new provider in `backend/app/providers/{capability}/{new_model}.py`
2. Register it with a new `provider_key`
3. Update `DEFAULT_PROVIDERS` in `backend/app/core/constants.py`
4. Nothing else changes — that is the point of this architecture.

---

## Artifact Rules

Every file a job produces must be an `ArtifactRecord` in the DB. This is not optional.  
Artifacts must include:
- `parent_artifact_id` (lineage)
- `confidence` in metadata when the provider emits one or a documented heuristic exists
- `model_metadata` (what model ran, what version, what params)

Never store just a file path in `job.output`. Store artifact IDs.

---

## Agent Tool Rules

LLM agent tools (`backend/app/agent/tools/`) must:
- Call services only — not providers, not model libs
- Never run ML inference inline
- Check artifact confidence before making definitive statements to users when confidence exists
- Return `{"status": "unavailable"}` for unregistered capabilities — never fabricate analysis

---

## Current Priority

The immediate focus is hardening the artifact-first, provider-based backend and keeping API,
agent, and compatibility layers aligned.
See `docs/TECH_DEBT.md` for the `[blocking]` items.

Do not work on:
- Frontend
- Sheet music (no reliable pipeline)
- Chord analysis (no provider registered)
- Auth / multi-user

---

## Planning Before Coding

For any change touching more than 2 files:
1. Write a 2–3 sentence plan
2. Identify which layer(s) are involved
3. Confirm it does not violate the layer rules above
4. Then write code

For architectural changes: write a dev journal entry in `docs/dev-journal/YYYY-MM-DD-{slug}.md`.
