"""Tool for converting audio to MIDI."""
from uuid import UUID, uuid4
from typing import Dict, Any, Optional
from app.agent.tools.base import Tool
from app.core.constants import JobType
from app.tasks.job_tasks import process_audio_job


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
            "audio_id": {
                "type": "string",
                "description": "UUID of the audio file to convert"
            },
            "midi_tempo": {
                "type": "integer",
                "description": "Optional tempo for the MIDI file (BPM). If not provided, tempo is detected.",
                "minimum": 30,
                "maximum": 300
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
        self.job_service = job_service
        self.audio_service = audio_service
    
    def execute(self, audio_id: str, midi_tempo: Optional[int] = None) -> Dict[str, Any]:
        """Create MIDI conversion job."""
        try:
            audio_uuid = UUID(audio_id)
        except ValueError:
            raise ValueError(f"Invalid audio_id format: {audio_id}")
        
        # Validate audio exists
        audio_path = self.audio_service.get_audio_path(audio_uuid)
        if not audio_path:
            raise ValueError(f"Audio {audio_id} not found")
        
        # Prepare params
        params = {}
        if midi_tempo is not None:
            params["midi_tempo"] = midi_tempo
        
        # Create job
        job_id = uuid4()
        job = self.job_service.create_job(
            job_id=job_id,
            job_type=JobType.MIDI_CONVERSION,
            input_data={"audio_id": audio_id},
            params=params
        )
        
        # Enqueue for processing
        process_audio_job.delay(str(job_id))
        
        return {
            "job_id": str(job_id),
            "status": "queued",
            "message": f"MIDI conversion job created. Use get_job_status('{job_id}') to check progress."
        }
