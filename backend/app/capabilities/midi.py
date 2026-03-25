"""
MIDI transcription capability definition.

Contract: convert an audio file to MIDI and structured note events.
Provider implementations live in backend/app/providers/midi/.
"""
from pathlib import Path
from pydantic import BaseModel, ConfigDict, Field

from app.capabilities.base import BaseCapabilityInput, BaseCapabilityOutput

CAPABILITY_NAME = "midi_transcription"


class MidiTranscriptionJobParams(BaseModel):
    """Client-supplied knobs for the MIDI transcription capability."""

    model_config = ConfigDict(extra="forbid")

    provider_key: str | None = None
    onset_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    frame_threshold: float = Field(default=0.3, ge=0.0, le=1.0)
    minimum_note_length_seconds: float = Field(default=0.05, gt=0.0)
    midi_tempo: int | None = Field(default=None, gt=0)


class MidiTranscriptionInput(BaseCapabilityInput):
    audio_path: Path
    output_dir: Path
    onset_threshold: float = 0.5
    frame_threshold: float = 0.3
    minimum_note_length_seconds: float = 0.05
    midi_tempo: int | None = None  # None = infer from model


class NoteEvent(BaseModel):
    start_time: float      # seconds
    end_time: float        # seconds
    pitch: int             # MIDI note number 0–127
    velocity: int          # 0–127
    confidence: float | None = None


class MidiTranscriptionOutput(BaseCapabilityOutput):
    midi_path: Path
    note_events: list[NoteEvent]
    note_count: int
    mean_confidence: float  # mirrors top-level confidence; explicit for clarity
