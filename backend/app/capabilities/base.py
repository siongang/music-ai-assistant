"""
Base schemas shared by all capabilities.

Every capability InputSchema and OutputSchema must inherit from these.
ModelMetadata is required on every output.
"""
from pydantic import BaseModel
from typing import Any
from uuid import UUID


class BaseCapabilityInput(BaseModel):
    pass


class ModelMetadata(BaseModel):
    """Metadata describing which model ran and how."""
    provider_key: str
    model_name: str
    model_version: str
    params_used: dict[str, Any] = {}
    processing_time_seconds: float


class BaseCapabilityOutput(BaseModel):
    """
    Every capability output carries model metadata.
    confidence is optional because not every model exposes a reliable score.
    """
    confidence: float | None = None
    model_metadata: ModelMetadata
