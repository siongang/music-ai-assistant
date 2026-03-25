# 2026-03-25 — Architecture Hardening

## Context

After the provider/artifact redesign, the backend still needed operational hardening:

- docs were partially aspirational
- no migration framework existed
- no integration test harness existed for the artifact-first path
- the `Artifact` ORM model still had runtime issues

## Decisions

1. Rewrote the core architecture docs so they describe the current backend rather than a target sketch.
2. Added first-class migration scaffolding with Alembic configuration and an initial artifacts-table migration.
3. Added a backend integration-test harness intended to verify upload → source artifact → job → output artifact flow without loading real ML models.
4. Fixed the `Artifact` ORM mapping to avoid SQLAlchemy's reserved `metadata` attribute name.

## Notes

- `pytest` is not installed in the current environment, so the new test suite could be compiled but not executed here.
- Manual runtime probing showed the main app import path is still heavier than ideal; that should be revisited when hardening startup/runtime costs.

## Result

The backend now has:

- cleaner architecture docs
- a migration path scaffold
- a real test harness shape
- a working artifact model definition

The next high-value work remains:

1. run and stabilize the integration tests in an environment with `pytest`
2. validate and extend migrations
3. continue reducing compatibility-layer ambiguity between `Audio` and `Artifact`
