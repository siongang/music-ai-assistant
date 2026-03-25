"""Capability and provider discovery endpoints."""
from typing import Any

from fastapi import APIRouter, HTTPException, status as http_status

from app.capabilities.registry import CapabilityRegistry
from app.core.constants import DEFAULT_PROVIDERS
from app.providers.registry import ProviderRegistry, initialize_provider_registry
from app.schemas.capability import CapabilityResponse, JobParamResponse, ProviderResponse

router = APIRouter(prefix="/capabilities", tags=["capabilities"])


def _job_params_to_response(capability_name: str) -> list[JobParamResponse]:
    definition = CapabilityRegistry.get(capability_name)
    if definition is None or definition.job_params_schema is None:
        return []

    schema = definition.job_params_schema.model_json_schema()
    properties: dict[str, Any] = schema.get("properties", {})
    required = set(schema.get("required", []))
    responses: list[JobParamResponse] = []
    for name, field_schema in properties.items():
        json_type = field_schema.get("type")
        if json_type is None and "anyOf" in field_schema:
            for option in field_schema["anyOf"]:
                if option.get("type") != "null":
                    json_type = option.get("type")
                    break
        responses.append(
            JobParamResponse(
                name=name,
                json_type=json_type,
                required=name in required,
                default=field_schema.get("default"),
                description=field_schema.get("description"),
            )
        )
    return responses


def _provider_to_response(capability_name: str, provider_key: str) -> ProviderResponse:
    provider = ProviderRegistry.get(capability_name, provider_key)
    description = (provider.__doc__ or "").strip() or None
    return ProviderResponse(
        provider_key=provider_key,
        capability=capability_name,
        is_default=DEFAULT_PROVIDERS.get(capability_name) == provider_key,
        is_available=provider.is_available,
        description=description,
    )


@router.get("", response_model=list[CapabilityResponse])
def list_capabilities():
    initialize_provider_registry()
    responses: list[CapabilityResponse] = []
    for definition in CapabilityRegistry.all():
        provider_keys = ProviderRegistry.list_for_capability(definition.name)
        responses.append(
            CapabilityResponse(
                name=definition.name,
                display_name=definition.display_name,
                description=definition.description,
                status=definition.status,
                default_provider_key=DEFAULT_PROVIDERS.get(definition.name),
                registered_provider_keys=provider_keys,
                accepted_job_params=_job_params_to_response(definition.name),
            )
        )
    return responses


@router.get("/{capability_name}/providers", response_model=list[ProviderResponse])
def list_capability_providers(capability_name: str):
    initialize_provider_registry()
    definition = CapabilityRegistry.get(capability_name)
    if definition is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Capability {capability_name} not found",
        )
    provider_keys = ProviderRegistry.list_for_capability(capability_name)
    return [_provider_to_response(capability_name, provider_key) for provider_key in provider_keys]
