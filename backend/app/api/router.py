"""
API router configuration.

Projects own audio and jobs. All create/list/get for audio and jobs are under
/projects/{project_id}/audio and /projects/{project_id}/jobs.
"""
from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.endpoints.projects import router as projects_router
from app.api.endpoints.project_audio import router as project_audio_router
from app.api.endpoints.project_jobs import router as project_jobs_router
from app.api.endpoints.audio import router as audio_router
from app.api.endpoints.chat import router as chat_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(projects_router)
api_router.include_router(project_audio_router, prefix="/projects/{project_id}/audio")
api_router.include_router(project_jobs_router, prefix="/projects/{project_id}/jobs")
api_router.include_router(audio_router)  # GET /api/audio/files/{path} for job outputs
api_router.include_router(chat_router)

