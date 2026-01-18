# Stem Separation

## Purpose

Wrapper around the Demucs library for separating audio files into individual stems (vocals, drums, bass, other).

## Key Components

- **`demucs_separator.py`**: `DemucsSeparator` class that wraps Demucs API

## How It Works

1. Initializes Demucs `Separator` with model configuration
2. Loads audio file using Demucs API (handles format conversion via FFmpeg)
3. Separates audio into stems using the model
4. Returns PyTorch tensors for each stem

## Important Notes

1. **Model Loading**: Model loaded on first use (lazy loading)
2. **Device Selection**: Auto-detects CUDA if available, falls back to CPU
3. **Memory**: Model and audio tensors can be large - monitor memory usage
4. **Thread Safety**: Not thread-safe - create separate instances per thread
5. **Error Handling**: Wraps Demucs errors in `RuntimeError`

## Configuration

Default parameters: `model` ("htdemucs"), `device` (auto-detect), `shifts` (1), `overlap` (0.25), `split` (True)

## Future Improvements

- [ ] Model selection via configuration
- [ ] Progress callbacks
- [ ] Support for different Demucs models
- [ ] Model weight caching
- [ ] Batch processing support

## Dependencies

- **Demucs**: Audio source separation library
- **PyTorch**: Deep learning framework
