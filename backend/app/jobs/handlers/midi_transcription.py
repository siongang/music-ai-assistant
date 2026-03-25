"""
MIDI transcription job handler.

Orchestrates: input artifact → BasicPitchProvider (or any registered provider) → output artifacts.
Does NOT import basic_pitch directly. Uses the provider passed in from the dispatcher.
"""
import csv
import logging
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from app.artifacts.schemas import ArtifactType, ArtifactMetadata
from app.artifacts.service import ArtifactService
from app.capabilities.midi import MidiTranscriptionInput
from app.core.constants import JobStatus, STORAGE_ROOT
from app.services.job_service import JobService
from app.storage.local_storage import LocalStorage

logger = logging.getLogger(__name__)


def handle_midi_transcription(job, provider, db: Session) -> dict:
    """
    Execute MIDI transcription for a job.

    Args:
        job: Job DB model (job.type must be "midi_transcription")
        provider: A registered BaseProvider[MidiTranscriptionInput, MidiTranscriptionOutput]
        db: Active database session

    Returns:
        dict with status and output_artifact_ids
    """
    job_service = JobService(db)
    artifact_service = ArtifactService(db)
    storage = LocalStorage(Path(STORAGE_ROOT))

    input_artifact_id = (job.input or {}).get("input_artifact_id")
    if not input_artifact_id:
        raise ValueError("Job input missing input_artifact_id")

    source_artifact = artifact_service.get_required(UUID(input_artifact_id))
    audio_path = storage.root / source_artifact.storage_path
    if not audio_path.exists():
        raise FileNotFoundError(f"Input artifact file not found for id {input_artifact_id}")

    output_dir = storage.job_path(str(job.id)) / "midi"
    output_dir.mkdir(parents=True, exist_ok=True)

    params = job.params or {}
    provider_input = MidiTranscriptionInput(
        audio_path=audio_path,
        output_dir=output_dir,
        onset_threshold=params.get("onset_threshold", 0.5),
        frame_threshold=params.get("frame_threshold", 0.3),
        minimum_note_length_seconds=params.get("minimum_note_length_seconds", 0.05),
        midi_tempo=params.get("midi_tempo"),
    )

    output = provider.run(provider_input)

    output_artifact_ids: list[str] = []

    # MIDI file artifact
    if output.midi_path.exists():
        midi_relative = output.midi_path.relative_to(storage.root)
        midi_artifact = artifact_service.create(
            artifact_type=ArtifactType.MIDI_FILE,
            project_id=job.project_id,
            storage_path=str(midi_relative),
            producing_job_id=job.id,
            parent_artifact_id=source_artifact.id,
            file_size_bytes=output.midi_path.stat().st_size,
            metadata=ArtifactMetadata(
                confidence=output.confidence,
                model_provider_key=output.model_metadata.provider_key,
                model_name=output.model_metadata.model_name,
                model_version=output.model_metadata.model_version,
                model_params=output.model_metadata.params_used,
                processing_time_seconds=output.model_metadata.processing_time_seconds,
            ),
        )
        output_artifact_ids.append(str(midi_artifact.id))

    # Note events artifact (CSV)
    if output.note_events:
        notes_path = output_dir / (audio_path.stem + "_notes.csv")
        _write_note_events_csv(output.note_events, notes_path)
        notes_relative = notes_path.relative_to(storage.root)
        notes_artifact = artifact_service.create(
            artifact_type=ArtifactType.NOTE_EVENTS,
            project_id=job.project_id,
            storage_path=str(notes_relative),
            producing_job_id=job.id,
            parent_artifact_id=source_artifact.id,
            file_size_bytes=notes_path.stat().st_size,
            metadata=ArtifactMetadata(
                confidence=output.confidence,
                model_provider_key=output.model_metadata.provider_key,
                model_name=output.model_metadata.model_name,
                model_version=output.model_metadata.model_version,
                model_params=output.model_metadata.params_used,
                processing_time_seconds=output.model_metadata.processing_time_seconds,
                extra={"note_count": output.note_count},
            ),
        )
        output_artifact_ids.append(str(notes_artifact.id))

    job_service.update_job_status(
        job.id,
        JobStatus.SUCCEEDED,
        progress=1.0,
        output={"artifact_ids": output_artifact_ids},
    )
    db.commit()

    logger.info(f"MIDI transcription job {job.id} succeeded. {len(output_artifact_ids)} artifacts created.")
    return {"status": "succeeded", "output_artifact_ids": output_artifact_ids}


def _write_note_events_csv(note_events, path: Path) -> None:
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["start_time", "end_time", "pitch", "velocity", "confidence"])
        writer.writeheader()
        for note in note_events:
            writer.writerow({
                "start_time": note.start_time,
                "end_time": note.end_time,
                "pitch": note.pitch,
                "velocity": note.velocity,
                "confidence": note.confidence,
            })
