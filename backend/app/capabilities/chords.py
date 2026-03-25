"""
Chord analysis capability definition.

Contract: detect chord progressions and label them musically.
Status: STUB — no provider registered yet. Returns 501 until a provider exists.
"""
from pathlib import Path
from pydantic import BaseModel

from app.capabilities.base import BaseCapabilityInput, BaseCapabilityOutput

CAPABILITY_NAME = "chord_analysis"


class ChordAnalysisInput(BaseCapabilityInput):
    audio_path: Path
    key_hint: str | None = None  # e.g. "C major" — improves accuracy if known


class ChordEvent(BaseModel):
    start_time: float
    end_time: float
    chord_label: str     # e.g. "Cmaj7"
    roman_numeral: str   # e.g. "Imaj7"
    confidence: float


class ChordAnalysisOutput(BaseCapabilityOutput):
    chords: list[ChordEvent]
    detected_key: str
    key_confidence: float
