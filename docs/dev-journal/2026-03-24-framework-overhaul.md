# 2026-03-24 — Backend Framework Overhaul

## Context

The codebase had working stem separation and MIDI transcription but no architectural discipline. ML models were imported directly in service and task code. Artifacts were recorded as raw JSON paths in `job.output`. There were no capability contracts, no provider registry, and no AI agent guidance.

The risk: every model swap requires refactoring business logic. Confidence data is lost. The LLM agent has no structured way to reason about what was produced.

## Decisions Made

### 1. Capability-first design

Every music processing operation is now a named capability with a typed `InputSchema` and `OutputSchema`. Capabilities live in `backend/app/capabilities/`. The contract is separated from the implementation.

**Why:** Capabilities can exist as stubs (defined but no provider) before a model is available. This allows API contracts and agent tools to be written before models are ready.

### 2. Provider abstraction layer

All ML model code moves into `backend/app/providers/{capability}/{model}.py`. Each provider extends `BaseProvider[InputT, OutputT]`. Only providers import model-specific libraries.

**Why:** Demucs will be replaced. BasicPitch will be replaced. The business logic must not know or care.

Swapping a model now means:
1. Add a new provider file
2. Register it in `ProviderRegistry`
3. Update `DEFAULT_PROVIDERS` in constants

Nothing else changes.

### 3. Artifacts as first-class DB entities

The `Artifact` table was empty. We wrote the full `Artifact` model with:
- `type` (enum: audio_file, stem_audio, midi_file, note_events, chord_map, etc.)
- `producing_job_id` (which job made this)
- `parent_artifact_id` (lineage: what was the input)
- `metadata` JSON: confidence, model info, type-specific fields

**Why:** The LLM agent needs to query what artifacts exist for a project and what their quality is. Job output as raw paths is opaque.

### 4. Job dispatcher pattern

`JobDispatcher` is the single routing point. It resolves capability → provider via `ProviderRegistry`, then calls the appropriate handler. Job handlers don't import model code.

**Why:** Prevents job tasks from becoming a tightly-coupled spaghetti of if/elif chains with direct model imports (which is what `job_tasks.py` was becoming).

### 5. Confidence metadata is required

Every `BaseCapabilityOutput` requires a `confidence: float`. Providers must supply it, even if via a heuristic. This propagates into artifact metadata.

**Why:** MIDI transcription is probabilistic. Chord analysis will be probabilistic. The agent cannot make trustworthy musical statements without knowing whether to trust the data.

## Files Created

- `docs/PRODUCT_VISION.md`
- `docs/ARCHITECTURE.md`
- `docs/CAPABILITIES.md`
- `docs/SCHEMAS.md`
- `docs/WORKFLOWS.md`
- `docs/TECH_DEBT.md`
- `docs/DEV_PROCESS.md`
- `.cursor/rules/` — 5 rule files for AI agents
- `AGENTS.md` — Codex entry point
- `backend/app/capabilities/` — base, stems, midi, chords, registry
- `backend/app/providers/` — base, registry, stems/demucs, midi/basic_pitch
- `backend/app/artifacts/` — schemas, service
- `backend/app/jobs/` — dispatcher, handlers (stem_separation, midi_transcription)
- Updated `Artifact` DB model (was empty)
- Updated `constants.py` with `DEFAULT_PROVIDERS`

## What Was NOT Done (Yet)

- The old `PipelineRunnerService` and `AudioJobWorker` are not deleted yet. They still work.
  Delete them once the new job handler path is validated end-to-end.
- The old `job_tasks.py` Celery task is not updated to use `JobDispatcher` yet.
  Update it to call `JobDispatcher(db).dispatch(job_id)` and remove the if/elif routing.
- DB migration for the new `Artifact` table schema has not been written.

## Next Steps (Priority Order)

1. **[blocking]** Write Alembic migration for `Artifact` table
2. **[blocking]** Update Celery `process_audio_job` to call `JobDispatcher`
3. **[blocking]** Validate end-to-end: upload → job → DemucsProvider → ArtifactRecord
4. **[important]** Add integration tests for both handlers
5. **[important]** Delete `audio_job_worker.py` (legacy polling worker)
6. **[important]** Delete raw Demucs import from `pipeline_runner_service.py` once handler path works
