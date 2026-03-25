# Tools Documentation

**Purpose**: guide to the agent tool layer  
**Audience**: backend developers extending agent capabilities  
**Status**: current artifact-first contract

---

## Overview

Agent tools are orchestration wrappers around backend services and job creation.

They must:

- create or inspect jobs
- operate on artifact-backed inputs
- avoid direct provider/model calls
- return structured results the LLM can reason about

The current tool layer is intentionally small:

- `separate_stems`
- `convert_to_midi`
- `get_job_status`

---

## Contract

The backend is artifact-first. For processing tools, the input is:

- `input_artifact_id`

The expected tool flow is:

1. validate `input_artifact_id`
2. create a capability-backed job
3. enqueue the job
4. return `job_id` and `status`

---

## Tool Architecture

Base class: `backend/app/agent/tools/base.py`

Each tool defines:

- `name`
- `description`
- `parameters`
- `returns`
- `execute(**kwargs)`

The registry validates tool inputs before execution and exposes tool schemas to the LLM.

---

## Available Tools

### `separate_stems`

Purpose:
- create a `stem_separation` job from a source artifact

Input schema:

```json
{
  "type": "object",
  "properties": {
    "input_artifact_id": {
      "type": "string",
      "description": "Source artifact UUID to process"
    }
  },
  "required": ["input_artifact_id"]
}
```

Result shape:

```json
{
  "job_id": "uuid",
  "status": "queued",
  "message": "Stem separation job created. Use get_job_status('...') to check progress."
}
```

Implementation notes:

- validates artifact existence through `ArtifactService`
- creates a `stem_separation` job with `input.input_artifact_id`
- never resolves through a legacy audio record

### `convert_to_midi`

Purpose:
- create a `midi_transcription` job from a source or derived artifact

Input schema:

```json
{
  "type": "object",
  "properties": {
    "input_artifact_id": {
      "type": "string",
      "description": "Source artifact UUID to convert"
    },
    "midi_tempo": {
      "type": "integer",
      "minimum": 30,
      "maximum": 300
    }
  },
  "required": ["input_artifact_id"]
}
```

Result shape:

```json
{
  "job_id": "uuid",
  "status": "queued",
  "message": "MIDI conversion job created. Use get_job_status('...') to check progress."
}
```

Implementation notes:

- validates artifact existence through `ArtifactService`
- writes `midi_tempo` into job params when supplied
- does not inspect provider internals directly

### `get_job_status`

Purpose:
- retrieve current status for a job

Input schema:

```json
{
  "type": "object",
  "properties": {
    "job_id": {
      "type": "string"
    }
  },
  "required": ["job_id"]
}
```

Result shape:

```json
{
  "job_id": "uuid",
  "capability": "stem_separation",
  "status": "running",
  "progress": 0.5,
  "output": {
    "artifact_ids": ["uuid"]
  }
}
```

---

## Execution Flow

Typical sequence:

1. user asks for a processing action
2. LLM selects a tool
3. tool input is validated
4. tool creates a job
5. worker executes through `JobDispatcher`
6. job output references produced artifact IDs
7. agent reports progress or completion back to the user

---

## Best Practices

- Prefer `input_artifact_id` in all tool contracts and examples.
- Keep tools thin. Coordination belongs in the tool; inference belongs in providers.
- Return `{"status": "unavailable"}` for unsupported capabilities instead of fabricating behavior.
- Do not invent confidence or reliability claims when the backend did not emit them.
- If a backend contract changes, update tool schemas and docs in the same pass.

---

## Testing Guidance

When changing tools:

- verify JSON Schema matches the real `execute()` signature
- verify jobs are created with `input_artifact_id`
- verify outputs reference artifact IDs, not raw paths
- verify unavailable capability behavior stays explicit
