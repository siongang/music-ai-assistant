# Audio Engine

## Purpose

The audio engine handles all audio processing operations, including stem separation using the Demucs library.

## Key Components

- **`stems/`**: Stem separation functionality (Demucs wrapper)
- **`pipeline/`**: Audio processing pipeline orchestration

## Architecture

```
Input Audio File
  ↓
DemucsSeparator (stems/demucs_separator.py)
  ↓
Demucs Library (external)
  ↓
Separated Stems (vocals, drums, bass, other)
  ↓
Pipeline Processing (pipeline/process_audio.py)
  ↓
Output Files
```

## Important Notes

1. **Demucs Dependency**: Requires Demucs library and PyTorch
2. **Device Selection**: Can use CPU or GPU (CUDA) - auto-detects by default
3. **Model**: Currently uses `htdemucs` model (default)
4. **FFmpeg Required**: Demucs uses FFmpeg for audio loading
5. **Memory Usage**: Large audio files may require significant RAM/VRAM

## Current Implementation

- **Stem Separation**: Uses Demucs `htdemucs` model
- **Output Format**: MP3 (configurable via constants)
- **Sample Rate**: 44100 Hz (model default)

## Future Improvements

- [ ] Add support for different Demucs models (mdx, htdemucs_ft, etc.)
- [ ] Add GPU device selection via environment variable
- [ ] Add model caching/optimization
- [ ] Add progress tracking for long separations
- [ ] Add support for different output formats (WAV, FLAC, etc.)
- [ ] Add audio preprocessing (normalization, format conversion)
- [ ] Add batch processing for multiple files
- [ ] Add quality/speed tradeoff options
- [ ] Add custom model support
- [ ] Add real-time processing capabilities

## Dependencies

- `demucs`: Audio source separation library
- `torch`: PyTorch for model inference
- `soundfile`: Audio file I/O
- `ffmpeg`: Audio processing (system dependency)
