"""
Job dispatcher.

Resolves capability → provider → handler, then executes.
This is the single routing point for all job execution.
Job handlers must NOT be called directly from anywhere else.
"""
import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.providers.registry import ProviderRegistry, initialize_provider_registry
from app.capabilities.registry import CapabilityRegistry
from app.services.job_service import JobService
from app.core.constants import DEFAULT_PROVIDERS, JobStatus

logger = logging.getLogger(__name__)


class JobDispatcher:
    def __init__(self, db: Session):
        initialize_provider_registry()
        self.db = db
        self.job_service = JobService(db)

    def dispatch(self, job_id: UUID) -> dict:
        """
        Execute a job by routing it to the correct capability handler.

        1. Load job from DB
        2. Resolve capability definition (validate it's known and available)
        3. Resolve provider (use job.provider_key or default)
        4. Load input artifact
        5. Call the appropriate handler
        6. Return result dict

        All status updates happen inside this method or the handler.
        """
        job = self.job_service.get_job(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found")

        capability_name = job.type  # job.type stores capability name
        provider_key = (job.params or {}).get("provider_key") or DEFAULT_PROVIDERS.get(capability_name)
        if provider_key is None:
            return self._fail(job_id, f"No provider configured for capability '{capability_name}'")

        cap_def = CapabilityRegistry.get(capability_name)
        if cap_def is None:
            return self._fail(job_id, f"Unknown capability: {capability_name}")
        if cap_def.status == "stub":
            return self._fail(job_id, f"Capability '{capability_name}' has no registered provider yet")

        try:
            provider = ProviderRegistry.get(capability_name, provider_key)
        except KeyError as e:
            return self._fail(job_id, str(e))

        if not provider.is_available:
            return self._fail(job_id, f"Provider '{provider_key}' is not available in this environment")

        self.job_service.update_job_status(job_id, JobStatus.RUNNING, progress=0.0)

        try:
            result = self._run_handler(capability_name, job, provider)
            return result
        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}", exc_info=True)
            return self._fail(job_id, str(e))

    def _run_handler(self, capability_name: str, job, provider) -> dict:
        if capability_name == "stem_separation":
            from app.jobs.handlers.stem_separation import handle_stem_separation
            return handle_stem_separation(job, provider, self.db)
        elif capability_name == "midi_transcription":
            from app.jobs.handlers.midi_transcription import handle_midi_transcription
            return handle_midi_transcription(job, provider, self.db)
        else:
            return self._fail(job.id, f"No handler implemented for capability: {capability_name}")

    def _fail(self, job_id: UUID, error: str) -> dict:
        logger.error(f"Job {job_id} failed: {error}")
        self.job_service.update_job_status(job_id, JobStatus.FAILED, error_message=error)
        return {"status": "failed", "error": error}
