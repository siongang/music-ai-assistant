# MIDI Conversion

## Purpose

Converts audio files to MIDI format using Basic Pitch (Spotify's audio-to-MIDI model). Extracts note events including pitch, timing, and velocity information.

## Key Components

- **`to_midi.py`**: `ToMidi` class that wraps Basic Pitch API

## How It Works

1. Loads audio file using Basic Pitch API
2. Runs inference using the pre-trained Basic Pitch model
3. Converts model output to MIDI format (PrettyMIDI objects)
4. Extracts note events (start time, end time, pitch, velocity)
5. Returns raw MIDI data and note events (no file I/O)

## Important Notes

1. **Framework**: Uses TensorFlow (not PyTorch)
2. **Lazy Import**: Uses lazy imports to avoid TF/PyTorch conflicts
3. **Device Selection**: Auto-detects GPU if available, falls back to CPU
4. **No File I/O**: Returns PrettyMIDI objects and note lists, doesn't save files
5. **Thread Safety**: Create separate instances per thread
6. **Memory**: Model and audio tensors can be large - monitor memory usage

## Output Format

### MIDI Object
Returns a `PrettyMIDI` object containing:
- Note events organized by instrument
- Tempo information
- Time signature
- Pitch bends

### Note Events
Returns a list of note dictionaries:
```python
[
    {
        "start_time": 0.5,    # seconds
        "end_time": 1.2,      # seconds
        "pitch": 60,          # MIDI note number (C4)
        "velocity": 64        # 0-127
    },
    ...
]
```

## Configuration

Default parameters:
- `onset_threshold`: 0.5 (confidence threshold for note onsets)
- `frame_threshold`: 0.3 (confidence threshold for note frames)
- `minimum_note_length`: 127.70 ms (minimum note duration)
- `minimum_frequency`: None (no minimum)
- `maximum_frequency`: None (no maximum)
- `multiple_pitch_bends`: False (single pitch bend per note)

## Performance

- **Speed**: ~10-30x slower than real-time on CPU
- **GPU Acceleration**: Significantly faster with CUDA-enabled GPU
- **Accuracy**: Works best with monophonic or simple polyphonic audio
- **Limitations**: May struggle with complex polyphonic music or heavy drums

## Future Improvements

- [ ] Add configurable model parameters (thresholds, frequencies)
- [ ] Add support for different Basic Pitch model versions
- [ ] Add progress callbacks for long conversions
- [ ] Add batch processing support
- [ ] Add MIDI quantization options
- [ ] Add pitch correction/snapping
- [ ] Add tempo detection and adjustment
- [ ] Add instrument classification
- [ ] Add melody extraction (separate from full MIDI)
- [ ] Add harmony detection
- [ ] Add key detection
- [ ] Add time signature detection
- [ ] Add model caching/optimization

## Dependencies

- **Basic Pitch**: Spotify's audio-to-MIDI model (TensorFlow)
- **TensorFlow**: Deep learning framework
- **PrettyMIDI**: MIDI file handling and manipulation
- **NumPy**: Numerical operations

## Related Components

- **Audio Engine**: Parent package containing all audio processing
- **MIDI Utils**: Helper functions for saving MIDI files (`app/utils/midi_utils.py`)
- **MIDI Service**: High-level interface wrapping ToMidi (`app/services/midi_service.py`)
- **Pipeline Runner**: Orchestrates MIDI conversion and file saving (`app/services/pipeline_runner_service.py`)


