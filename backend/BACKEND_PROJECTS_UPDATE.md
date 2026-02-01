# Backend: Project-Owned Architecture

**Design rule:** Projects OWN audio and jobs. Audio and jobs cannot exist without a project. Execution context is explicit in the URL.

---

## Mental model

- **Models** (Demucs, BasicPitch) consume files.
- **Products** consume context.
- **Projects** are the execution context.

---

## API design

### Correct routes (project in URL)

| Method | Path | Description |
|--------|------|-------------|
| **Projects** | | |
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List projects |
| GET | `/api/projects/{id}` | Get project |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project (+ cascade: audio, jobs, storage) |
| GET | `/api/projects/{id}/tree` | Get object tree |
| PUT | `/api/projects/{id}/tree` | Set object tree |
| **Audio (project-scoped)** | | |
| POST | `/api/projects/{project_id}/audio` | Upload audio (multipart) |
| GET | `/api/projects/{project_id}/audio` | List audio for project |
| GET | `/api/projects/{project_id}/audio/{audio_id}` | Get audio metadata |
| GET | `/api/projects/{project_id}/audio/{audio_id}/download` | Download audio file |
| **Jobs (project-scoped)** | | |
| POST | `/api/projects/{project_id}/jobs` | Create job (body: type, input.audio_id, params) |
| GET | `/api/projects/{project_id}/jobs` | List jobs for project |
| GET | `/api/projects/{project_id}/jobs/{job_id}` | Get job |
| **Job outputs (by path)** | | |
| GET | `/api/audio/files/{path}` | Download file by path (e.g. jobs/{job_id}/stems/...) |

### Not used

- ~~POST /api/jobs~~ → use **POST /api/projects/{project_id}/jobs**
- ~~GET /api/jobs~~ → use **GET /api/projects/{project_id}/jobs**
- ~~POST /api/audio~~ → use **POST /api/projects/{project_id}/audio**
- ~~GET /api/audio?project_id=...~~ → use **GET /api/projects/{project_id}/audio**

---

## Database

- **projects** – id, name, tempo, key, time_signature, description, thumbnail, tree_snapshot, created_at, updated_at
- **audio** – id, **project_id (NOT NULL, FK → projects.id ON DELETE CASCADE)**, filename, file_path, created_at, updated_at
- **jobs** – id, **project_id (NOT NULL, FK → projects.id ON DELETE CASCADE)**, type, status, input, params, output, progress, error_message, created_at, updated_at

Deleting a project removes its audio and job rows (CASCADE) and their storage (handled in `ProjectService.delete_project`).

---

## Invariants

1. **Jobs mutate exactly one project** → project_id in the URL (POST /projects/{id}/jobs).
2. **Input audio must belong to the same project** → validated when creating a job.
3. **Agent tools** (separate_stems, convert_to_midi) get project_id from the audio record so jobs stay project-scoped.

---

## Migration

- **New install:** `Base.metadata.create_all()` creates tables with project_id NOT NULL and CASCADE.
- **Existing DB:**
  - **PostgreSQL:** `psql $DATABASE_URL -f migrate_projects.sql`
  - **SQLite:** `sqlite3 test.db < migrate_projects_sqlite.sql` (use the same DB file as in your `.env`). If a column already exists, ignore the error for that line.
  - Backfill or remove any rows with NULL project_id before setting the column NOT NULL if needed.
