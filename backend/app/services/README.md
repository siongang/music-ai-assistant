# Services Layer

## Purpose

Business logic and orchestration layer. Services coordinate between different components and implement business rules.

## Key Components

- **`job_service.py`**: Database operations for jobs (CRUD)
- **`pipeline_runner_service.py`**: Orchestrates audio processing pipeline
- **`stem_service.py`**: High-level interface for stem separation
- **`midi_service.py`**: High-level interface for MIDI conversion
- **`audio_service.py`**: Database operations for audio files

## Architecture

```
API Endpoint
  ↓
Service Layer (this folder)
  ↓
Storage / Audio Engine / Database
```

## Service Responsibilities

### JobService
- Create, read, update jobs in database
- Query jobs by status
- Handle job status transitions

### PipelineRunnerService
- Orchestrate audio processing workflows
- Coordinate between services and file I/O
- Handle stem separation, MIDI conversion
- Handle pipeline errors

### StemService
- High-level interface for stem separation
- Wraps DemucsSeparator (audio engine)
- Returns raw tensors (no file I/O)
- Provides clean API for rest of application

### MidiService
- High-level interface for MIDI conversion
- Wraps ToMidi (audio engine)
- Returns raw MIDI data and note events (no file I/O)
- Uses Basic Pitch for audio-to-MIDI conversion

### AudioService
- Database operations for audio files
- Get audio file paths
- Validate audio existence

## Important Notes

1. **Single Responsibility**: Each service has a focused responsibility
2. **Separation of Concerns**: Services return raw data, pipeline runner handles file I/O
3. **Dependency Injection**: Services receive dependencies via constructor
4. **Error Handling**: Services should handle and log errors appropriately
5. **Transaction Management**: Services use database sessions for transactions
6. **No HTTP Logic**: Services are framework-agnostic (no FastAPI imports)

## Architecture Pattern

Services follow a consistent pattern:
```
Audio File
    ↓
[Audio Engine] → Returns raw data (tensors, MIDI objects)
    ↓
[Service Layer] → Wraps engine, returns raw data
    ↓
[Pipeline Runner] → Handles file I/O and storage
    ↓
Storage
```

**Example:**
- `ToMidi.predict()` → Raw MIDI data (no file I/O)
- `MidiService.convert_to_midi()` → Raw MIDI data (no file I/O)
- `PipelineRunnerService.process_midi_conversion()` → Saves files, returns paths

## Future Improvements

- [ ] Add service interfaces/abstract base classes
- [ ] Add service-level caching
- [ ] Add service-level validation
- [ ] Add service-level logging/metrics
- [ ] Add service-level retry logic
- [ ] Add service-level rate limiting
- [ ] Add service-level circuit breakers
- [ ] Add service tests
- [ ] Add service documentation

## Dependencies

- Database sessions (SQLAlchemy)
- Storage implementations
- Audio engine components
