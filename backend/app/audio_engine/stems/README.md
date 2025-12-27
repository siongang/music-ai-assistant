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

1. **Model Loading**: Model is loaded on first use (lazy loading)
2. **Device Selection**: Auto-detects CUDA if available, falls back to CPU
3. **Memory**: Model and audio tensors can be large - monitor memory usage
4. **Thread Safety**: Demucs separator is not thread-safe - create separate instances per thread
5. **Error Handling**: Wraps Demucs errors in `RuntimeError` for consistent error handling

## Configuration

Default parameters:
- `model`: "htdemucs" (high-quality model)
- `device`: None (auto-detect)
- `shifts`: 1 (number of random shifts for quality)
- `overlap`: 0.25 (segment overlap)
- `split`: True (split long audio)

## Future Improvements

- [ ] Add model selection via configuration
- [ ] Add device selection via environment variable
- [ ] Add progress callbacks for long separations
- [ ] Add support for different Demucs models
- [ ] Add caching for model weights
- [ ] Add batch processing support
- [ ] Add quality/speed tradeoff options
- [ ] Add custom model loading
- [ ] Add memory-efficient processing for large files

## Dependencies

- `demucs.api.Separator`: Main Demucs API
- `torch`: PyTorch tensors
- `pathlib.Path`: File path handling
