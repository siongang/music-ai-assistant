"""Tool for separating audio into stems."""
from uuid import UUID, uuid4
from typing import Dict, Any
import logging
from app.agent.tools.base import Tool
from app.core.constants import JobType
from app.tasks.job_tasks import process_audio_job

logger = logging.getLogger(__name__)


class SeparateStemsTool(Tool):
    """Separate audio into individual stems (vocals, drums, bass, other)."""
    
    name = "separate_stems"
    description = (
        "Separate an audio file into individual stems: vocals, drums, bass, and other. "
        "This creates a background job that may take 1-5 minutes to complete. "
        "Returns a job_id that can be checked with get_job_status."
    )
    parameters = {
        "type": "object",
        "properties": {
            "audio_id": {
                "type": "string",
                "description": "UUID of the audio file to process"
            }
        },
        "required": ["audio_id"]
    }
    returns = {
        "type": "object",
        "properties": {
            "job_id": {"type": "string"},
            "status": {"type": "string"},
            "message": {"type": "string"}
        }
    }
    
    def __init__(self, job_service, audio_service):
        """
        Initialize tool with services.
        
        Args:
            job_service: JobService instance
            audio_service: AudioService instance
        """
        self.job_service = job_service
        self.audio_service = audio_service
    
    def execute(self, audio_id: str) -> Dict[str, Any]:
        """Create stem separation job."""
        logger.info(f"[TOOL] separate_stems | Starting | audio_id={audio_id}")
        
        try:
            audio_uuid = UUID(audio_id)
        except ValueError:
            logger.error(f"[TOOL] separate_stems | Invalid audio_id format | audio_id={audio_id}")
            raise ValueError(f"Invalid audio_id format: {audio_id}")
        
        # Validate audio exists
        audio_path = self.audio_service.get_audio_path(audio_uuid)
        if not audio_path:
            logger.error(f"[TOOL] separate_stems | Audio not found | audio_id={audio_id}")
            raise ValueError(f"Audio {audio_id} not found")
        
        logger.debug(f"[TOOL] separate_stems | Audio validated | audio_id={audio_id} | path={audio_path}")
        
        # Create job
        job_id = uuid4()
        logger.info(f"[TOOL] separate_stems | Creating job | job_id={job_id} | audio_id={audio_id}")
        
        job = self.job_service.create_job(
            job_id=job_id,
            job_type=JobType.STEM_SEPARATION,
            input_data={"audio_id": audio_id},
            params={}
        )
        
        logger.info(f"[TOOL] separate_stems | Job created | job_id={job_id} | status={job.status}")
        
        # Enqueue for processing
        logger.info(f"[TOOL] separate_stems | Enqueuing job for processing | job_id={job_id}")
        process_audio_job.delay(str(job_id))
        
        result = {
            "job_id": str(job_id),
            "status": "queued",
            "message": f"Stem separation job created. Use get_job_status('{job_id}') to check progress."
        }
        
        logger.info(f"[TOOL] separate_stems | Job queued successfully | job_id={job_id} | status=queued")
        return result
