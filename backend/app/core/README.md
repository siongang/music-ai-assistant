# Core Components

## Purpose

Central location for application-wide constants and core functionality.

## Key Components

- **`constants.py`**: Application-wide constants (audio extensions, storage paths, job statuses)

## Important Notes

1. **Environment Variables**: Constants read from environment variables when available (e.g., `STORAGE_ROOT`)
2. **Fallback Values**: Default values provided for local development
3. **Centralized**: All magic strings/numbers should be defined here
4. **Type Safety**: Use classes for related constants (e.g., `JobStatus`)

## Current Constants

- `AUDIO_EXTENSIONS`: Supported audio file extensions
- `DEFAULT_STEM_FORMAT`: Default output format (mp3)
- `JobStatus`: Job status constants (pending, processing, completed, failed)
- `STORAGE_ROOT`: Root directory for file storage
- `JOBS_DIR`, `INPUT_DIR`, `STEMS_DIR`: Directory names

## Future Improvements

- [ ] Add configuration management system
- [ ] Add environment-based configuration
- [ ] Add validation for configuration values
- [ ] Add configuration schema/documentation
- [ ] Add feature flags
- [ ] Add logging configuration
- [ ] Add cache configuration
- [ ] Add rate limiting configuration
