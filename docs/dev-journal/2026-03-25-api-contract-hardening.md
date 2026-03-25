# 2026-03-25 API Contract Hardening

## Context

The backend runtime had been migrated onto the capability/provider/artifact architecture, but
three product-facing gaps still remained:

- job params were not validated per capability
- the `Audio` to source-artifact bridge was still path-based in places
- frontend/client migration targets were spread across code and docs rather than made explicit

## Decisions

### 1. Validate job params at the API boundary

Each available capability now defines a dedicated API-level job param schema.

This is intentionally separate from runtime input schemas:

- runtime schemas still include execution fields like `audio_path` and `output_dir`
- API job param schemas only describe client-supplied knobs

This keeps the public contract strict without leaking handler/provider execution details into
client requests.

### 2. Make the `Audio` to `Artifact` boundary explicit

Source `audio_file` artifacts now store `source_audio_id`.

That means:

- `Audio` remains the compatibility-facing upload/session/UI record
- `Artifact` remains the canonical execution and lineage record
- the bridge between them is now an explicit identity link, not just a path lookup

Path fallback remains for transitional safety, but identity is now the primary resolution path.

### 3. Make frontend migration discoverable

Capability discovery now exposes accepted job params, and the repository has a dedicated
frontend migration document describing the target contracts.

This matters because the backend is now modular enough that clients should no longer hardcode
provider/model assumptions.

## Validation Performed

- `backend/venv/bin/alembic upgrade head`
- `python -m compileall backend/app backend/tests alembic`
- `backend/venv/bin/python -m pytest -q backend`

## Result

The backend contracts are now more explicit and professionally enforceable:

- invalid capability params fail at job creation time
- `Audio` and `Artifact` have a clearer division of responsibility
- clients have a defined migration target for artifact-first processing
