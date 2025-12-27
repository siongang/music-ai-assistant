"""
Job Pydantic schemas for API request/response validation.

These schemas define the structure of job data for API endpoints.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class JobResponse(BaseModel):
    """
    Schema for job response data.
    
    Used when returning job information from API endpoints.
    """
    id: UUID
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        # Allow creating from SQLAlchemy models
        from_attributes = True


class JobCreate(BaseModel):
    """
    Schema for job creation request data.
    
    Currently not used but reserved for future use when jobs
    can be created with custom initial status.
    """
    status: str = "pending"
