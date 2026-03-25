# Frontend API Migration

This document defines the frontend and client migration target for the artifact-first backend.

New client work should target the contracts below. Do not assume `audio_id` job inputs remain
supported unless a specific compatibility endpoint is documented in code.

---

## Core Direction

The migration is complete in the backend:

- artifacts are the primary processing reference
- `input_artifact_id` is the job-creation handle
- artifact responses are the source of truth for downloadable files and metadata

In practical terms:

- upload returns `artifact_id`
- job creation should prefer `input_artifact_id`
- job results should be read through artifact IDs
- capability and provider availability should be discovered from the API

---

## Endpoints To Use

### 1. Upload audio

`POST /api/projects/{project_id}/artifacts/source-audio`

Use this to create the canonical source artifact in one step.

Important response fields:

- `artifact_id`: use for processing, waveform requests, and downloads
- `format`, `duration`, `sample_rate`, `channels`: display metadata

### 2. Create jobs

`POST /api/projects/{project_id}/jobs`

Preferred request shape:

```json
{
  "capability": "stem_separation",
  "input": {
    "input_artifact_id": "uuid"
  },
  "params": {
    "provider_key": "demucs_htdemucs"
  }
}
```

### 3. Discover capabilities and providers

- `GET /api/capabilities`
- `GET /api/capabilities/{capability_name}/providers`

Use these endpoints instead of hardcoding model assumptions in the frontend.

`GET /api/capabilities` now exposes:

- capability status
- default provider
- registered providers
- accepted job params for each capability

### 4. Read artifacts

- `GET /api/projects/{project_id}/artifacts`
- `GET /api/projects/{project_id}/artifacts/{artifact_id}`

Use artifact endpoints to render model outputs, lineage, and downloadable outputs.

---

## Field-Level Migration

### Job responses

Frontend should rely on:

- `capability`
- `provider_key`
- `status`
- `input.input_artifact_id`
- `output.artifact_ids`

Frontend should stop assuming raw output file paths in job responses.

### Artifact responses

Artifact responses now provide:

- `id`
- `type`
- `parent_artifact_id` for lineage
- `metadata` for confidence/model information
- `download_url` for file retrieval

---

## Migration Order

Recommended frontend/client migration order:

1. Switch upload handling to store `artifact_id`
2. Use `input_artifact_id` for all new job creation
3. Render job outputs through artifact lookups instead of path assumptions
4. Use capability discovery endpoints for provider/model UI

---

## Compatibility Policy

Current policy:

- `type` remains accepted as an alias for `capability`
- `input_artifact_id` is the supported job input handle
- provider-specific model knowledge should not leak into frontend routing logic

Long-term direction:

- jobs remain fully artifact-first
- clients reason about capabilities and artifacts, not model-specific pipelines
