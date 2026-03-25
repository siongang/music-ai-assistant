"""
Stem separation job handler.

Orchestrates: input artifact → DemucsProvider (or any registered provider) → output artifacts.
Does NOT import demucs directly. Uses the provider passed in from the dispatcher.
"""
import logging
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from app.artifacts.schemas import ArtifactType, ArtifactMetadata
from app.artifacts.service import ArtifactService
from app.capabilities.stems import StemSeparationInput
from app.core.constants import JobStatus, STORAGE_ROOT
from app.services.job_service import JobService
from app.storage.local_storage import LocalStorage

logger = logging.getLogger(__name__)


def handle_stem_separation(job, provider, db: Session) -> dict:
    """
    Execute stem separation for a job.

    Args:
        job: Job DB model (job.type must be "stem_separation")
        provider: A registered BaseProvider[StemSeparationInput, StemSeparationOutput]
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

    # Prepare output directory
    output_dir = storage.job_path(str(job.id)) / "stems"
    output_dir.mkdir(parents=True, exist_ok=True)

    params = job.params or {}
    stems_requested = params.get("stems_requested", ["vocals", "drums", "bass", "other"])

    # Build provider input — point output to job-specific dir
    # We pass a copy of the audio at the expected location
    provider_input = StemSeparationInput(
        audio_path=audio_path,
        output_dir=output_dir,
        stems_requested=stems_requested,
    )

    # Run the provider — this is the only place model code is invoked
    output = provider.run(provider_input)

    # Create an artifact record for each stem
    output_artifact_ids: list[str] = []
    for stem_file in output.stems:
        relative_path = stem_file.output_path.relative_to(storage.root)
        artifact = artifact_service.create(
            artifact_type=ArtifactType.STEM_AUDIO,
            project_id=job.project_id,
            storage_path=str(relative_path),
            producing_job_id=job.id,
            parent_artifact_id=source_artifact.id,
            file_size_bytes=stem_file.output_path.stat().st_size if stem_file.output_path.exists() else None,
            metadata=ArtifactMetadata(
                confidence=stem_file.confidence,
                model_provider_key=output.model_metadata.provider_key,
                model_name=output.model_metadata.model_name,
                model_version=output.model_metadata.model_version,
                model_params=output.model_metadata.params_used,
                processing_time_seconds=output.model_metadata.processing_time_seconds,
                sample_rate=output.sample_rate,
                stem_name=stem_file.stem_name,
            ),
        )
        output_artifact_ids.append(str(artifact.id))

    job_service.update_job_status(
        job.id,
        JobStatus.SUCCEEDED,
        progress=1.0,
        output={"artifact_ids": output_artifact_ids},
    )
    db.commit()

    logger.info(f"Stem separation job {job.id} succeeded. {len(output_artifact_ids)} artifacts created.")
    return {"status": "succeeded", "output_artifact_ids": output_artifact_ids}
