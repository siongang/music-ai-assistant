"""
Stem separation capability definition.

Contract: separate a mixed audio file into isolated instrument stems.
Provider implementations live in backend/app/providers/stems/.
"""
from pathlib import Path
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.capabilities.base import BaseCapabilityInput, BaseCapabilityOutput

CAPABILITY_NAME = "stem_separation"

SUPPORTED_STEMS = {"vocals", "drums", "bass", "other", "piano", "guitar"}


def _validate_stems_requested(v: list[str]) -> list[str]:
    unknown = set(v) - SUPPORTED_STEMS
    if unknown:
        raise ValueError(f"Unsupported stem names: {unknown}. Supported: {SUPPORTED_STEMS}")
    return v


class StemSeparationJobParams(BaseModel):
    """Client-supplied knobs for the stem separation capability."""

    model_config = ConfigDict(extra="forbid")

    provider_key: str | None = None
    stems_requested: list[str] = Field(default_factory=lambda: ["vocals", "drums", "bass", "other"])

    @field_validator("stems_requested")
    @classmethod
    def validate_stems(cls, v: list[str]) -> list[str]:
        return _validate_stems_requested(v)


class StemSeparationInput(BaseCapabilityInput):
    audio_path: Path
    output_dir: Path
    stems_requested: list[str] = ["vocals", "drums", "bass", "other"]

    @field_validator("stems_requested")
    @classmethod
    def validate_stems(cls, v: list[str]) -> list[str]:
        return _validate_stems_requested(v)


class StemFile(BaseModel):
    stem_name: str
    output_path: Path
    confidence: float | None = None


class StemSeparationOutput(BaseCapabilityOutput):
    stems: list[StemFile]
    sample_rate: int
