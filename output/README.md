# Output Directory

## Purpose

This directory contains temporary output files from development and testing. These files are NOT part of the production storage system.

## Contents

This directory typically contains:
- Test audio files for development
- Model inference outputs for debugging
- MIDI conversion test results
- Note event CSV files
- Other development artifacts

## Important Notes

⚠️ **This is NOT the production storage directory!**

- **Production Storage**: Files are stored in `backend/tmp/` (or the path specified by `STORAGE_ROOT` environment variable)
- **This Directory**: Used for ad-hoc testing and development only
- **Version Control**: Files in this directory should be gitignored (add to `.gitignore` if not already present)
- **Cleanup**: Feel free to delete files in this directory - they are not used by the application

## Production File Storage

The application stores uploaded audio and job outputs in:

```
backend/tmp/
├── audio/
│   └── {audio_id}/
│       └── {filename}          # Original uploaded files
└── jobs/
    └── {job_id}/
        ├── stems/              # Stem separation outputs
        │   ├── track.vocals.mp3
        │   ├── track.drums.mp3
        │   ├── track.bass.mp3
        │   └── track.other.mp3
        └── midi/               # MIDI conversion outputs
            ├── track.mid
            └── track_notes.csv
```

## Recommendation

Consider adding this directory to `.gitignore`:

```gitignore
# Development output files
output/
*.mp3
*.wav
*.mid
*.csv
```


