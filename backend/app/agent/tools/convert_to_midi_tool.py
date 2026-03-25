"""Tool for converting audio to MIDI."""
from uuid import UUID, uuid4
from typing import Dict, Any, Optional
import logging

from app.capabilities.registry import CapabilityRegistry
from app.agent.tools.base import Tool
from app.core.constants import JobType
from app.tasks.job_tasks import process_audio_job

logger = logging.getLogger(__name__)


class ConvertToMidiTool(Tool):
    """Convert audio to MIDI format."""
    
    name = "convert_to_midi"
    description = (
        "Convert an audio file to MIDI format. This detects notes in the audio "
        "and creates a MIDI file and note events CSV. Creates a background job "
        "that may take 1-5 minutes. Returns a job_id to check status."
    )
    parameters = {
        "type": "object",
        "properties": {
            "input_artifact_id": {
                "type": "string",
                "description": "Source artifact UUID to convert"
            },
            "midi_tempo": {
                "type": "integer",
                "description": "Optional tempo for the MIDI file (BPM). If not provided, tempo is detected.",
                "minimum": 30,
                "maximum": 300
            }
        },
        "required": ["input_artifact_id"]
    }
    returns = {
        "type": "object",
        "properties": {
            "job_id": {"type": "string"},
            "status": {"type": "string"},
            "message": {"type": "string"}
        }
    }
    
    def __init__(self, job_service, artifact_service):
        self.job_service = job_service
        self.artifact_service = artifact_service
    
    def execute(
        self,
        input_artifact_id: str,
        midi_tempo: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Create MIDI conversion job."""
        logger.info(
            f"[TOOL] convert_to_midi | Starting | input_artifact_id={input_artifact_id} | midi_tempo={midi_tempo}"
        )
        capability = CapabilityRegistry.get(JobType.MIDI_TRANSCRIPTION)
        if capability is None or capability.status != "available":
            return {"status": "unavailable"}
        source_artifact = self.artifact_service.get_required(UUID(input_artifact_id))
        project_id = source_artifact.project_id
        logger.debug(
            f"[TOOL] convert_to_midi | Input validated | input_artifact_id={source_artifact.id} | project_id={project_id}"
        )
        
        # Prepare params
        params = {}
        if midi_tempo is not None:
            params["midi_tempo"] = midi_tempo
            logger.debug(f"[TOOL] convert_to_midi | Using custom tempo | midi_tempo={midi_tempo}")
        
        # Create job (project owns the job)
        job_id = uuid4()
        logger.info(
            f"[TOOL] convert_to_midi | Creating job | job_id={job_id} | "
            f"input_artifact_id={source_artifact.id} | params={params}"
        )
        
        job = self.job_service.create_job(
            job_id=job_id,
            job_type=JobType.MIDI_TRANSCRIPTION,
            input_data={"input_artifact_id": str(source_artifact.id)},
            params=params,
            project_id=project_id,
        )
        
        logger.info(f"[TOOL] convert_to_midi | Job created | job_id={job_id} | status={job.status}")
        
        # Enqueue for processing
        logger.info(f"[TOOL] convert_to_midi | Enqueuing job for processing | job_id={job_id}")
        process_audio_job.delay(str(job_id))
        
        result = {
            "job_id": str(job_id),
            "status": "queued",
            "message": f"MIDI conversion job created. Use get_job_status('{job_id}') to check progress."
        }
        
        logger.info(f"[TOOL] convert_to_midi | Job queued successfully | job_id={job_id} | status=queued")
        return result
