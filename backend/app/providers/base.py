"""
Base provider interface.

All ML model adapters must implement this. The generic parameters enforce
that providers are typed to a specific capability's input/output schemas.

IMPORTANT: Only provider modules (backend/app/providers/**) may import
model-specific libraries (demucs, basic_pitch, torch, etc.).
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from app.capabilities.base import BaseCapabilityInput, BaseCapabilityOutput

InputT = TypeVar("InputT", bound=BaseCapabilityInput)
OutputT = TypeVar("OutputT", bound=BaseCapabilityOutput)


class BaseProvider(ABC, Generic[InputT, OutputT]):
    """
    Abstract base for all ML model providers.

    Attributes:
        provider_key: Unique identifier. Format: {model_family}_{variant}
                      e.g. "demucs_htdemucs", "basic_pitch_v2"
        capability:   The capability this provider implements.
                      Must match a registered CapabilityDefinition name.
    """
    provider_key: str
    capability: str

    @abstractmethod
    def run(self, input: InputT) -> OutputT:
        """
        Execute the capability.

        Args:
            input: Validated input schema for this capability.

        Returns:
            Output schema with results, confidence, and model_metadata populated.

        Raises:
            RuntimeError: If the model fails to process the input.
        """
        ...

    @property
    def is_available(self) -> bool:
        """
        Check if the underlying model is loadable in this environment.
        Override in providers that have optional dependencies.
        """
        return True
