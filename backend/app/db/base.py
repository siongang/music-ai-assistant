# app/db/base.py
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass


# Import all models here so Alembic can detect them
from app.models.job import Job  # noqa