# Storage Layer

## Purpose

Abstract storage interface for file operations. Allows switching between different storage backends (local filesystem, S3, Azure, etc.) without changing application code.

## Key Components

- **`base.py`**: Abstract `Storage` base class defining the interface
- **`local_storage.py`**: Local filesystem implementation

## Architecture

```
Application Code
  ↓
Storage Interface (base.py)
  ↓
Storage Implementation (local_storage.py)
  ↓
File System / Cloud Storage
```

## Current Implementation

### LocalStorage

Local filesystem storage:
- Stores files in `{root}/jobs/{job_id}/input/` for input files
- Stores files in `{root}/jobs/{job_id}/stems/` for output stems
- Creates directories automatically
- Uses `pathlib.Path` for cross-platform compatibility

## Important Notes

1. **Abstraction**: Code should depend on `Storage` interface, not `LocalStorage`
2. **Path Management**: All paths handled internally by storage implementation
3. **Error Handling**: Storage implementations should handle filesystem errors
4. **Thread Safety**: Storage implementations should be thread-safe
5. **Idempotency**: Operations should be idempotent where possible

## Storage Interface

Required methods:
- `job_path(job_id: str) -> Path`: Get job directory path
- `input_audio_path(job_id: str, filename: str) -> Path`: Get input file path
- `save_input_file(job_id: str, file: BinaryIO, filename: str) -> Path`: Save uploaded file

## Future Improvements

- [ ] Add S3 storage implementation
- [ ] Add Azure Blob storage implementation
- [ ] Add Google Cloud Storage implementation
- [ ] Add storage configuration system
- [ ] Add storage migration utilities
- [ ] Add storage caching layer
- [ ] Add storage compression
- [ ] Add storage encryption
- [ ] Add storage versioning
- [ ] Add storage cleanup utilities
- [ ] Add storage monitoring/metrics

## Dependencies

- `pathlib.Path`: Path handling
- `shutil`: File operations (for LocalStorage)
