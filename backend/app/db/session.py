"""
Database session management.

This module handles database connection and session creation.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Database connection URL
# Reads from environment variable, falls back to default for local development
import os
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./test.db"  # Using SQLite for easy setup - no PostgreSQL needed!
)

# Create database engine
# echo=False means SQL queries won't be logged (set to True for debugging)
engine = create_engine(DATABASE_URL, echo=False)

# Create session factory
# autocommit=False: Changes must be explicitly committed
# autoflush=False: Changes aren't automatically flushed to DB
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    """
    Dependency for getting database session.
    
    This is a FastAPI dependency that provides a database session
    for each request. The session is automatically closed after the
    request completes.
    
    Yields:
        Session: SQLAlchemy database session
        
    Example:
        ```python
        def my_endpoint(db: Session = Depends(get_db)):
            # Use db session here
            pass
        ```
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
