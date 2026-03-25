"""
Job Pydantic schemas for API request/response validation.

These schemas define the structure of job data for API endpoints.
"""
from pydantic import BaseModel, ConfigDict, model_validator
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID


class JobInput(BaseModel):
    """Input data for a job."""
    input_artifact_id: UUID


class JobCreate(BaseModel):
    """
    Schema for job creation. project_id comes from the URL (POST /projects/{project_id}/jobs).

    Example:
    {
        "capability": "stem_separation",
        "input": { "input_artifact_id": "uuid" },
        "params": { "provider_key": "demucs_htdemucs" }
    }
    """
    capability: Optional[str] = None
    type: Optional[str] = None
    input: JobInput
    params: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def validate_capability_name(self):
        if not self.capability and not self.type:
            raise ValueError("Either capability or type is required")
        return self

    @property
    def requested_capability(self) -> str:
        return self.capability or self.type or ""


class JobOutput(BaseModel):
    """Output data from a completed job."""
    # Output structure varies by job type
    # For stem_separation: {"vocals": "...", "drums": "...", ...}
    # For melody_extraction: {"melody": "..."}
    # etc.
    pass


class JobResponse(BaseModel):
    """Schema for job response data."""
    job_id: UUID
    capability: str
    provider_key: Optional[str] = None
    status: str
    project_id: UUID
    input: Dict[str, Any]
    params: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    progress: Optional[float] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
