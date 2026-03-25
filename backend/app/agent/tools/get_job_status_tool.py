"""Tool for checking job status."""
from uuid import UUID
from typing import Dict, Any
import logging
from app.agent.tools.base import Tool

logger = logging.getLogger(__name__)


class GetJobStatusTool(Tool):
    """Get status and results of a processing job."""
    
    name = "get_job_status"
    description = (
        "Check the status of a processing job (stem separation, MIDI conversion, etc.). "
        "Returns the current status (queued, running, succeeded, failed), progress, "
        "and output files if completed."
    )
    parameters = {
        "type": "object",
        "properties": {
            "job_id": {
                "type": "string",
                "description": "UUID of the job to check"
            }
        },
        "required": ["job_id"]
    }
    returns = {
        "type": "object",
        "properties": {
            "job_id": {"type": "string"},
            "capability": {"type": "string"},
            "status": {"type": "string"},
            "progress": {"type": "number"},
            "output": {"type": "object"},
            "error_message": {"type": "string"}
        }
    }
    
    def __init__(self, job_service):
        self.job_service = job_service
    
    def execute(self, job_id: str) -> Dict[str, Any]:
        """Get job status."""
        logger.info(f"[TOOL] get_job_status | Checking job | job_id={job_id}")
        
        try:
            job_uuid = UUID(job_id)
        except ValueError:
            logger.error(f"[TOOL] get_job_status | Invalid job_id format | job_id={job_id}")
            raise ValueError(f"Invalid job_id format: {job_id}")
        
        job = self.job_service.get_job(job_uuid)
        if not job:
            logger.error(f"[TOOL] get_job_status | Job not found | job_id={job_id}")
            raise ValueError(f"Job {job_id} not found")
        
        logger.info(f"[TOOL] get_job_status | Job found | job_id={job_id} | type={job.type} | status={job.status} | progress={job.progress}")
        
        result = {
            "job_id": str(job.id),
            "capability": job.type,
            "status": job.status,
            "progress": job.progress
        }
        
        if job.output:
            result["output"] = job.output
            logger.debug(f"[TOOL] get_job_status | Job has output | job_id={job_id} | output_keys={list(job.output.keys()) if isinstance(job.output, dict) else 'N/A'}")
        
        if job.error_message:
            result["error_message"] = job.error_message
            logger.warning(f"[TOOL] get_job_status | Job has error | job_id={job_id} | error={job.error_message}")
        
        logger.info(f"[TOOL] get_job_status | Status retrieved | job_id={job_id} | status={job.status} | progress={job.progress}%")
        return result
