from __future__ import annotations

from app.capabilities.base import ModelMetadata
from app.capabilities.midi import MidiTranscriptionOutput, NoteEvent
from app.capabilities.stems import StemFile, StemSeparationOutput


class FakeStemProvider:
    provider_key = "demucs_htdemucs"
    capability = "stem_separation"

    @property
    def is_available(self):
        return True

    def run(self, input):
        input.output_dir.mkdir(parents=True, exist_ok=True)
        stem_path = input.output_dir / f"{input.audio_path.stem}.vocals.mp3"
        stem_path.write_bytes(b"stem")
        return StemSeparationOutput(
            stems=[StemFile(stem_name="vocals", output_path=stem_path, confidence=0.7)],
            sample_rate=44100,
            confidence=0.7,
            model_metadata=ModelMetadata(
                provider_key=self.provider_key,
                model_name="fake_demucs",
                model_version="test",
                params_used={},
                processing_time_seconds=0.01,
            ),
        )


class FakeMidiProvider:
    provider_key = "basic_pitch_v2"
    capability = "midi_transcription"

    @property
    def is_available(self):
        return True

    def run(self, input):
        input.output_dir.mkdir(parents=True, exist_ok=True)
        midi_path = input.output_dir / f"{input.audio_path.stem}.mid"
        midi_path.write_bytes(b"midi")
        return MidiTranscriptionOutput(
            midi_path=midi_path,
            note_events=[
                NoteEvent(start_time=0.0, end_time=0.5, pitch=60, velocity=100, confidence=0.9)
            ],
            note_count=1,
            mean_confidence=0.9,
            confidence=0.9,
            model_metadata=ModelMetadata(
                provider_key=self.provider_key,
                model_name="fake_basic_pitch",
                model_version="test",
                params_used={},
                processing_time_seconds=0.01,
            ),
        )


def _create_project(client):
    response = client.post("/api/projects", json={"name": "Test Project"})
    assert response.status_code == 201
    return response.json()["id"]


def _fake_convert(storage_root):
    def fake_convert(self, audio_id, original_path):
        converted_rel = f"audio/{audio_id}/converted.wav"
        converted_abs = storage_root / converted_rel
        converted_abs.parent.mkdir(parents=True, exist_ok=True)
        converted_abs.write_bytes(b"wav")
        return {
            "converted_path": converted_rel,
            "metadata": {"duration": 3.2, "sample_rate": 44100, "channels": 2},
        }

    return fake_convert


