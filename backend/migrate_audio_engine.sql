-- Migration: Add audio engine fields to audio table and create audio_sessions table
-- Date: 2026-02-01
-- Description: Adds conversion fields and metadata to audio table, creates audio_sessions table for timeline state

-- ============================================
-- 1. Update audio table with conversion fields
-- ============================================

-- Add converted_file_path column
ALTER TABLE audio ADD COLUMN IF NOT EXISTS converted_file_path VARCHAR;

-- Add original_format column
ALTER TABLE audio ADD COLUMN IF NOT EXISTS original_format VARCHAR;

-- Add duration column (in seconds)
ALTER TABLE audio ADD COLUMN IF NOT EXISTS duration FLOAT;

-- Add sample_rate column (in Hz)
ALTER TABLE audio ADD COLUMN IF NOT EXISTS sample_rate INTEGER;

-- Add channels column (number of audio channels)
ALTER TABLE audio ADD COLUMN IF NOT EXISTS channels INTEGER;

COMMENT ON COLUMN audio.converted_file_path IS 'Path to converted WAV file (44.1kHz stereo)';
COMMENT ON COLUMN audio.original_format IS 'Original file extension (e.g., .mp3, .wav)';
COMMENT ON COLUMN audio.duration IS 'Duration in seconds';
COMMENT ON COLUMN audio.sample_rate IS 'Sample rate in Hz (e.g., 44100)';
COMMENT ON COLUMN audio.channels IS 'Number of audio channels (1=mono, 2=stereo)';

-- ============================================
-- 2. Create audio_sessions table
-- ============================================

CREATE TABLE IF NOT EXISTS audio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Session',
    tracks JSONB NOT NULL DEFAULT '[]'::jsonb,
    master_gain FLOAT NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audio_sessions IS 'Audio timeline sessions storing track arrangements and mix settings';
COMMENT ON COLUMN audio_sessions.project_id IS 'Project that owns this session';
COMMENT ON COLUMN audio_sessions.name IS 'Session name';
COMMENT ON COLUMN audio_sessions.tracks IS 'Array of track configurations with clips (JSON)';
COMMENT ON COLUMN audio_sessions.master_gain IS 'Master output gain (0.0 to 2.0)';

-- Create index on project_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_audio_sessions_project_id ON audio_sessions(project_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_audio_sessions_updated_at ON audio_sessions(updated_at DESC);

-- ============================================
-- 3. Create function to update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_audio_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Create trigger for audio_sessions updated_at
-- ============================================

DROP TRIGGER IF EXISTS trigger_audio_sessions_updated_at ON audio_sessions;

CREATE TRIGGER trigger_audio_sessions_updated_at
    BEFORE UPDATE ON audio_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_audio_sessions_updated_at();

-- ============================================
-- Migration complete
-- ============================================

-- Verify the changes
SELECT 'Migration completed successfully!' AS status;
SELECT 'Audio table columns:' AS info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audio' 
ORDER BY ordinal_position;

SELECT 'Audio sessions table columns:' AS info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audio_sessions' 
ORDER BY ordinal_position;
