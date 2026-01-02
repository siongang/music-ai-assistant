-- Database setup script for Music Assistant
-- Run this to create the jobs and audio tables
-- 
-- Note: This script matches the current SQLAlchemy models.
-- For existing databases, see migrate_db.sql for migration instructions.

-- ============================================
-- PostgreSQL Schema
-- ============================================

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'queued',
    input JSONB NOT NULL,
    params JSONB,
    output JSONB,
    progress REAL DEFAULT 0.0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio table
CREATE TABLE IF NOT EXISTS audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for jobs table
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Create indexes for audio table
CREATE INDEX IF NOT EXISTS idx_audio_created_at ON audio(created_at DESC);

-- ============================================
-- SQLite Schema (for development/testing)
-- ============================================
-- Uncomment below if using SQLite instead of PostgreSQL

-- Jobs table (SQLite)
-- CREATE TABLE IF NOT EXISTS jobs (
--     id TEXT PRIMARY KEY,
--     type TEXT NOT NULL,
--     status TEXT NOT NULL DEFAULT 'queued',
--     input TEXT NOT NULL,  -- JSON stored as TEXT in SQLite
--     params TEXT,  -- JSON stored as TEXT in SQLite
--     output TEXT,  -- JSON stored as TEXT in SQLite
--     progress REAL DEFAULT 0.0,
--     error_message TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Audio table (SQLite)
-- CREATE TABLE IF NOT EXISTS audio (
--     id TEXT PRIMARY KEY,
--     filename TEXT NOT NULL,
--     file_path TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Create indexes for jobs table (SQLite)
-- CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
-- CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
-- CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Create indexes for audio table (SQLite)
-- CREATE INDEX IF NOT EXISTS idx_audio_created_at ON audio(created_at DESC);
