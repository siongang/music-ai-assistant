"""
MIDI conversion service.

This service provides a high-level interface for converting audio files
to MIDI format using Basic Pitch. Returns raw MIDI data without file I/O.
"""
from pathlib import Path
import logging
from typing import Optional, Dict, List, Tuple, Any

from app.audio_engine.midi.to_midi import ToMidi

logger = logging.getLogger(__name__)


class MidiService:
    """
    Service for audio to MIDI conversion.
    
    Provides a high-level interface for converting audio files to MIDI.
    This service wraps the ToMidi audio engine and returns raw MIDI data.
    File I/O is handled by the pipeline runner service.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize MIDI service with Basic Pitch converter.
        
        Args:
            model_path: Optional path to custom Basic Pitch model.
                       If None, uses the default model.
        """
        logger.debug("Initializing MidiService")
        self.converter = ToMidi(model_path=model_path)

    def convert_to_midi(
        self,
        audio_path: Path,
        midi_tempo: Optional[float] = None,
    ) -> Tuple[Any, List[Tuple[float, float, int, float, Optional[List[int]]]]]:
        """
        Convert audio file to MIDI data.
        
        This method calls the audio engine to convert audio to MIDI,
        returning raw MIDI objects and note events. File saving is handled
        by the pipeline runner service.
        
        Args:
            audio_path: Path to audio file to convert
            midi_tempo: Optional tempo for MIDI files (default: 120)
            
        Returns:
            Tuple of (midi_data, note_events) where:
            - midi_data: PrettyMIDI object containing MIDI data
            - note_events: List of note event tuples with format:
                (start_time_s, end_time_s, pitch_midi, amplitude, pitch_bend_list)
            
        Raises:
            RuntimeError: If conversion fails
        """
        logger.info(f"Converting audio to MIDI: {audio_path}")
        
        try:
            # Call audio engine to get raw MIDI data
            # Returns: (model_output, midi_data, note_events)
            model_output, midi_data, note_events = self.converter.predict(audio_path)
            
            logger.info(f"Successfully converted audio to MIDI with {len(note_events)} notes")
            
            # Return only midi_data and note_events (model_output not needed for now)
            return midi_data, note_events
            
        except Exception as e:
            logger.error(f"Failed to convert audio to MIDI: {e}")
            raise RuntimeError(f"Failed to convert audio to MIDI: {e}") from e
