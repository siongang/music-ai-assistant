"""
Database base class.

This module defines the base class for all SQLAlchemy models.
Models are imported in app/models/__init__.py to avoid circular imports.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    
    All database models should inherit from this class.
    """
    pass