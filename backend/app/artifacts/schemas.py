"""
Artifact type definitions and metadata schemas.

Artifacts are the primary data entities produced and consumed by the pipeline.
Every file the system produces must be recorded as an ArtifactRecord.
"""
from enum import Enum
from typing import Any
from pydantic import BaseModel


class ArtifactType(str, Enum):
    AUDIO_FILE    = "audio_file"    # raw uploaded audio
    STEM_AUDIO    = "stem_audio"    # separated instrument stem
    MIDI_FILE     = "midi_file"     # .mid file
    NOTE_EVENTS   = "note_events"   # per-note CSV/JSON
    CHORD_MAP     = "chord_map"     # chord timeline JSON
    WAVEFORM_DATA = "waveform_data" # rendered waveform peaks for UI
    SHEET_MUSIC   = "sheet_music"   # MusicXML or PDF


class ArtifactMetadata(BaseModel):
    """
    Metadata stored with every artifact.

    confidence: 0.0–1.0 when the provider emits a meaningful score.
                Null when the model does not expose one.
    model metadata fields: optional for source uploads, populated for model outputs.
    """
    confidence: float | None = None
    model_provider_key: str | None = None
    model_name: str | None = None
    model_version: str | None = None
    model_params: dict[str, Any] = {}
    processing_time_seconds: float | None = None
    duration_seconds: float | None = None
    sample_rate: int | None = None
    channels: int | None = None
    stem_name: str | None = None      # for STEM_AUDIO type
    extra: dict[str, Any] = {}        # extensible catch-all
