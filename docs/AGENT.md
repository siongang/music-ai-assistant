# Agent Framework Documentation

**Audience:** backend developers extending the agent layer  
**Purpose:** explain how the agent integrates with the backend architecture  
**Status:** aligned with the current provider/job/artifact architecture

---

## Overview

The agent layer is a thin orchestration layer on top of the regular backend.

It should:

- interpret user requests
- choose tools
- create capability-backed jobs
- check job status
- explain results conservatively

It should not:

- run ML inference directly
- bypass the job system
- invent confidence or analysis not supported by backend data

---

## Position in the System

```
Chat API
   │
   ▼
AgentExecutor
   │
   ├── SessionService
   ├── ToolRegistry
   └── LLMClient
          │
          ▼
   Agent tools
          │
          ▼
   Regular backend APIs / services / jobs
```

The agent is not a separate processing stack. It is a client of the backend architecture.

---

## Core Components

### `AgentExecutor`

Location: `backend/app/agent/executor.py`

Responsibilities:

- run the conversational loop
- supply tool schemas to the LLM
- execute tool calls
- preserve session history

### `SessionService`

Location: `backend/app/agent/session_service.py`

Responsibilities:

- manage conversation sessions
- store step history
- track primary source artifact context for the session
- retain supporting metadata such as `project_id` and filename

### `ToolRegistry`

Location: `backend/app/agent/tools/registry.py`

Responsibilities:

- register tools
- expose tool schemas
- validate and execute tool calls

### Agent Tools

Current tools are job-backed wrappers around backend capabilities such as:

- stem separation
- MIDI transcription
- job status lookup

Tools should align with the same contracts as public backend APIs.

---

## Rules for Agent Tools

1. Tools must create or inspect jobs, not call providers directly.
2. Tools must use backend services and public contracts.
3. Tools must report unavailable capabilities honestly.
4. Tools must not fabricate reliability information.
5. Tools should prefer artifact-backed flows internally.

---

## Artifact Context

Chat sessions currently retain a primary source artifact reference for UX convenience.

That context may include:

- `artifact_id`
- `project_id`
- filename

This exists to make conversational usage practical while keeping the agent aligned with the
artifact-first backend contract.

---

## Extending the Agent

When adding a new tool:

1. Confirm the backend capability exists
2. Confirm the capability is job-backed
3. Implement the tool using services and task enqueueing
4. Return stable structured outputs
5. Update this document only if the tool changes framework behavior

---

## Operational Guidance

- Prefer simplicity over clever prompting
- Let the backend remain the source of truth
- Treat the agent as orchestration, not business logic
- If backend contracts change, update the agent layer promptly
