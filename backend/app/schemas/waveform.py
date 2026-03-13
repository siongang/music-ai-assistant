"""
Waveform schemas for API requests/responses.
"""
from pydantic import BaseModel, Field
from typing import List, Dict


class WaveformPeak(BaseModel):
    """A single waveform peak with min/max values."""
    min: float = Field(..., ge=-1.0, le=1.0, description="Minimum amplitude")
    max: float = Field(..., ge=-1.0, le=1.0, description="Maximum amplitude")


class WaveformResponse(BaseModel):
    """Waveform visualization data response."""
    audio_id: str = Field(..., description="Audio ID")
    level: int = Field(..., description="Samples per second (zoom level)")
    duration: float = Field(..., description="Duration in seconds")
    channels: int = Field(..., description="Number of audio channels")
    peaks: List[Dict[str, float]] = Field(..., description="Array of min/max peak pairs")
    
    class Config:
        json_schema_extra = {
            "example": {
                "audio_id": "123e4567-e89b-12d3-a456-426614174000",
                "level": 512,
                "duration": 180.5,
                "channels": 2,
                "peaks": [
                    {"min": -0.5, "max": 0.7},
                    {"min": -0.3, "max": 0.4}
                ]
            }
        }
