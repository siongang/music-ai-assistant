# Architecture

> Last updated: 2026-03-25
> See `docs/dev-journal/` for decision history.

## System Overview

```
User / Frontend
      │ HTTP
      ▼
FastAPI API Layer
      │
      ├── Agent Layer
      │
      └── Job Creation / Query
              │
              ▼
        Celery Task Queue
              │
              ▼
        Job Dispatcher
              │
              ▼
   Capability Registry + Provider Registry
              │
              ▼
          Provider
              │
              ▼
    Artifact Store + Database
```

The product is backend-first. The important architectural property is that model-specific
code is isolated behind providers, while the rest of the system works in terms of
capabilities, jobs, and artifacts.

## Core Concepts

### Capabilities

A **capability** is a named contract for a music-processing operation. It is not a model.

- Examples: `stem_separation`, `midi_transcription`, `chord_analysis`
- Defined in `backend/app/capabilities/`
- Has typed `InputSchema` and `OutputSchema`
- May have zero, one, or many providers

Capabilities are the stable boundary that the API, jobs, and agent tools reason about.

### Providers

A **provider** is a concrete model adapter implementing one capability.

- Defined in `backend/app/providers/<capability>/`
- Implements `BaseProvider[InputSchema, OutputSchema]`
- Registered by `provider_key`
- Selected explicitly or via `DEFAULT_PROVIDERS`

Providers are the only layer allowed to import model libraries such as Demucs, Basic Pitch,
Torch, TensorFlow-backed libraries, or similar ML dependencies.

### Jobs

A **job** is an asynchronous request to execute a capability against an input artifact.

- Created by API endpoints or agent tools
- Executed by Celery workers
- Dispatched through `backend/app/jobs/dispatcher.py`
- Routed to a handler based on capability
- Produces output artifact IDs on success

Jobs are capability-backed, not model-backed. Swapping a model should not require changing
the API layer or job orchestration code.

### Artifacts

An **artifact** is the canonical pipeline data entity.

- Source audio uploads create `audio_file` artifacts
- Model outputs create typed artifacts such as `stem_audio`, `midi_file`, `note_events`
- Artifacts carry lineage via `parent_artifact_id`
- Artifacts carry model metadata and optional confidence data in JSON metadata

Artifacts are the source of truth for pipeline inputs and outputs.

## Canonical Audio Policy

The canonical processing input is WAV.

- Uploaded audio may be MP3, WAV, FLAC, etc.
- Upload flow converts input to a normalized WAV file
- Source `audio_file` artifacts point to the canonical WAV path when available
- Providers should process the canonical WAV artifact path

The original uploaded file may still be retained for download or UX purposes, but it should
not be treated as the primary execution input.

## Layer Rules

| Layer | May import | Must not import |
|---|---|---|
| API endpoints | Services, schemas | Providers, model libraries |
| Services | DB models, artifact/job helpers, storage helpers | Providers, model libraries |
| Job handlers | Providers via registry, services, artifacts | Model libraries directly |
| Providers | Model libraries, capability schemas | Services, DB models |
| Agent tools | Services, schemas, task enqueueing | Providers, model libraries |

This one-directional dependency rule is the most important architectural constraint.

## Runtime Flow

### Upload flow

1. User uploads audio through a project-scoped endpoint
2. Backend stores the original file
3. Backend converts it to canonical WAV
4. Backend writes a source `AUDIO_FILE` artifact for lineage and media metadata

### Processing flow

1. Client creates a job for a capability
2. API resolves or validates the input artifact
3. Celery worker receives the job
4. `JobDispatcher` resolves the provider
5. Handler constructs provider input and output directory
6. Provider runs the model
7. Handler writes output artifacts and updates the job

## Confidence Policy

Confidence is optional.

- If a model exposes a meaningful score, store it
- If a heuristic is used, it must be documented as heuristic
- If no trustworthy confidence exists, store `null`

The system must never fabricate certainty just to satisfy a schema.

Agent and API consumers should interpret missing confidence as "no reliability score was
provided by the model."

## API Shape

The public API is artifact-first.

Current direction:
- uploads return `artifact_id` as the primary processing handle
- jobs are created by capability
- jobs execute from `input_artifact_id`
- artifact and capability/provider discovery endpoints are first-class

## What Changes When You Swap a Model

Only these steps should be required:

1. Add a provider file under `backend/app/providers/{capability}/`
2. Register the provider
3. Update `DEFAULT_PROVIDERS` if you want it to become default

The API, job dispatcher, handlers, and frontend contracts should remain unchanged.

## Architecture Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-03-24 | Provider abstraction layer | Model swaps must not affect orchestration |
| 2026-03-24 | Artifacts as first-class pipeline entities | Enables lineage, reuse, and agent visibility |
| 2026-03-24 | Capabilities separate from providers | Keeps contracts stable while models evolve |
| 2026-03-24 | Confidence optional | Some models expose no trustworthy score |
| 2026-03-24 | Canonical processing input is WAV | Keeps provider behavior predictable |
