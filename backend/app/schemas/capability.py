"""Capability and provider discovery API schemas."""
from typing import Any, Optional

from pydantic import BaseModel


class JobParamResponse(BaseModel):
    name: str
    json_type: Optional[str] = None
    required: bool
    default: Any = None
    description: Optional[str] = None


class CapabilityResponse(BaseModel):
    name: str
    display_name: str
    description: str
    status: str
    default_provider_key: Optional[str] = None
    registered_provider_keys: list[str]
    accepted_job_params: list[JobParamResponse] = []


class ProviderResponse(BaseModel):
    provider_key: str
    capability: str
    is_default: bool
    is_available: bool
    description: Optional[str] = None
