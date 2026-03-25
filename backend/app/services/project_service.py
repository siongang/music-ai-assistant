"""
Project service for database operations.

Handles project CRUD, object tree snapshot (GET/PUT), and cascade delete
(project owns artifacts and jobs; deleting a project deletes their DB rows and storage).
"""
import shutil
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.artifacts.schemas import ArtifactType
from app.models.artifact import Artifact
from app.models.project import Project
from app.models.job import Job
from app.core.constants import STORAGE_ROOT, AUDIO_DIR, JOBS_DIR

logger = logging.getLogger(__name__)


class ProjectService:
    """
    Service for project database operations and tree snapshot.
    """

    def __init__(self, db: Session):
        self.db = db

    def create_project(
        self,
        name: str,
        tempo: float = 120.0,
        key: str = "C",
        time_signature: Optional[Dict[str, int]] = None,
        description: Optional[str] = None,
    ) -> Project:
        """Create a new project."""
        ts = time_signature or {"numerator": 4, "denominator": 4}
        project = Project(
            name=name,
            tempo=tempo,
            key=key,
            time_signature=ts,
            description=description,
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        logger.debug(f"Created project: {project.id} name={name}")
        return project

    def get_project(self, project_id: UUID) -> Optional[Project]:
        """Get a project by ID."""
        return self.db.query(Project).filter(Project.id == project_id).first()

    def list_projects(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Project]:
        """List projects, newest first."""
        return (
            self.db.query(Project)
            .order_by(Project.updated_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    def update_project(
        self,
        project_id: UUID,
        name: Optional[str] = None,
        tempo: Optional[float] = None,
        key: Optional[str] = None,
        time_signature: Optional[Dict[str, int]] = None,
        description: Optional[str] = None,
        thumbnail: Optional[str] = None,
    ) -> Optional[Project]:
        """Update project fields (only provided fields)."""
        project = self.get_project(project_id)
        if not project:
            return None
        if name is not None:
            project.name = name
        if tempo is not None:
            project.tempo = tempo
        if key is not None:
            project.key = key
        if time_signature is not None:
            project.time_signature = time_signature
        if description is not None:
            project.description = description
        if thumbnail is not None:
            project.thumbnail = thumbnail
        self.db.commit()
        self.db.refresh(project)
        logger.debug(f"Updated project: {project_id}")
        return project

    def delete_project(self, project_id: UUID) -> bool:
        """
        Delete a project and all owned data.
        Removes project's artifact and job storage, then deletes project.
        Returns True if deleted.
        """
        project = self.get_project(project_id)
        if not project:
            return False
        root = Path(STORAGE_ROOT)
        # Delete storage for all source audio artifacts owned by this project
        for artifact in self.db.query(Artifact).filter(
            Artifact.project_id == project_id,
            Artifact.type == ArtifactType.AUDIO_FILE.value,
        ).all():
            audio_dir = root / AUDIO_DIR / str(artifact.id)
            if audio_dir.exists():
                try:
                    shutil.rmtree(audio_dir)
                    logger.debug(f"Deleted audio storage: {audio_dir}")
                except OSError as e:
                    logger.warning(f"Could not delete audio dir {audio_dir}: {e}")
        # Delete storage for all jobs owned by this project
        for job in self.db.query(Job).filter(Job.project_id == project_id).all():
            job_dir = root / JOBS_DIR / str(job.id)
            if job_dir.exists():
                try:
                    shutil.rmtree(job_dir)
                    logger.debug(f"Deleted job storage: {job_dir}")
                except OSError as e:
                    logger.warning(f"Could not delete job dir {job_dir}: {e}")
        self.db.delete(project)
        self.db.commit()
        logger.debug(f"Deleted project: {project_id}")
        return True

    def get_tree(self, project_id: UUID) -> Optional[Dict[str, Any]]:
        """Get object tree snapshot for a project. Returns None if no tree or project not found."""
        project = self.get_project(project_id)
        if not project:
            return None
        return project.tree_snapshot

    def set_tree(self, project_id: UUID, tree: Dict[str, Any]) -> Optional[Project]:
        """Set object tree snapshot for a project. Returns updated project or None."""
        project = self.get_project(project_id)
        if not project:
            return None
        project.tree_snapshot = tree
        self.db.commit()
        self.db.refresh(project)
        logger.debug(f"Updated tree for project: {project_id}")
        return project
