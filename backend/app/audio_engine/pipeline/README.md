# Audio Processing Pipeline

## Purpose

Orchestrates the audio processing workflow, including stem separation and file saving.

## Key Components

- **`process_audio.py`**: Pipeline processing logic (if exists)

## Current Status

The pipeline logic is primarily handled by:
- `PipelineRunnerService` in `app/services/pipeline_runner_service.py`
- This folder may contain future pipeline-specific utilities

## Future Improvements

- [ ] Move pipeline orchestration here from services layer
- [ ] Add pipeline stages (preprocessing, separation, postprocessing)
- [ ] Add pipeline configuration system
- [ ] Add pipeline monitoring/logging
- [ ] Add pipeline error recovery
- [ ] Add pipeline caching
- [ ] Add pipeline parallelization
