"""add source_audio_id to artifacts

Revision ID: 20260325_0002
Revises: 20260325_0001
Create Date: 2026-03-25 13:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260325_0002"
down_revision = "20260325_0001"
branch_labels = None
depends_on = None


def _column_exists(inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "artifacts" not in inspector.get_table_names():
        return
    if _column_exists(inspector, "artifacts", "source_audio_id"):
        return

    guid = sa.String(length=36)
    if bind.dialect.name == "postgresql":
        from sqlalchemy.dialects.postgresql import UUID

        guid = UUID(as_uuid=True)

    op.add_column("artifacts", sa.Column("source_audio_id", guid, nullable=True))
    op.create_index("ix_artifacts_source_audio_id", "artifacts", ["source_audio_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "artifacts" not in inspector.get_table_names():
        return
    if not _column_exists(inspector, "artifacts", "source_audio_id"):
        return

    op.drop_index("ix_artifacts_source_audio_id", table_name="artifacts")
    op.drop_column("artifacts", "source_audio_id")
