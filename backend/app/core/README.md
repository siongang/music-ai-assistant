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

### Audio Processing
- `AUDIO_EXTENSIONS`: Supported audio file extensions (.mp3, .wav, .flac, .m4a, .ogg, .wma, .aac, .aiff)
- `DEFAULT_STEM_FORMAT`: Default output format (mp3)

### Job Management
- `JobStatus`: Job status constants
  - `QUEUED` / `PENDING`: Job waiting to be processed
  - `RUNNING` / `PROCESSING`: Job currently processing
  - `SUCCEEDED` / `COMPLETED`: Job completed successfully
  - `FAILED`: Job failed with error
- `JobType`: Job type constants
  - `STEM_SEPARATION`: Separate audio into stems
  - `MIDI_CONVERSION`: Convert audio to MIDI
  - `MELODY_EXTRACTION`: Extract melody from audio (planned)
  - `CHORD_ANALYSIS`: Analyze chord progressions (planned)

### Storage Configuration
- `STORAGE_ROOT`: Root directory for file storage (defaults to `backend/tmp`, configurable via env var)
- `AUDIO_DIR`: Audio files directory ("audio")
- `JOBS_DIR`: Jobs output directory ("jobs")
- `INPUT_DIR`: Job input files directory ("input")
- `STEMS_DIR`: Stem separation output directory ("stems")
- `MIDI_DIR`: MIDI conversion output directory ("midi")

### File Upload Limits
- `MAX_FILE_SIZE_MB`: Maximum file size in megabytes (500 MB)
- `MAX_FILE_SIZE_BYTES`: Maximum file size in bytes

## Future Improvements

- [ ] Add configuration management system
- [ ] Add environment-based configuration
- [ ] Add validation for configuration values
- [ ] Add configuration schema/documentation
- [ ] Add feature flags
- [ ] Add logging configuration
- [ ] Add cache configuration
- [ ] Add rate limiting configuration
