# Audio Processing Pipeline

## Purpose

Orchestrates the audio processing workflow, including stem separation and file saving.

## Current Status

The pipeline logic is primarily handled by `PipelineRunnerService` in `app/services/pipeline_runner_service.py`. This folder may contain future pipeline-specific utilities.

## Future Improvements

- [ ] Move pipeline orchestration here from services layer
- [ ] Pipeline stages (preprocessing, separation, postprocessing)
- [ ] Pipeline configuration system
- [ ] Pipeline monitoring/logging
- [ ] Pipeline error recovery
