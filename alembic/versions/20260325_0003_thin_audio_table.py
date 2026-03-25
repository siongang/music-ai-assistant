"""thin audio table

Revision ID: 20260325_0003
Revises: 20260325_0002
Create Date: 2026-03-25 16:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260325_0003"
down_revision = "20260325_0002"
branch_labels = None
depends_on = None


def _column_exists(inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "audio" not in inspector.get_table_names():
        return

    removable_columns = [
        "file_path",
        "converted_file_path",
        "duration",
        "sample_rate",
        "channels",
        "updated_at",
    ]
    existing = [column for column in removable_columns if _column_exists(inspector, "audio", column)]
    if not existing:
        return

    with op.batch_alter_table("audio") as batch_op:
        for column in existing:
            batch_op.drop_column(column)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "audio" not in inspector.get_table_names():
        return

    with op.batch_alter_table("audio") as batch_op:
        if not _column_exists(inspector, "audio", "file_path"):
            batch_op.add_column(sa.Column("file_path", sa.String(), nullable=True))
        if not _column_exists(inspector, "audio", "converted_file_path"):
            batch_op.add_column(sa.Column("converted_file_path", sa.String(), nullable=True))
        if not _column_exists(inspector, "audio", "duration"):
            batch_op.add_column(sa.Column("duration", sa.Float(), nullable=True))
        if not _column_exists(inspector, "audio", "sample_rate"):
            batch_op.add_column(sa.Column("sample_rate", sa.Integer(), nullable=True))
        if not _column_exists(inspector, "audio", "channels"):
            batch_op.add_column(sa.Column("channels", sa.Integer(), nullable=True))
        if not _column_exists(inspector, "audio", "updated_at"):
            batch_op.add_column(
                sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True)
            )
