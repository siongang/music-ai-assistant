"""create artifacts table

Revision ID: 20260325_0001
Revises:
Create Date: 2026-03-25 10:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260325_0001"
down_revision = None
branch_labels = None
depends_on = None


def _guid_type(dialect_name: str):
    if dialect_name == "postgresql":
        from sqlalchemy.dialects.postgresql import UUID

        return UUID(as_uuid=True)
    return sa.String(length=36)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "artifacts" in inspector.get_table_names():
        return

    guid = _guid_type(bind.dialect.name)

    op.create_table(
        "artifacts",
        sa.Column("id", guid, primary_key=True, nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("project_id", guid, sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("producing_job_id", guid, sa.ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("parent_artifact_id", guid, nullable=True),
        sa.Column("storage_path", sa.Text(), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )
    op.create_index("ix_artifacts_project_id", "artifacts", ["project_id"])
    op.create_index("ix_artifacts_parent_artifact_id", "artifacts", ["parent_artifact_id"])
    op.create_index("ix_artifacts_type", "artifacts", ["type"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "artifacts" not in inspector.get_table_names():
        return

    op.drop_index("ix_artifacts_type", table_name="artifacts")
    op.drop_index("ix_artifacts_parent_artifact_id", table_name="artifacts")
    op.drop_index("ix_artifacts_project_id", table_name="artifacts")
    op.drop_table("artifacts")
