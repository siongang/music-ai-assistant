# Output Directory

## Purpose

Temporary output files from development and testing. **NOT part of the production storage system.**

## Important Notes

⚠️ **This is NOT the production storage directory!**

- **Production Storage**: Files stored in `backend/tmp/` (or `STORAGE_ROOT` env var)
- **This Directory**: Used for ad-hoc testing and development only
- **Version Control**: Should be gitignored
- **Cleanup**: Safe to delete - not used by the application

## Production File Storage

The application stores files in `backend/tmp/`:
- `audio/{audio_id}/{filename}` - Original uploaded files
- `jobs/{job_id}/stems/` - Stem separation outputs
- `jobs/{job_id}/midi/` - MIDI conversion outputs


