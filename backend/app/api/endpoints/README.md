# API Endpoints

Endpoints are organized by resource. **Projects own audio and jobs**; create/list/get for audio and jobs are under `/api/projects/{project_id}/...`.

## Routers

| Module | Prefix / Path | Purpose |
|--------|----------------|---------|
| **projects** | `/api/projects` | Project CRUD, GET/PUT `/api/projects/{id}/tree` |
| **project_audio** | `/api/projects/{project_id}/audio` | Upload, list, get metadata, download (project-scoped) |
| **project_jobs** | `/api/projects/{project_id}/jobs` | Create job, list jobs, get job (project-scoped) |
| **audio** | `/api/audio` | `GET /api/audio/files/{path}` only (job outputs by path) |
| **chat** | `/api/chat` | Sessions, message, history (LLM agent) |

## Design

- **Dependency injection**: Services per request (FastAPI).
- **Errors**: `HTTPException` with appropriate status codes.
- **Validation**: File extensions/sizes for uploads; project existence and ownership for project-scoped routes.

See [BACKEND_PROJECTS_UPDATE.md](../../../BACKEND_PROJECTS_UPDATE.md) for full route list and schema.
