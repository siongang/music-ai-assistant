"""
Audio Session schemas for API requests/responses.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ClipData(BaseModel):
    """Clip placement on timeline."""
    id: str = Field(..., description="Clip ID")
    assetId: str = Field(..., description="Audio asset ID (backend audio_id)")
    start: float = Field(..., ge=0, description="Timeline position in seconds")
    in_: float = Field(0, ge=0, alias="in", description="Source offset in seconds")
    duration: float = Field(..., gt=0, description="Clip duration in seconds")
    playbackRate: float = Field(1.0, gt=0, le=2.0, description="Playback speed multiplier")


class TrackData(BaseModel):
    """Track configuration with clips."""
    id: str = Field(..., description="Track ID")
    name: str = Field("Untitled Track", description="Track name")
    audioObjectId: Optional[str] = Field(None, description="Associated musical object ID")
    gain: float = Field(1.0, ge=0, le=2.0, description="Track gain (0-2)")
    pan: float = Field(0.0, ge=-1.0, le=1.0, description="Track pan (-1 to 1)")
    mute: bool = Field(False, description="Track muted")
    solo: bool = Field(False, description="Track soloed")
    clips: List[ClipData] = Field(default_factory=list, description="Clips on this track")


class AudioSessionCreate(BaseModel):
    """Create audio session request."""
    name: str = Field("Untitled Session", max_length=255, description="Session name")
    tracks: List[TrackData] = Field(default_factory=list, description="Track configurations")
    masterGain: float = Field(1.0, ge=0, le=2.0, alias="master_gain", description="Master gain")


class AudioSessionUpdate(BaseModel):
    """Update audio session request."""
    name: Optional[str] = Field(None, max_length=255, description="Session name")
    tracks: Optional[List[TrackData]] = Field(None, description="Track configurations")
    masterGain: Optional[float] = Field(None, ge=0, le=2.0, alias="master_gain", description="Master gain")


class AudioSessionResponse(BaseModel):
    """Audio session response."""
    id: str = Field(..., description="Session ID")
    project_id: str = Field(..., description="Project ID")
    name: str = Field(..., description="Session name")
    tracks: List[TrackData] = Field(..., description="Track configurations")
    master_gain: float = Field(..., description="Master gain")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True


class AudioSessionListItem(BaseModel):
    """Audio session list item (minimal info)."""
    id: str = Field(..., description="Session ID")
    project_id: str = Field(..., description="Project ID")
    name: str = Field(..., description="Session name")
    updated_at: datetime = Field(..., description="Last update timestamp")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        from_attributes = True
