"""
FastAPI application entry point.

This module creates and configures the FastAPI application instance.
"""
from fastapi import FastAPI

from app.api.router import api_router
from app.db.base import Base
from app.db.session import engine


# Create database tables on startup if they don't exist
# This is convenient for development. In production, use Alembic migrations instead.
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    # Log but don't fail startup - tables might already exist or DB might not be ready yet
    import logging
    logging.warning(f"Could not create tables on startup: {e}")

# Create FastAPI application instance
app = FastAPI(
    title="Music Assistant API",
    description="API for audio processing and stem separation",
    version="1.0.0",
    docs_url="/api/docs",  # Swagger UI at /api/docs
    redoc_url="/api/redoc"  # ReDoc at /api/redoc
)

# Include API routers
app.include_router(api_router, prefix="/api")
