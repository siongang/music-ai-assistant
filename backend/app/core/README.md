# Core Components

## Purpose

Central location for application-wide constants and core functionality.

## Key Components

- **`constants.py`**: Application-wide constants (audio extensions, storage paths, job statuses)

## Current Constants

- **Audio Processing**: `AUDIO_EXTENSIONS`, `DEFAULT_STEM_FORMAT`
- **Job Management**: `JobStatus` (QUEUED, RUNNING, SUCCEEDED, FAILED), `JobType` (STEM_SEPARATION, MIDI_CONVERSION)
- **Storage**: `STORAGE_ROOT`, `AUDIO_DIR`, `JOBS_DIR`, `STEMS_DIR`, `MIDI_DIR`
- **File Upload**: `MAX_FILE_SIZE_MB` (500 MB)

## Important Notes

1. **Environment Variables**: Constants read from env vars when available (e.g., `STORAGE_ROOT`)
2. **Fallback Values**: Default values for local development
3. **Centralized**: All magic strings/numbers defined here
4. **Type Safety**: Use classes for related constants (e.g., `JobStatus`)

## Future Improvements

- [ ] Configuration management system
- [ ] Environment-based configuration
- [ ] Feature flags
- [ ] Logging configuration
