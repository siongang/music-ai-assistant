"""
API router configuration.

This module aggregates all API endpoints into a single router.
"""
from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.endpoints.jobs import router as jobs_router

# Main API router that combines all endpoint routers
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health_router)
api_router.include_router(jobs_router)

