"""Tool for checking job status."""
from uuid import UUID
from typing import Dict, Any
from app.agent.tools.base import Tool


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
            "type": {"type": "string"},
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
        try:
            job_uuid = UUID(job_id)
        except ValueError:
            raise ValueError(f"Invalid job_id format: {job_id}")
        
        job = self.job_service.get_job(job_uuid)
        if not job:
            raise ValueError(f"Job {job_id} not found")
        
        result = {
            "job_id": str(job.id),
            "type": job.type,
            "status": job.status,
            "progress": job.progress
        }
        
        if job.output:
            result["output"] = job.output
        
        if job.error_message:
            result["error_message"] = job.error_message
        
        return result
