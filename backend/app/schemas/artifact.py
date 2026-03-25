"""Artifact API schemas."""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ArtifactMetadataResponse(BaseModel):
    confidence: Optional[float] = None
    model_provider_key: Optional[str] = None
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    model_params: dict[str, Any] = {}
    processing_time_seconds: Optional[float] = None
    duration_seconds: Optional[float] = None
    sample_rate: Optional[int] = None
    channels: Optional[int] = None
    stem_name: Optional[str] = None
    extra: dict[str, Any] = {}


class ArtifactResponse(BaseModel):
    id: UUID
    type: str
    project_id: UUID
    producing_job_id: Optional[UUID] = None
    parent_artifact_id: Optional[UUID] = None
    storage_path: str
    file_size_bytes: Optional[int] = None
    metadata: ArtifactMetadataResponse
    download_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SourceAudioUploadResponse(BaseModel):
    artifact_id: UUID
    filename: str
    project_id: UUID
    duration: Optional[float] = None
    sample_rate: Optional[int] = None
    channels: Optional[int] = None
    format: Optional[str] = None
