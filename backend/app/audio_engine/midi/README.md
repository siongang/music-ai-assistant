# MIDI Conversion

## Purpose

Converts audio files to MIDI format using Basic Pitch (Spotify's audio-to-MIDI model). Extracts note events including pitch, timing, and velocity.

## Key Components

- **`to_midi.py`**: `ToMidi` class that wraps Basic Pitch API

## How It Works

1. Loads audio file using Basic Pitch API
2. Runs inference using pre-trained Basic Pitch model
3. Converts model output to MIDI format (PrettyMIDI objects)
4. Extracts note events (start time, end time, pitch, velocity)
5. Returns raw MIDI data and note events (no file I/O)

## Important Notes

1. **Framework**: Uses TensorFlow (not PyTorch)
2. **Lazy Import**: Uses lazy imports to avoid TF/PyTorch conflicts
3. **Device Selection**: Auto-detects GPU if available, falls back to CPU
4. **No File I/O**: Returns PrettyMIDI objects and note lists, doesn't save files
5. **Thread Safety**: Create separate instances per thread

## Output Format

- **MIDI Object**: `PrettyMIDI` object with note events, tempo, time signature
- **Note Events**: List of dictionaries with `start_time`, `end_time`, `pitch`, `velocity`

## Configuration

Default parameters: `onset_threshold` (0.5), `frame_threshold` (0.3), `minimum_note_length` (127.70 ms)

## Performance

- **Speed**: ~10-30x slower than real-time on CPU
- **GPU Acceleration**: Significantly faster with CUDA-enabled GPU
- **Accuracy**: Works best with monophonic or simple polyphonic audio

## Future Improvements

- [ ] Configurable model parameters
- [ ] Progress callbacks
- [ ] Batch processing support
- [ ] MIDI quantization options
- [ ] Model caching/optimization

## Dependencies

- **Basic Pitch**: Spotify's audio-to-MIDI model (TensorFlow)
- **TensorFlow**: Deep learning framework
- **PrettyMIDI**: MIDI file handling


