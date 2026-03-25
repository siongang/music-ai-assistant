"""
Capability registry.

Maps capability names to their input/output schemas.
Used for validation at job creation time and for documentation.
"""
from dataclasses import dataclass
from typing import Type

from pydantic import BaseModel

from app.capabilities.base import BaseCapabilityInput, BaseCapabilityOutput


@dataclass
class CapabilityDefinition:
    name: str
    display_name: str
    description: str
    input_schema: Type[BaseCapabilityInput]
    output_schema: Type[BaseCapabilityOutput]
    job_params_schema: Type[BaseModel] | None
    status: str  # "available" | "stub" | "deprecated"


class CapabilityRegistry:
    _definitions: dict[str, CapabilityDefinition] = {}

    @classmethod
    def register(cls, definition: CapabilityDefinition) -> None:
        cls._definitions[definition.name] = definition

    @classmethod
    def get(cls, name: str) -> CapabilityDefinition | None:
        return cls._definitions.get(name)

    @classmethod
    def all_available(cls) -> list[CapabilityDefinition]:
        return [d for d in cls._definitions.values() if d.status == "available"]

    @classmethod
    def all(cls) -> list[CapabilityDefinition]:
        return list(cls._definitions.values())


def _register_all() -> None:
    from app.capabilities.stems import (
        StemSeparationInput,
        StemSeparationOutput,
        StemSeparationJobParams,
        CAPABILITY_NAME as STEMS,
    )
    from app.capabilities.midi import (
        MidiTranscriptionInput,
        MidiTranscriptionOutput,
        MidiTranscriptionJobParams,
        CAPABILITY_NAME as MIDI,
    )
    from app.capabilities.chords import ChordAnalysisInput, ChordAnalysisOutput, CAPABILITY_NAME as CHORDS

    CapabilityRegistry.register(CapabilityDefinition(
        name=STEMS,
        display_name="Stem Separation",
        description="Separate a mixed audio file into isolated instrument stems.",
        input_schema=StemSeparationInput,
        output_schema=StemSeparationOutput,
        job_params_schema=StemSeparationJobParams,
        status="available",
    ))
    CapabilityRegistry.register(CapabilityDefinition(
        name=MIDI,
        display_name="MIDI Transcription",
        description="Convert audio to MIDI and structured note events.",
        input_schema=MidiTranscriptionInput,
        output_schema=MidiTranscriptionOutput,
        job_params_schema=MidiTranscriptionJobParams,
        status="available",
    ))
    CapabilityRegistry.register(CapabilityDefinition(
        name=CHORDS,
        display_name="Chord Analysis",
        description="Detect chord progressions with Roman numeral analysis.",
        input_schema=ChordAnalysisInput,
        output_schema=ChordAnalysisOutput,
        job_params_schema=None,
        status="stub",
    ))


_register_all()
