from __future__ import annotations

from pathlib import Path
import io
import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def app_client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    storage_root = tmp_path / "storage"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("STORAGE_ROOT", str(storage_root))

    from app.db import session as db_session
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
        echo=False,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    monkeypatch.setattr(db_session, "engine", engine)
    monkeypatch.setattr(db_session, "SessionLocal", TestingSessionLocal)

    from app.core import constants as app_constants
    monkeypatch.setattr(app_constants, "STORAGE_ROOT", storage_root)

    from app.db.base import Base
    from app.models import AgentStep, Artifact, AudioSession, Job, Project, Session  # noqa: F401

    Base.metadata.create_all(bind=engine)

    from app.tasks import job_tasks
    monkeypatch.setattr(job_tasks, "SessionLocal", TestingSessionLocal)

    from app.api.endpoints import audio as audio_endpoint
    from app.api.endpoints import project_artifacts as project_artifacts_endpoint
    from app.api.endpoints import waveform as waveform_endpoint
    from app.jobs.handlers import midi_transcription as midi_handler
    from app.jobs.handlers import stem_separation as stem_handler

    monkeypatch.setattr(audio_endpoint, "STORAGE_ROOT", storage_root)
    monkeypatch.setattr(project_artifacts_endpoint, "STORAGE_ROOT", storage_root)
    monkeypatch.setattr(waveform_endpoint, "STORAGE_ROOT", storage_root)
    monkeypatch.setattr(stem_handler, "STORAGE_ROOT", storage_root)
    monkeypatch.setattr(midi_handler, "STORAGE_ROOT", storage_root)

    from app import main as app_main

    monkeypatch.setattr(app_main, "engine", engine, raising=False)

    client = TestClient(app_main.app)
    try:
        yield client, storage_root
    finally:
        client.close()


@pytest.fixture()
def dummy_audio_upload():
    return ("example.mp3", io.BytesIO(b"fake-audio-content"), "audio/mpeg")
