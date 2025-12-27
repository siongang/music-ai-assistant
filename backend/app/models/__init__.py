"""
Database models package.

This module imports all models so they can be discovered by Alembic
and other tools that need to scan for models.
"""
from app.models.job import Job  # noqa: F401

__all__ = ["Job"]
