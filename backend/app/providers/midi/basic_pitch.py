"""
BasicPitch provider for midi_transcription capability.

This is the ONLY place in the codebase that imports basic_pitch.
Implements BaseProvider[MidiTranscriptionInput, MidiTranscriptionOutput].
"""
import time
import logging
from pathlib import Path

from app.providers.base import BaseProvider
from app.capabilities.midi import (
    MidiTranscriptionInput,
    MidiTranscriptionOutput,
    NoteEvent,
)
from app.capabilities.base import ModelMetadata

logger = logging.getLogger(__name__)

_BASIC_PITCH_VERSION = "2.0.0"


class BasicPitchProvider(BaseProvider[MidiTranscriptionInput, MidiTranscriptionOutput]):
    """
    MIDI transcription using Spotify's BasicPitch model.

    Polyphonic transcription. Produces per-note confidence scores.
    Best results on isolated instrument stems, not full mixes.
    """
    provider_key = "basic_pitch_v2"
    capability = "midi_transcription"

    @property
    def is_available(self) -> bool:
        try:
            import basic_pitch  # noqa: F401
            return True
        except ImportError:
            return False

    def run(self, input: MidiTranscriptionInput) -> MidiTranscriptionOutput:
        # basic_pitch is only imported inside this provider
        from basic_pitch.inference import predict

        start = time.monotonic()

        logger.info(f"Running BasicPitch on {input.audio_path}")

        model_output, midi_data, note_events = predict(
            str(input.audio_path),
            onset_threshold=input.onset_threshold,
            frame_threshold=input.frame_threshold,
            minimum_note_length=input.minimum_note_length_seconds,
        )

        input.output_dir.mkdir(parents=True, exist_ok=True)
        midi_out_path = input.output_dir / (input.audio_path.stem + ".mid")
        midi_data.write(str(midi_out_path))

        # Extract per-note data with confidence
        notes: list[NoteEvent] = []
        if note_events is not None and len(note_events) > 0:
            for row in note_events:
                # note_events columns: start_time, end_time, pitch, amplitude, pitch_bend
                start_t, end_t, pitch, amplitude = float(row[0]), float(row[1]), int(row[2]), float(row[3])
                notes.append(NoteEvent(
                    start_time=start_t,
                    end_time=end_t,
                    pitch=pitch,
                    velocity=min(127, int(amplitude * 127)),
                    confidence=min(1.0, amplitude),
                ))

        mean_confidence = sum(n.confidence for n in notes) / len(notes) if notes else 0.0
        elapsed = time.monotonic() - start

        return MidiTranscriptionOutput(
            midi_path=midi_out_path,
            note_events=notes,
            note_count=len(notes),
            mean_confidence=round(mean_confidence, 3),
            confidence=round(mean_confidence, 3),
            model_metadata=ModelMetadata(
                provider_key=self.provider_key,
                model_name="basic_pitch",
                model_version=_BASIC_PITCH_VERSION,
                params_used={
                    "onset_threshold": input.onset_threshold,
                    "frame_threshold": input.frame_threshold,
                    "minimum_note_length_seconds": input.minimum_note_length_seconds,
                },
                processing_time_seconds=round(elapsed, 2),
            ),
        )
