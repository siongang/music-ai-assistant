# Audio Engine

## Purpose

Low-level audio processing components. Handles audio signal processing and ML model inference. Returns raw data only (no file I/O).

## Key Components

- **`stems/`**: Stem separation using Demucs (PyTorch)
- **`midi/`**: MIDI conversion using Basic Pitch (TensorFlow)
- **`pipeline/`**: Audio processing pipeline (future)

## Architecture

Audio Engine → Returns raw data (tensors, MIDI objects) → Service Layer → Pipeline Runner → Handles file I/O → Storage

## Components

- **Stems**: Demucs separator, returns raw audio tensors (vocals, drums, bass, other)
- **MIDI**: Basic Pitch converter, returns PrettyMIDI objects and note events
- **Pipeline**: Future complex workflows

## Important Notes

1. **No File I/O**: Components never read/write files directly
2. **Framework Isolation**: MIDI (TensorFlow) and Stems (PyTorch) use lazy imports
3. **Raw Data Only**: Return tensors, objects, arrays - not file paths
4. **Stateless**: Components should be stateless where possible

## Dependencies

- **Demucs**: Audio source separation (PyTorch)
- **Basic Pitch**: Audio-to-MIDI conversion (TensorFlow)
- **FFmpeg**: Audio processing (system dependency)

## Device Support

- **CPU**: All models work on CPU
- **GPU**: CUDA-enabled GPUs supported for faster processing
- **Auto-detection**: Both models auto-detect available devices

## Future Improvements

- [ ] Pipeline orchestration
- [ ] Audio preprocessing utilities
- [ ] Feature extraction
- [ ] Melody extraction
- [ ] Chord detection
