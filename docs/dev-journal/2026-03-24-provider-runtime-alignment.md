# 2026-03-24 — Provider Runtime Alignment

## Context

The provider/capability architecture existed in parallel with a legacy runtime path.
Public job endpoints and agent tools still enqueued the old Celery workflow, source
audio uploads did not create artifacts, and confidence had been documented as
mandatory even though some models do not expose trustworthy confidence scores.

## Decisions

1. The backend now has one execution path: API/tool job creation → Celery task →
   `JobDispatcher` → capability handler → provider.
2. Jobs are artifact-based. Uploading audio creates a source `AUDIO_FILE` artifact,
   and downstream jobs reference `input_artifact_id` for lineage.
3. Confidence is optional. Providers should emit it when the model supplies a real
   score or when a heuristic is defensible and documented. Otherwise store `null`.
4. Providers receive output directories from handlers so storage layout remains a
   backend concern and model adapters stay swappable.
5. The legacy model-specific runtime path was removed to enforce the layer rule that
   model libraries only exist under `backend/app/providers/`.

## Result

Adding or swapping a model now means:

1. Add a provider file under `backend/app/providers/{capability}/`
2. Register it in `backend/app/providers/registry.py`
3. Optionally change `DEFAULT_PROVIDERS`

API routes, Celery, job handlers, and storage contracts do not need model-specific
changes for that swap.
