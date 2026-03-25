# Product Vision

## What We Are Building

A **music understanding platform** that helps musicians analyze and learn songs. The platform applies ML models to audio and presents the results in musically meaningful ways — not just as raw files, but as structured musical knowledge.

## Core User Value

A musician uploads a song and gets back:
- Separated stems they can practice with
- MIDI transcriptions they can study or export
- Chord progressions labeled in musical language
- Sheet music they can print and read
- A conversational interface that can explain what it found

## Design Philosophy

**The backend is the product.** The frontend is a thin validation surface until backend capabilities are reliable and extensible.

**Models are replaceable.** Every ML capability (stem separation, MIDI transcription, chord analysis) will cycle through multiple models over time. The architecture must never couple business logic to a specific model.

**Outputs are uncertain.** MIDI transcription and chord analysis are probabilistic. The system must carry confidence metadata through the pipeline — and expose it — so users and the LLM agent know when to trust results.

**Artifacts are first-class.** A stem file, a MIDI file, a chord map — these are named, typed, traceable artifacts with lineage. They are not just job output blobs.

## Capability Roadmap

| Phase | Capability | Status |
|-------|-----------|--------|
| 1 | Stem separation (audio → stems) | Working, needs provider abstraction |
| 1 | Audio-to-MIDI transcription | Working, needs provider abstraction |
| 2 | Chord / harmony analysis | Stub only — no reliable model yet |
| 2 | Key detection | Not started |
| 3 | Sheet music generation | Not started |
| 3 | Conversational analysis over artifacts | Agent exists, needs musical grounding |

## What We Are NOT Doing (Yet)

- Frontend polish — the DAW-style UI is intentionally parked
- Sheet music output — no reliable pipeline exists yet; don't fake it
- Real-time processing — async batch is the right model for now
- Multi-user auth — single-user dev mode is acceptable

## Definition of "Backend Ready"

The backend is ready for serious product work when:
1. Every capability is abstracted behind a provider interface
2. Artifacts carry type, lineage, and confidence metadata
3. Swapping a model provider requires changing one registry entry, not refactoring business logic
4. The LLM agent can query artifact metadata and make musically informed statements
