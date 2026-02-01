"""
Project database model.

A project is the top-level container: metadata (name, tempo, key, time signature)
and an optional object tree snapshot (JSON). Audio and jobs can be scoped to a project.
"""
import uuid
from sqlalchemy import Column, String, DateTime, Text, JSON, Float
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.job import GUID


class Project(Base):
    """
    Project model: workspace metadata and optional object tree.

    Attributes:
        id: Unique identifier (UUID)
        name: Project name
        tempo: BPM (default 120)
        key: Key signature (e.g. "C", "Am")
        time_signature: JSON {numerator, denominator} (e.g. {"numerator": 4, "denominator": 4})
        description: Optional description
        thumbnail: Optional thumbnail URL
        tree_snapshot: Optional JSON blob for object tree (objects map + root_id)
        created_at: Timestamp when project was created
        updated_at: Timestamp when project was last updated
    """
    __tablename__ = "projects"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    tempo = Column(Float, nullable=False, default=120.0)
    key = Column(String(16), nullable=False, default="C")
    time_signature = Column(JSON, nullable=False, default=lambda: {"numerator": 4, "denominator": 4})
    description = Column(Text, nullable=True)
    thumbnail = Column(String(512), nullable=True)
    tree_snapshot = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
