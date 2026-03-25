"""
FastAPI application entry point.

This module creates and configures the FastAPI application instance.
"""
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.router import api_router
from app.db.base import Base
from app.db.session import engine

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Import all models so they're registered with SQLAlchemy.
from app.models import Project, Session, AgentStep, Job, Artifact  # noqa: F401
from app.providers.registry import initialize_provider_registry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)


# Create database tables on startup if they don't exist
# This is convenient for development. In production, use Alembic migrations instead.
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    # Log but don't fail startup - tables might already exist or DB might not be ready yet
    logging.warning(f"Could not create tables on startup: {e}")

initialize_provider_registry()

# Create FastAPI application instance
app = FastAPI(
    title="Music Assistant API",
    description="API for audio processing and stem separation",
    version="1.0.0",
    docs_url="/api/docs",  # Swagger UI at /api/docs
    redoc_url="/api/redoc"  # ReDoc at /api/redoc
)

# CORS: allow frontend (e.g. Next.js on port 3000) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Root redirects to API info."""
    return {
        "message": "Music Assistant API",
        "docs": "/api/docs",
        "health": "/api/health",
    }


# Include API routers
app.include_router(api_router, prefix="/api")
