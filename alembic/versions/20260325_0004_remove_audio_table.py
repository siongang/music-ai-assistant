"""remove audio table and source_audio_id from artifacts

Revision ID: 20260325_0004
Revises: 20260325_0003
Create Date: 2026-03-25 18:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260325_0004"
down_revision = "20260325_0003"
branch_labels = None
depends_on = None


def _column_exists(inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if (
        "artifacts" in inspector.get_table_names()
        and _column_exists(inspector, "artifacts", "source_audio_id")
        and "projects" in inspector.get_table_names()
    ):
        with op.batch_alter_table("artifacts") as batch_op:
            try:
                batch_op.drop_index("ix_artifacts_source_audio_id")
            except Exception:
                pass
            batch_op.drop_column("source_audio_id")

    if "audio" in inspector.get_table_names():
        op.drop_table("audio")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "audio" not in inspector.get_table_names():
        guid = sa.String(length=36)
        if bind.dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID
            guid = UUID(as_uuid=True)

        op.create_table(
            "audio",
            sa.Column("id", guid, primary_key=True, nullable=False),
            sa.Column("project_id", guid, sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
            sa.Column("filename", sa.String(), nullable=False),
            sa.Column("original_format", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )

    if (
        "artifacts" in inspector.get_table_names()
        and "projects" in inspector.get_table_names()
        and not _column_exists(inspector, "artifacts", "source_audio_id")
    ):
        guid = sa.String(length=36)
        if bind.dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID
            guid = UUID(as_uuid=True)
        with op.batch_alter_table("artifacts") as batch_op:
            batch_op.add_column(sa.Column("source_audio_id", guid, nullable=True))
            batch_op.create_index("ix_artifacts_source_audio_id", ["source_audio_id"], unique=False)
