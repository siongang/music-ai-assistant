# Development Process

This document defines the backend development workflow for this repository.

---

## Before Writing Backend Code

1. Read:
   - `docs/ARCHITECTURE.md`
   - `docs/CAPABILITIES.md`
   - `docs/TECH_DEBT.md`
2. State a short plan for multi-file work
3. Identify the layer you are changing
4. Check that the change respects the layer rules

For architectural changes, add a journal entry under `docs/dev-journal/`.

---

## Layer Discipline

The core rule is:

```
API → Services / Job Creation → Job Handlers → Providers
```

Additional rules:

- Only providers may import model libraries
- Job handlers may coordinate provider execution and artifact creation
- Services may support API, storage, DB, and compatibility concerns
- Agent tools must stay job-backed

If a change makes model selection leak into API endpoints, services, or agent logic, the
change is probably wrong.

---

## Adding a New Capability

1. Add capability schemas in `backend/app/capabilities/{name}.py`
2. Register capability metadata in `backend/app/capabilities/registry.py`
3. Implement one or more providers in `backend/app/providers/{name}/`
4. Register providers in `backend/app/providers/registry.py`
5. Add a handler in `backend/app/jobs/handlers/{name}.py`
6. Update docs:
   - `docs/CAPABILITIES.md`
   - `docs/WORKFLOWS.md`
7. Add integration tests

---

## Adding or Swapping a Provider

1. Create the provider implementation
2. Register a new `provider_key`
3. Optionally update `DEFAULT_PROVIDERS`
4. Do not change API contracts unless the capability contract itself changed

That is the primary maintainability goal of this architecture.

---

## Artifact Rules

Every produced file must have an artifact record.

Required considerations:

- correct `project_id`
- correct `producing_job_id`
- correct `parent_artifact_id`
- model metadata when model output produced it
- confidence only when real or explicitly heuristic

Do not store raw output paths as the primary job result.

---

## Code Review Checklist

- Are model libraries imported only from `backend/app/providers/`?
- Does the API stay capability-based rather than model-specific?
- Are outputs persisted as artifacts with lineage?
- Does the worker path go through `JobDispatcher`?
- Are docs updated if contracts changed?
- Is the agent layer still aligned with the backend architecture?

---

## Testing Expectations

At minimum for backend architecture changes:

- compile/import sanity
- integration coverage for upload → job → artifact flow
- coverage for artifact-scoped uploads, downloads, and waveform generation when those contracts change

---

## Documentation Expectations

Update docs whenever you change:

- public API shapes
- capability or provider availability
- artifact/job contracts
- architecture decisions
- known debt or migration state
