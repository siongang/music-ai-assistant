"""
Project Pydantic schemas for API request/response validation.

Matches frontend ApiProject shape (snake_case) for compatibility.
"""
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID


class TimeSignatureSchema(BaseModel):
    """Time signature: numerator/denominator (e.g. 4/4)."""
    numerator: int = 4
    denominator: int = 4


class ProjectCreate(BaseModel):
    """Schema for creating a project."""
    name: str = Field(..., min_length=1, max_length=255)
    tempo: Optional[float] = Field(120.0, ge=20, le=300)
    key: Optional[str] = Field("C", max_length=16)
    time_signature: Optional[TimeSignatureSchema] = None
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    tempo: Optional[float] = Field(None, ge=20, le=300)
    key: Optional[str] = Field(None, max_length=16)
    time_signature: Optional[TimeSignatureSchema] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = Field(None, max_length=512)


class ProjectResponse(BaseModel):
    """Schema for project response (single project)."""
    id: UUID
    name: str
    tempo: float
    key: str
    time_signature: Dict[str, int]
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    root_object_id: Optional[str] = None  # From tree_snapshot.root_id for frontend
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectListItem(BaseModel):
    """Schema for project list item (minimal fields)."""
    id: UUID
    name: str
    thumbnail: Optional[str] = None
    updated_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TreeSnapshot(BaseModel):
    """
    Object tree snapshot: { objects: { id: {...} }, root_id: "..." }.
    Frontend sends/expects this shape; we store as-is in project.tree_snapshot.
    """
    objects: Dict[str, Any] = Field(default_factory=dict)
    root_id: Optional[str] = None
