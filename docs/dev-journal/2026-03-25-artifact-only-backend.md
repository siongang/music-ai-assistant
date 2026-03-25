# 2026-03-25 Artifact-Only Backend

## Context

The backend had already become artifact-first for processing, but it still carried a live
compatibility contract around `Audio`:

- upload/read endpoints under `/projects/{project_id}/audio`
- `audio_id` compatibility in job creation and agent tools
- an `audio` table that no longer represented the real execution model

That was still more migration than architecture.

## Decisions

### 1. Artifacts are now the only live backend media contract

The backend now treats source `audio_file` artifacts as the only upload and processing handle.

- source upload endpoint: `POST /projects/{project_id}/artifacts/source-audio`
- job creation input: `input_artifact_id`
- waveform endpoint: artifact-scoped
- download flow: artifact-scoped

### 2. Remove the live `Audio` contract

The project-audio endpoint layer and audio-backed job compatibility path were removed from the
live API/router path.

The database migration also removes:

- the `audio` table
- the transitional `source_audio_id` field from `artifacts`

### 3. Agent state is artifact-backed

Chat upload/session state and tool prompts now carry the primary artifact id rather than a
primary audio id.

This aligns the agent layer with the actual backend execution model.

## Validation Performed

- `backend/venv/bin/alembic upgrade head`
- `python -m compileall backend/app backend/tests alembic`
- `backend/venv/bin/python -m pytest -q backend`

## Result

The backend is now meaningfully cleaner:

- artifacts are the sole backend truth for uploaded and generated media
- job orchestration is artifact-only
- uploads, downloads, and waveforms follow the same data model
- the repo no longer presents two competing backend contracts as active
