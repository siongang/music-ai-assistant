# Data Schemas and Contracts

This document describes the important backend contracts at the system level.

- Capability runtime schemas live in `backend/app/capabilities/`
- Artifact metadata schemas live in `backend/app/artifacts/schemas.py`
- API schemas live in `backend/app/schemas/`

This file is intentionally conceptual. For exact field names, check the code.

---

## Artifact

Artifacts are the canonical pipeline data entities.

```python
class ArtifactRecord(BaseModel):
    id: UUID
    type: str
    project_id: UUID
    producing_job_id: UUID | None
    parent_artifact_id: UUID | None
    storage_path: str
    file_size_bytes: int | None
    metadata: ArtifactMetadata
    created_at: datetime
```

```python
class ArtifactMetadata(BaseModel):
    confidence: float | None
    model_provider_key: str | None
    model_name: str | None
    model_version: str | None
    model_params: dict[str, Any]
    processing_time_seconds: float | None
    duration_seconds: float | None
    sample_rate: int | None
    channels: int | None
    stem_name: str | None
    extra: dict[str, Any]
```

Important rules:

- Source uploads should create `audio_file` artifacts
- Derived outputs must set `parent_artifact_id`
- `storage_path` is always relative to storage root
- Confidence may be `null`

---

## Job

Jobs are capability-backed async requests.

```python
class JobRecord(BaseModel):
    id: UUID
    project_id: UUID
    capability: str
    status: str
    input: dict
    params: dict | None
    output: dict | None
    progress: float | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
```

Operational meaning:

- `input` should contain `input_artifact_id`
- `params` are validated per capability at API creation time
- `output` should contain produced artifact IDs, not raw file paths

---

## Capability Discovery

The API exposes capability/provider discovery so clients can understand the current backend
without hardcoding model assumptions.

```json
GET /api/capabilities
[
  {
    "name": "stem_separation",
    "display_name": "Stem Separation",
    "status": "available",
    "default_provider_key": "demucs_htdemucs",
    "registered_provider_keys": ["demucs_htdemucs"],
    "accepted_job_params": [
      {
        "name": "provider_key",
        "json_type": "string",
        "required": false
      }
    ]
  }
]
```

```json
GET /api/capabilities/stem_separation/providers
[
  {
    "provider_key": "demucs_htdemucs",
    "capability": "stem_separation",
    "is_default": true,
    "is_available": true
  }
]
```

---

## Primary API Contracts

### Upload Audio

```json
POST /api/projects/{project_id}/artifacts/source-audio

{
  "artifact_id": "uuid",
  "filename": "song.mp3",
  "project_id": "uuid"
}
```

### Create Job

Preferred request:

```json
POST /api/projects/{project_id}/jobs
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

Response:

```json
{
  "job_id": "uuid",
  "capability": "stem_separation",
  "provider_key": "demucs_htdemucs",
  "status": "queued"
}
```

### Read Artifact

```json
GET /api/projects/{project_id}/artifacts/{artifact_id}
{
  "id": "uuid",
  "type": "stem_audio",
  "project_id": "uuid",
  "parent_artifact_id": "uuid",
  "storage_path": "jobs/.../stems/file.mp3",
  "download_url": "/api/projects/{project_id}/artifacts/{artifact_id}/download"
}
```

---

## Naming Rules

- Capability names are snake_case: `stem_separation`
- Provider keys are stable identifiers: `demucs_htdemucs`
- Artifact types are stable strings such as `audio_file`, `stem_audio`, `midi_file`
- Public API should prefer explicit names like `capability`, `provider_key`, `input_artifact_id`