def test_upload_creates_source_artifact(app_client, dummy_audio_upload, monkeypatch):
    client, storage_root = app_client

    from app.api.endpoints import project_artifacts as project_artifacts_endpoint

    monkeypatch.setattr(
        project_artifacts_endpoint.AudioConversionService,
        "convert_audio_file",
        _fake_convert(storage_root),
    )

    project_id = _create_project(client)
    response = client.post(
        f"/api/projects/{project_id}/artifacts/source-audio",
        files={"file": dummy_audio_upload},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["artifact_id"]

    artifacts = client.get(f"/api/projects/{project_id}/artifacts")
    assert artifacts.status_code == 200
    artifact_items = artifacts.json()
    assert len(artifact_items) == 1
    assert artifact_items[0]["type"] == "audio_file"
    assert artifact_items[0]["metadata"]["channels"] == 2

    artifact_metadata = client.get(f"/api/projects/{project_id}/artifacts/{body['artifact_id']}")
    assert artifact_metadata.status_code == 200
    metadata_body = artifact_metadata.json()
    assert metadata_body["id"] == body["artifact_id"]
    assert metadata_body["storage_path"].endswith("converted.wav")

    artifact_download = client.get(f"/api/projects/{project_id}/artifacts/{body['artifact_id']}/download")
    assert artifact_download.status_code == 200
    assert artifact_download.content == b"wav"


def test_job_flow_creates_output_artifacts(app_client, dummy_audio_upload, monkeypatch):
    client, storage_root = app_client

    from app.api.endpoints import project_artifacts as project_artifacts_endpoint
    from app.providers.registry import ProviderRegistry
    from app.tasks import job_tasks

    monkeypatch.setattr(
        project_artifacts_endpoint.AudioConversionService,
        "convert_audio_file",
        _fake_convert(storage_root),
    )

    original_get = ProviderRegistry.get

    def fake_get(capability, provider_key):
        if capability == "stem_separation":
            return FakeStemProvider()
        if capability == "midi_transcription":
            return FakeMidiProvider()
        return original_get(capability, provider_key)

    monkeypatch.setattr(ProviderRegistry, "get", fake_get)
    monkeypatch.setattr(job_tasks.process_audio_job, "delay", lambda job_id: {"job_id": job_id})

    project_id = _create_project(client)
    upload = client.post(f"/api/projects/{project_id}/artifacts/source-audio", files={"file": dummy_audio_upload})
    assert upload.status_code == 201
    source_artifact_id = upload.json()["artifact_id"]

    create_job = client.post(
        f"/api/projects/{project_id}/jobs",
        json={
            "capability": "stem_separation",
            "input": {"input_artifact_id": source_artifact_id},
            "params": {},
        },
    )
    assert create_job.status_code == 201
    job_id = create_job.json()["job_id"]

    result = job_tasks.process_audio_job.run(job_id)
    assert result["status"] == "succeeded"

    job = client.get(f"/api/projects/{project_id}/jobs/{job_id}")
    assert job.status_code == 200
    job_body = job.json()
    artifact_ids = job_body["output"]["artifact_ids"]
    assert len(artifact_ids) == 1

    artifact = client.get(f"/api/projects/{project_id}/artifacts/{artifact_ids[0]}")
    assert artifact.status_code == 200
    assert artifact.json()["type"] == "stem_audio"

def test_capability_discovery_exposes_registered_defaults(app_client):
    client, _storage_root = app_client

    capabilities = client.get("/api/capabilities")
    assert capabilities.status_code == 200
    capability_items = {item["name"]: item for item in capabilities.json()}
    assert "stem_separation" in capability_items
    assert capability_items["stem_separation"]["default_provider_key"] == "demucs_htdemucs"
    assert "demucs_htdemucs" in capability_items["stem_separation"]["registered_provider_keys"]

    providers = client.get("/api/capabilities/midi_transcription/providers")
    assert providers.status_code == 200
    provider_items = {item["provider_key"]: item for item in providers.json()}
    assert "basic_pitch_v2" in provider_items
    assert provider_items["basic_pitch_v2"]["capability"] == "midi_transcription"


def test_job_creation_rejects_invalid_capability_params(app_client, dummy_audio_upload, monkeypatch):
    client, storage_root = app_client

    from app.api.endpoints import project_artifacts as project_artifacts_endpoint

    monkeypatch.setattr(
        project_artifacts_endpoint.AudioConversionService,
        "convert_audio_file",
        _fake_convert(storage_root),
    )

    project_id = _create_project(client)
    upload = client.post(f"/api/projects/{project_id}/artifacts/source-audio", files={"file": dummy_audio_upload})
    assert upload.status_code == 201
    source_artifact_id = upload.json()["artifact_id"]

    invalid_stems = client.post(
        f"/api/projects/{project_id}/jobs",
        json={
            "capability": "stem_separation",
            "input": {"input_artifact_id": source_artifact_id},
            "params": {"stems_requested": ["vocals", "banjo"]},
        },
    )
    assert invalid_stems.status_code == 422

    invalid_midi_param = client.post(
        f"/api/projects/{project_id}/jobs",
        json={
            "capability": "midi_transcription",
            "input": {"input_artifact_id": source_artifact_id},
            "params": {"minimum_note_length_seconds": 0, "unexpected": True},
        },
    )
    assert invalid_midi_param.status_code == 422
