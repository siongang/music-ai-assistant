"""
MIDI file utilities.

Provides helper functions for saving MIDI data and note events to files.
These utilities handle file I/O operations for MIDI conversion.
"""
from pathlib import Path
import csv
import logging
from typing import List, Tuple, Optional, Any
import numpy as np

logger = logging.getLogger(__name__)


def save_midi_file(midi_data: Any, output_path: Path) -> None:
    """
    Save PrettyMIDI object to a MIDI file.
    
    Args:
        midi_data: PrettyMIDI object containing MIDI data
        output_path: Path where the MIDI file will be saved
        
    Raises:
        RuntimeError: If saving fails
    """
    try:
        midi_data.write(str(output_path))
        logger.debug(f"Saved MIDI file: {output_path}")
    except Exception as e:
        logger.error(f"Failed to save MIDI file {output_path}: {e}")
        raise RuntimeError(f"Failed to save MIDI file: {e}") from e


def save_note_events(
    note_events: List[Tuple[float, float, int, float, Optional[List[int]]]],
    output_path: Path
) -> None:
    """
    Save note events to CSV file.
    
    This function saves note events in the same format as Basic Pitch's
    built-in save function, creating a CSV with columns:
    start_time_s, end_time_s, pitch_midi, velocity, pitch_bend
    
    Args:
        note_events: List of note event tuples with format:
            (start_time_s, end_time_s, pitch_midi, amplitude, pitch_bend_list)
        output_path: Path where the CSV file will be saved
        
    Raises:
        RuntimeError: If saving fails
    """
    try:
        with open(output_path, "w") as fhandle:
            writer = csv.writer(fhandle, delimiter=",")
            writer.writerow(["start_time_s", "end_time_s", "pitch_midi", "velocity", "pitch_bend"])
            
            for start_time, end_time, note_number, amplitude, pitch_bend in note_events:
                # Convert amplitude (0-1) to MIDI velocity (0-127)
                velocity = int(np.round(127 * amplitude))
                row = [start_time, end_time, note_number, velocity]
                
                # Add pitch bend values if present
                if pitch_bend:
                    row.extend(pitch_bend)
                    
                writer.writerow(row)
                
        logger.debug(f"Saved {len(note_events)} note events to: {output_path}")
    except Exception as e:
        logger.error(f"Failed to save note events to {output_path}: {e}")
        raise RuntimeError(f"Failed to save note events: {e}") from e

