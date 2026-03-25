"""
ArtifactService: create, retrieve, and query artifacts.

All job handlers must use this service to record produced files.
Never write file paths directly into job.output.
"""
import hashlib
import json
import logging
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from app.artifacts.schemas import ArtifactType, ArtifactMetadata
from app.models.artifact import Artifact

logger = logging.getLogger(__name__)


class ArtifactService:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        *,
        artifact_type: ArtifactType,
        project_id: UUID,
        storage_path: str,
        producing_job_id: UUID | None = None,
        parent_artifact_id: UUID | None = None,
        metadata: ArtifactMetadata | None = None,
        file_size_bytes: int | None = None,
    ) -> Artifact:
        artifact = Artifact(
            type=artifact_type.value,
            project_id=project_id,
            storage_path=storage_path,
            producing_job_id=producing_job_id,
            parent_artifact_id=parent_artifact_id,
            artifact_metadata=metadata.model_dump() if metadata else {},
            file_size_bytes=file_size_bytes,
        )
        self.db.add(artifact)
        self.db.flush()
        logger.debug(f"Created artifact {artifact.id} type={artifact_type.value}")
        return artifact

    def get(self, artifact_id: UUID) -> Artifact | None:
        return self.db.query(Artifact).filter(Artifact.id == artifact_id).first()

    def get_required(self, artifact_id: UUID) -> Artifact:
        artifact = self.get(artifact_id)
        if artifact is None:
            raise ValueError(f"Artifact {artifact_id} not found")
        return artifact

    def list_for_project(self, project_id: UUID) -> list[Artifact]:
        return self.list_for_project_filtered(project_id=project_id)

    def list_for_project_filtered(
        self,
        *,
        project_id: UUID,
        artifact_type: str | None = None,
        parent_artifact_id: UUID | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[Artifact]:
        query = self.db.query(Artifact).filter(Artifact.project_id == project_id)
        if artifact_type is not None:
            query = query.filter(Artifact.type == artifact_type)
        if parent_artifact_id is not None:
            query = query.filter(Artifact.parent_artifact_id == parent_artifact_id)

        query = query.order_by(Artifact.created_at.desc())
        if offset is not None:
            query = query.offset(offset)
        if limit is not None:
            query = query.limit(limit)
        return query.all()

    def list_children(self, parent_artifact_id: UUID) -> list[Artifact]:
        """Return all artifacts derived from a given parent artifact."""
        return (
            self.db.query(Artifact)
            .filter(Artifact.parent_artifact_id == parent_artifact_id)
            .all()
        )

    def get_source_artifact(self, artifact_id: UUID, project_id: UUID | None = None) -> Artifact | None:
        return (
            self.db.query(Artifact)
            .filter(
                Artifact.id == artifact_id,
                Artifact.type == ArtifactType.AUDIO_FILE.value,
                *( [Artifact.project_id == project_id] if project_id is not None else [] ),
            )
            .first()
        )

    def get_required_storage_path(self, artifact: Artifact, *, prefer_original: bool = False) -> str:
        extra = (artifact.artifact_metadata or {}).get("extra") or {}
        if prefer_original:
            return extra.get("original_storage_path") or artifact.storage_path
        return artifact.storage_path

    def find_matching(
        self,
        *,
        parent_artifact_id: UUID,
        capability: str,
        provider_key: str,
        params: dict,
    ) -> Artifact | None:
        """
        Check if an identical operation was already run.
        Used to avoid re-running expensive ML jobs.

        params_hash is stored in ArtifactMetadata.params_hash by job handlers at creation
        time. Filtering is done in Python to stay dialect-portable (SQLite + PostgreSQL).
        """
        params_hash = _hash_params({"capability": capability, "provider_key": provider_key, **params})
        candidates = (
            self.db.query(Artifact)
            .filter(Artifact.parent_artifact_id == parent_artifact_id)
            .all()
        )
        for artifact in candidates:
            if (artifact.artifact_metadata or {}).get("params_hash") == params_hash:
                return artifact
        return None


def _hash_params(params: dict) -> str:
    serialized = json.dumps(params, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode()).hexdigest()[:16]
