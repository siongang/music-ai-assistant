# 2026-03-25 Backend Validation Cleanup

## Context

The backend had already been migrated onto the capability/provider/artifact runtime path, but
the repository still had validation noise and incomplete confirmation of the new contracts.

Two issues were still distorting the real state of the backend:

- old manual smoke scripts under `backend/` were being collected as pytest tests
- documentation still described migration/test validation as more speculative than it now is

## Decisions

### 1. Manual smoke scripts remain manual

`backend/test_api.py` and `backend/test_chat.py` are developer-run smoke scripts, not automated
test modules. They are now marked so pytest does not collect them.

This keeps:

- manual local diagnostics available
- automated test output trustworthy

### 2. Expand integration coverage around the migration boundary

The integration suite now covers:

- upload creates a source artifact
- artifact-first job execution produces output artifacts
- backward-compatible `audio_id` job creation resolves to `input_artifact_id`
- capability/provider discovery endpoints expose the registered backend contract

This is the critical boundary for the current backend architecture because it validates both:

- the future-facing artifact-first API
- the compatibility layer needed while `Audio` still exists

## Validation Performed

- `python -m compileall backend/app backend/tests alembic`
- `backend/venv/bin/alembic upgrade head`
- `backend/venv/bin/python -m pytest -q backend`

## Result

The backend state is now cleaner and more trustworthy:

- worker/runtime path is capability/provider/artifact-backed
- migration scaffolding is validated locally
- automated tests no longer report false failures from manual scripts
- the repo has explicit coverage for the compatibility bridge from `audio_id` to artifacts

