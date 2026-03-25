# 2026-03-25 Artifact-First Audio Cutover

## Context

The backend had already become artifact-first for processing, but the `audio` table still owned
file paths and media metadata. That left the system with two competing sources of truth:

- `Audio` rows
- source `audio_file` artifacts

That duplication was the wrong long-term shape and a silent-divergence risk.

## Decisions

### 1. `Artifact` owns media state

Source `audio_file` artifacts now own:

- canonical storage path
- original uploaded storage path
- duration
- sample rate
- channel count

This makes artifacts the sole execution and media-truth record.

### 2. `Audio` becomes a thin compatibility alias

The `audio` table is now reduced to:

- `id`
- `project_id`
- `filename`
- `original_format`
- `created_at`

It remains useful as an external upload/session/frontend alias while clients migrate, but it no
longer owns paths or media metadata.

### 3. Reads and downloads resolve through artifacts

Project audio metadata, project audio download, waveform generation, and agent upload/session
context now resolve through the source artifact instead of `Audio` path columns.

### 4. Agent tooling prefers artifact IDs

Agent tools now accept `input_artifact_id` directly and treat `audio_id` as a compatibility
fallback. Session context stores the primary artifact reference so the agent prompt can prefer
artifact-backed tool calls.

## Validation Performed

- `backend/venv/bin/alembic upgrade head`
- `python -m compileall backend/app backend/tests alembic`
- `backend/venv/bin/python -m pytest -q backend`

## Result

The backend is now materially closer to the intended architecture:

- artifacts are the authoritative record for media files and metadata
- `Audio` is no longer a second owner of pipeline state
- downloads and waveform generation still work through artifact-backed resolution
- agent tooling and API responses point clients toward artifact-first usage
