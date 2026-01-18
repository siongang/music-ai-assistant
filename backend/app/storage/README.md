# Storage Layer

## Purpose

Abstract storage interface for file operations. Allows switching between storage backends (local filesystem, S3, Azure) without changing application code.

## Key Components

- **`base.py`**: Abstract `Storage` base class defining the interface
- **`local_storage.py`**: Local filesystem implementation

## Current Implementation

**LocalStorage**: Filesystem storage using `pathlib.Path`
- Stores files in `{root}/audio/{audio_id}/` for uploads
- Stores files in `{root}/jobs/{job_id}/stems/` for outputs
- Creates directories automatically

## Important Notes

1. **Abstraction**: Code depends on `Storage` interface, not `LocalStorage`
2. **Path Management**: All paths handled internally
3. **Error Handling**: Storage implementations handle filesystem errors
4. **Thread Safety**: Implementations should be thread-safe

## Future Improvements

- [ ] S3 storage implementation
- [ ] Azure Blob storage implementation
- [ ] Storage configuration system
- [ ] Storage migration utilities
