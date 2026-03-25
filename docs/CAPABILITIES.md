# Capability Definitions

Capabilities are stable contracts. Providers are replaceable implementations.

- Capability schemas live in `backend/app/capabilities/`
- Provider implementations live in `backend/app/providers/<capability>/`

The examples below describe the contract shape and operational meaning. The exact in-code
schemas may carry filesystem execution fields such as canonical input path and job output
directory because handlers translate artifact-based jobs into provider runtime inputs.

---

## `stem_separation`

**Purpose:** Separate a mixed recording into isolated stems.

**Pipeline input:** Source `audio_file` artifact  
**Typical output artifacts:** `stem_audio`

**Contract**

```python
class StemSeparationInput(BaseModel):
    audio_path: Path
    output_dir: Path
    stems_requested: list[str] = ["vocals", "drums", "bass", "other"]

class StemSeparationOutput(BaseModel):
    stems: list[StemFile]
    sample_rate: int
    confidence: float | None
    model_metadata: ModelMetadata
```

**Registered providers**

| Provider key | Model | Status | Notes |
|---|---|---|---|
| `demucs_htdemucs` | Demucs htdemucs | working | Default provider |

**Notes**

- Intended primary input is the canonical WAV source artifact
- Confidence is optional; any Demucs confidence is heuristic, not model-native

---

## `midi_transcription`

**Purpose:** Convert audio into MIDI plus note-event data.

**Pipeline input:** `audio_file` artifact or `stem_audio` artifact  
**Typical output artifacts:** `midi_file`, `note_events`

**Contract**

```python
class MidiTranscriptionInput(BaseModel):
    audio_path: Path
    output_dir: Path
    onset_threshold: float = 0.5
    frame_threshold: float = 0.3
    minimum_note_length_seconds: float = 0.05
    midi_tempo: int | None = None

class MidiTranscriptionOutput(BaseModel):
    midi_path: Path
    note_events: list[NoteEvent]
    note_count: int
    mean_confidence: float
    confidence: float | None
    model_metadata: ModelMetadata
```

**Registered providers**

| Provider key | Model | Status | Notes |
|---|---|---|---|
| `basic_pitch_v2` | Basic Pitch | working | Default provider |

**Notes**

- Best results usually come from isolated stems rather than full mixes
- Per-note confidence should be preserved in the `note_events` output
- Agent responses should mention confidence when present and avoid inventing it when absent

---

## `chord_analysis`

**Purpose:** Detect chord events and musical labeling such as Roman numerals.

**Pipeline input:** `audio_file` artifact or derived artifact  
**Typical output artifacts:** `chord_map`

**Status:** stub  
**Registered providers:** none

**Behavior**

- Capability may exist in the registry
- Public API should return `501 Not Implemented` until a real provider is registered
- Agent tooling must return `{"status": "unavailable"}` instead of fabricating analysis

---

## `key_detection`

**Purpose:** Detect musical key from audio.

**Status:** planned, no provider registered

---

## `sheet_music_generation`

**Purpose:** Convert structured musical representations into sheet music outputs.

**Status:** planned, no provider registered

---

## `ModelMetadata`

All provider outputs include model metadata:

```python
class ModelMetadata(BaseModel):
    provider_key: str
    model_name: str
    model_version: str
    params_used: dict
    processing_time_seconds: float
```

This metadata is persisted into output artifact metadata so the system can explain what ran
without rerunning the model.
