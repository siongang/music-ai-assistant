"""
API router configuration.

Projects own artifacts and jobs. Artifact upload/read/download and job orchestration are under
/projects/{project_id}/artifacts and /projects/{project_id}/jobs.
"""
from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.endpoints.projects import router as projects_router
from app.api.endpoints.project_jobs import router as project_jobs_router
from app.api.endpoints.project_artifacts import router as project_artifacts_router
from app.api.endpoints.audio import router as audio_router
from app.api.endpoints.capabilities import router as capabilities_router
from app.api.endpoints.chat import router as chat_router
from app.api.endpoints.waveform import router as waveform_router
from app.api.endpoints.sessions import router as sessions_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(projects_router)
api_router.include_router(project_artifacts_router, prefix="/projects/{project_id}/artifacts")
api_router.include_router(waveform_router, prefix="/projects/{project_id}/artifacts")
api_router.include_router(sessions_router, prefix="/projects/{project_id}/sessions")
api_router.include_router(project_jobs_router, prefix="/projects/{project_id}/jobs")
api_router.include_router(capabilities_router)
api_router.include_router(audio_router)  # GET /api/audio/files/{path} for job outputs
api_router.include_router(chat_router)
