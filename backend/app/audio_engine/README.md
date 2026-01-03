# Audio Engine

## Purpose

Low-level audio processing components. This layer handles the actual audio signal processing and machine learning model inference. Returns raw data only (no file I/O).

## Key Components

- **`stems/`**: Stem separation using Demucs (PyTorch)
- **`midi/`**: MIDI conversion using Basic Pitch (TensorFlow)
- **`pipeline/`**: Audio processing pipeline (future)

## Architecture

The audio engine is the lowest layer in the application architecture. It contains raw audio processing code without knowledge of HTTP, databases, or storage. All components return raw data structures (tensors, MIDI objects) without performing file I/O.

```
Audio File (as path)
  ↓
Audio Engine (this folder)
  ↓
Processed Data (tensors, MIDI objects, note events)
```

## Separation of Concerns

**Audio Engine Responsibility:**
- Load and process audio data
- Run ML models (Demucs, Basic Pitch)
- Return raw outputs (tensors, MIDI objects)
- NO file I/O operations

**Service Layer Responsibility:**
- Wrap audio engine components
- Add business logic
- Return raw data to pipeline runner

**Pipeline Runner Responsibility:**
- Call services for raw data
- Handle all file I/O operations
- Save outputs to storage

## Components

### Stems (`stems/`)
- **`demucs_separator.py`**: Wrapper around Demucs library
- Uses Demucs API for separation
- Returns raw audio tensors (no file I/O)
- PyTorch-based
- Model: `htdemucs` (default)
- Output: Vocals, drums, bass, other

### MIDI (`midi/`)
- **`to_midi.py`**: Wrapper around Basic Pitch library
- Converts audio to MIDI using Basic Pitch inference
- Returns PrettyMIDI objects and note events (no file I/O)
- TensorFlow-based
- Note: Uses lazy imports to avoid TF/PyTorch conflicts
- Output: MIDI data, note events (start, end, pitch, velocity)

### Pipeline (`pipeline/`)
- Future: Complex audio processing workflows
- Orchestration of multiple processing steps

## Important Notes

1. **No File I/O**: Audio engine components should never read/write files directly
2. **Framework Isolation**: MIDI (TensorFlow) and Stems (PyTorch) use lazy imports
3. **Raw Data Only**: Return tensors, objects, arrays - not file paths
4. **Stateless**: Components should be stateless where possible
5. **Type Hints**: All methods should have proper type hints

## Dependencies

- **Demucs**: Audio source separation library (PyTorch)
- **Basic Pitch**: Audio-to-MIDI conversion (TensorFlow)
- **PyTorch**: Deep learning framework for Demucs
- **TensorFlow**: Deep learning framework for Basic Pitch
- **FFmpeg**: Audio processing (system dependency)

## Device Support

- **CPU**: All models work on CPU
- **GPU**: CUDA-enabled GPUs supported for faster processing
- **Auto-detection**: Both Demucs and Basic Pitch auto-detect available devices

## Future Improvements

- [ ] Add pipeline orchestration for complex workflows
- [ ] Add audio preprocessing utilities
- [ ] Add audio feature extraction
- [ ] Add melody extraction
- [ ] Add chord detection
- [ ] Add beat tracking
- [ ] Add tempo detection
- [ ] Add key detection
- [ ] Add model caching/optimization
- [ ] Add progress tracking for long operations
- [ ] Add batch processing support
