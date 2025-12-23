from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class JobResponse(BaseModel):
    id: UUID
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    status: str = "pending"
