# Tech Debt and Known Issues

Tags:

- `[blocking]` must be fixed before calling the backend stable
- `[important]` should be fixed in the next cycle
- `[low]` is real but not urgent

---

## Architecture Debt

### [important] Database migrations need expansion beyond the initial artifact rollout

Alembic scaffolding exists and the initial artifact migration is now validated locally, but the
backend still needs a fuller migration story for future schema changes and existing environments.

**Fix:** continue building first-class migrations as the artifact-first backend evolves.

### [important] Capability discovery still needs richer client-facing schema metadata

Jobs now validate capability params at API creation time, and capability discovery exposes the
accepted param names and basic JSON types. What still remains is richer metadata such as enums,
value ranges, and better per-field descriptions for more dynamic clients.

**Fix:** expand capability discovery from "accepted params" into a fuller client-consumable contract.

### [important] Frontend and non-agent clients still need API migration work

The backend is now artifact-first, but client code may still assume older upload or job request
shapes.

**Fix:** document and execute the frontend/API consumer migration.

---

## Model Reliability Debt

### [important] MIDI reliability presentation still needs product policy

Per-note confidence is available, but the product-level policy for how the frontend and agent
should present uncertain MIDI output is not yet fully defined.

**Fix:** define UI and agent behavior for low-confidence transcription outputs.

### [low] Stem confidence remains heuristic when present

Demucs does not expose a true confidence score.

**Fix:** either keep it null by default or clearly document any heuristic used.

---

## Infrastructure Debt

### [important] Integration coverage is still thin

The new architecture needs end-to-end tests for the real path:

- upload
- source artifact creation
- job creation
- worker dispatch
- output artifact persistence
- capability/provider discovery

The current suite now runs locally and covers the core path, but the overall breadth is still
narrow for a backend that is becoming the primary product surface.

### [low] SQLite default is still permissive

Good enough for local development, risky as an accidental production default.

### [low] Artifact retention and cleanup are not defined

Artifacts accumulate indefinitely without lifecycle management.
