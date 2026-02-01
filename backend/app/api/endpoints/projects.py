"""
Projects API endpoints.

Provides CRUD for projects and GET/PUT for object tree snapshot.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import logging

from app.db.session import get_db
from app.services.project_service import ProjectService
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListItem,
    TreeSnapshot,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


def get_project_service(db: Session = Depends(get_db)) -> ProjectService:
    return ProjectService(db)


def _project_to_response(project) -> ProjectResponse:
    """Build ProjectResponse from Project model (root_object_id from tree_snapshot)."""
    root_id = None
    if project.tree_snapshot and isinstance(project.tree_snapshot, dict):
        root_id = project.tree_snapshot.get("root_id")
    return ProjectResponse(
        id=project.id,
        name=project.name,
        tempo=project.tempo,
        key=project.key,
        time_signature=project.time_signature or {"numerator": 4, "denominator": 4},
        description=project.description,
        thumbnail=project.thumbnail,
        root_object_id=root_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.post("", response_model=ProjectResponse, status_code=http_status.HTTP_201_CREATED)
def create_project(
    body: ProjectCreate,
    project_service: ProjectService = Depends(get_project_service),
):
    """Create a new project."""
    time_sig = body.time_signature.model_dump() if body.time_signature else None
    project = project_service.create_project(
        name=body.name,
        tempo=body.tempo or 120.0,
        key=body.key or "C",
        time_signature=time_sig,
        description=body.description,
    )
    return _project_to_response(project)


@router.get("", response_model=List[ProjectListItem])
def list_projects(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    project_service: ProjectService = Depends(get_project_service),
):
    """List projects (newest first)."""
    projects = project_service.list_projects(limit=limit, offset=offset)
    return [
        ProjectListItem(
            id=p.id,
            name=p.name,
            thumbnail=p.thumbnail,
            updated_at=p.updated_at,
            created_at=p.created_at,
        )
        for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    project_service: ProjectService = Depends(get_project_service),
):
    """Get a project by ID."""
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )
    return _project_to_response(project)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    project_service: ProjectService = Depends(get_project_service),
):
    """Update a project (partial update)."""
    project = project_service.update_project(
        project_id=project_id,
        name=body.name,
        tempo=body.tempo,
        key=body.key,
        time_signature=body.time_signature.model_dump() if body.time_signature else None,
        description=body.description,
        thumbnail=body.thumbnail,
    )
    if not project:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )
    return _project_to_response(project)


@router.delete("/{project_id}", status_code=http_status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    project_service: ProjectService = Depends(get_project_service),
):
    """Delete a project."""
    deleted = project_service.delete_project(project_id)
    if not deleted:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )


@router.get("/{project_id}/tree")
def get_project_tree(
    project_id: UUID,
    project_service: ProjectService = Depends(get_project_service),
):
    """Get object tree snapshot for a project. Returns { objects, root_id }; empty if none set."""
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )
    tree = project.tree_snapshot
    if tree and isinstance(tree, dict):
        return tree
    return {"objects": {}, "root_id": None}


@router.put("/{project_id}/tree")
def put_project_tree(
    project_id: UUID,
    body: TreeSnapshot,
    project_service: ProjectService = Depends(get_project_service),
):
    """Set object tree snapshot for a project. Body: { objects: {...}, root_id: "..." }."""
    tree = body.model_dump()
    project = project_service.set_tree(project_id, tree)
    if not project:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )
    return tree
