"""
Job Pydantic schemas for API request/response validation.

These schemas define the structure of job data for API endpoints.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID


class JobInput(BaseModel):
    """Input data for a job."""
    audio_id: UUID


class JobParams(BaseModel):
    """Job parameters."""
    model: Optional[str] = None
    # Add other parameters as needed


class JobCreate(BaseModel):
    """
    Schema for job creation request data.
    
    Example:
    {
        "type": "stem_separation",
        "input": {
            "audio_id": "audio_abc123"
        },
        "params": {
            "model": "demucs_v4"
        }
    }
    """
    type: str
    input: JobInput
    params: Optional[Dict[str, Any]] = None


class JobOutput(BaseModel):
    """Output data from a completed job."""
    # Output structure varies by job type
    # For stem_separation: {"vocals": "...", "drums": "...", ...}
    # For melody_extraction: {"melody": "..."}
    # etc.
    pass


class JobResponse(BaseModel):
    """
    Schema for job response data.
    
    Used when returning job information from API endpoints.
    """
    job_id: UUID
    type: str
    status: str
    audio_id: UUID
    input: Dict[str, Any]
    params: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    progress: Optional[float] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        # Allow creating from SQLAlchemy models
        from_attributes = True
        # Map 'id' field to 'job_id' in response
        populate_by_name = True
