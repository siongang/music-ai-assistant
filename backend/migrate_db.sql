-- Database migration script for Music Assistant
-- Use this to update existing databases to match the current schema
-- 
-- IMPORTANT: Backup your database before running migrations!
-- 
-- This script adds missing columns to existing tables.
-- If you're starting fresh, use setup_db.sql instead.

-- ============================================
-- PostgreSQL Migrations
-- ============================================

-- Migrate jobs table: Add missing columns
-- Check if columns exist before adding (PostgreSQL 9.5+)
DO $$ 
BEGIN
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='jobs' AND column_name='type') THEN
        ALTER TABLE jobs ADD COLUMN type VARCHAR;
        -- Set default value for existing rows
        UPDATE jobs SET type = 'stem_separation' WHERE type IS NULL;
        -- Make it NOT NULL after setting defaults
        ALTER TABLE jobs ALTER COLUMN type SET NOT NULL;
    END IF;

    -- Add input column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='jobs' AND column_name='input') THEN
        ALTER TABLE jobs ADD COLUMN input JSONB;
        -- Set default value for existing rows
        UPDATE jobs SET input = '{}'::jsonb WHERE input IS NULL;
        -- Make it NOT NULL after setting defaults
        ALTER TABLE jobs ALTER COLUMN input SET NOT NULL;
    END IF;

    -- Add params column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='jobs' AND column_name='params') THEN
        ALTER TABLE jobs ADD COLUMN params JSONB;
    END IF;

    -- Add output column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='jobs' AND column_name='output') THEN
        ALTER TABLE jobs ADD COLUMN output JSONB;
    END IF;

    -- Add progress column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='jobs' AND column_name='progress') THEN
        ALTER TABLE jobs ADD COLUMN progress REAL DEFAULT 0.0;
    END IF;

    -- Update status default if it's still 'pending' (old default)
    UPDATE jobs SET status = 'queued' WHERE status = 'pending';
    
    -- Change status default constraint if needed
    ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'queued';
END $$;

-- Create audio table if it doesn't exist
CREATE TABLE IF NOT EXISTS audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_audio_created_at ON audio(created_at DESC);

-- ============================================
-- SQLite Migrations
-- ============================================
-- For SQLite, you need to manually check and add columns
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- 
-- Run these commands manually in sqlite3:
-- 
-- sqlite3 test.db
-- 
-- ALTER TABLE jobs ADD COLUMN type TEXT;
-- ALTER TABLE jobs ADD COLUMN input TEXT;
-- ALTER TABLE jobs ADD COLUMN params TEXT;
-- ALTER TABLE jobs ADD COLUMN output TEXT;
-- ALTER TABLE jobs ADD COLUMN progress REAL DEFAULT 0.0;
-- 
-- UPDATE jobs SET type = 'stem_separation' WHERE type IS NULL;
-- UPDATE jobs SET input = '{}' WHERE input IS NULL;
-- UPDATE jobs SET status = 'queued' WHERE status = 'pending';
-- 
-- CREATE TABLE IF NOT EXISTS audio (
--     id TEXT PRIMARY KEY,
--     filename TEXT NOT NULL,
--     file_path TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- 
-- .quit

