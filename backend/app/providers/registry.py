"""
Provider registry.

Maps (capability, provider_key) to a provider instance.
Job handlers resolve the correct provider here — never by direct import.
"""
import logging
from typing import Type

from app.providers.base import BaseProvider

logger = logging.getLogger(__name__)


class ProviderRegistry:
    _providers: dict[str, BaseProvider] = {}

    @classmethod
    def register(cls, provider: BaseProvider) -> None:
        key = f"{provider.capability}:{provider.provider_key}"
        cls._providers[key] = provider
        logger.debug(f"Registered provider: {key}")

    @classmethod
    def get(cls, capability: str, provider_key: str) -> BaseProvider:
        key = f"{capability}:{provider_key}"
        provider = cls._providers.get(key)
        if provider is None:
            available = [k for k in cls._providers if k.startswith(f"{capability}:")]
            raise KeyError(
                f"Provider '{provider_key}' not registered for capability '{capability}'. "
                f"Available: {available}"
            )
        return provider

    @classmethod
    def get_default(cls, capability: str) -> BaseProvider:
        from app.core.constants import DEFAULT_PROVIDERS
        provider_key = DEFAULT_PROVIDERS.get(capability)
        if provider_key is None:
            raise KeyError(f"No default provider configured for capability '{capability}'")
        return cls.get(capability, provider_key)

    @classmethod
    def list_for_capability(cls, capability: str) -> list[str]:
        prefix = f"{capability}:"
        return [k.split(":", 1)[1] for k in cls._providers if k.startswith(prefix)]

    @classmethod
    def all_keys(cls) -> list[str]:
        return list(cls._providers.keys())


def _register_all_providers() -> None:
    """
    Register all available providers.
    Called once at app startup. Add new providers here.
    """
    _try_register_demucs()
    _try_register_basic_pitch()


def initialize_provider_registry() -> None:
    if ProviderRegistry._providers:
        return
    _register_all_providers()


def _try_register_demucs() -> None:
    try:
        from app.providers.stems.demucs import DemucsHtdemucsProvider
        ProviderRegistry.register(DemucsHtdemucsProvider())
        logger.info("Registered provider: demucs_htdemucs")
    except ImportError:
        logger.warning("Demucs not available — stem_separation provider not registered")


def _try_register_basic_pitch() -> None:
    try:
        from app.providers.midi.basic_pitch import BasicPitchProvider
        ProviderRegistry.register(BasicPitchProvider())
        logger.info("Registered provider: basic_pitch_v2")
    except ImportError:
        logger.warning("BasicPitch not available — midi_transcription provider not registered")
