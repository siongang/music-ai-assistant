# Services Layer

## Purpose

Business logic and orchestration layer. Services coordinate between components and implement business rules.

## Key Components

- **`job_service.py`**: Database operations for jobs (CRUD)
- **`pipeline_runner_service.py`**: Orchestrates audio processing pipeline
- **`stem_service.py`**: High-level interface for stem separation
- **`midi_service.py`**: High-level interface for MIDI conversion
- **`audio_service.py`**: Database operations for audio files

## Service Responsibilities

- **JobService**: Create, read, update jobs; handle status transitions
- **PipelineRunnerService**: Orchestrate workflows; coordinate file I/O
- **StemService**: Wraps DemucsSeparator; returns raw tensors (no file I/O)
- **MidiService**: Wraps ToMidi; returns raw MIDI data (no file I/O)
- **AudioService**: Database operations for audio files

## Architecture Pattern

Audio Engine → Returns raw data → Service Layer → Wraps engine → Pipeline Runner → Handles file I/O → Storage

## Important Notes

1. **Single Responsibility**: Each service has focused responsibility
2. **Separation of Concerns**: Services return raw data; pipeline runner handles file I/O
3. **Dependency Injection**: Services receive dependencies via constructor
4. **No HTTP Logic**: Services are framework-agnostic (no FastAPI imports)

## Future Improvements

- [ ] Service interfaces/abstract base classes
- [ ] Service-level caching
- [ ] Service-level validation
- [ ] Service-level retry logic
