# Processing Workflows

This document describes the intended end-to-end flows for the current backend.

---

## Workflow 1: Upload Audio

```
Client uploads audio
      │
      ▼
POST /projects/{id}/artifacts/source-audio
      │
      ├── save original file
      ├── convert to canonical WAV
      └── create source Artifact(type=audio_file, media metadata attached)
```

Outputs:

- `artifact_id` for all downstream processing flows

---

## Workflow 2: Stem Separation

```
Client creates job
POST /projects/{id}/jobs
{ capability: "stem_separation", input: { input_artifact_id: source_id }, params: { ...validated per capability } }
      │
      ▼
Celery task
      │
      ▼
JobDispatcher
      │
      ▼
ProviderRegistry resolves default or requested provider
      │
      ▼
stem_separation handler
      │
      ▼
Demucs provider
      │
      ▼
Create stem_audio artifacts
      │
      ▼
Job output = artifact IDs
```

---

## Workflow 3: MIDI Transcription

```
Client creates job
POST /projects/{id}/jobs
{ capability: "midi_transcription", input: { input_artifact_id: artifact_id }, params: { ...validated per capability } }
      │
      ▼
Celery task
      │
      ▼
JobDispatcher
      │
      ▼
midi_transcription handler
      │
      ▼
Basic Pitch provider
      │
      ▼
Create midi_file + note_events artifacts
      │
      ▼
Job output = artifact IDs
```

Notes:

- Running on isolated stems is usually better than running on a full mix
- Per-note confidence should be preserved in note-event output data

---

## Workflow 4: Agent-Initiated Processing

```
User talks to chat endpoint
      │
      ▼
Agent session holds primary uploaded-source context
      │
      ▼
Agent tool creates capability-backed job from input_artifact_id
      │
      ▼
Regular job system executes it
```

Rules:

- Agent tools must not call providers directly
- Agent tools should return job IDs immediately
- Agent tools should report unavailable capabilities honestly
- Agent tools should not invent confidence when the backend does not provide it

---

## Artifact Reuse

Artifact reuse and deduplication are desirable but not fully implemented yet.

Planned matching dimensions:

- `parent_artifact_id`
- `capability`
- `provider_key`
- normalized `params`
