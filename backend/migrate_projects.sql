-- Migration: Projects own audio and jobs (project_id required, CASCADE delete)
-- Run on existing databases after pulling the new backend.
-- Fresh installs: Base.metadata.create_all() in main.py creates the full schema.
--
-- DESIGN: Projects are the root aggregate. Audio and jobs cannot exist without a project.
-- Deleting a project CASCADE-deletes its audio and job rows.

-- ============================================
-- PostgreSQL
-- ============================================

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tempo REAL NOT NULL DEFAULT 120.0,
    key VARCHAR(16) NOT NULL DEFAULT 'C',
    time_signature JSONB NOT NULL DEFAULT '{"numerator": 4, "denominator": 4}',
    description TEXT,
    thumbnail VARCHAR(512),
    tree_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- 2. Add project_id to audio (CASCADE: delete project → delete its audio)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audio' AND column_name = 'project_id') THEN
        ALTER TABLE audio ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_audio_project_id ON audio(project_id);
    END IF;
END $$;

-- 3. Add project_id to jobs (CASCADE: delete project → delete its jobs)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'jobs' AND column_name = 'project_id') THEN
        ALTER TABLE jobs ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id);
    END IF;
END $$;

-- 4. If you previously had nullable project_id and want to enforce NOT NULL:
--    First ensure every audio/job has a project_id (create a project and assign, or delete orphan rows).
--    Then run:
-- ALTER TABLE audio ALTER COLUMN project_id SET NOT NULL;
-- ALTER TABLE jobs ALTER COLUMN project_id SET NOT NULL;

-- ============================================
-- SQLite (run manually if using SQLite)
-- ============================================
-- sqlite3 test.db
--
-- CREATE TABLE IF NOT EXISTS projects (
--     id TEXT PRIMARY KEY,
--     name TEXT NOT NULL,
--     tempo REAL NOT NULL DEFAULT 120.0,
--     key TEXT NOT NULL DEFAULT 'C',
--     time_signature TEXT NOT NULL DEFAULT '{"numerator": 4, "denominator": 4}',
--     description TEXT,
--     thumbnail TEXT,
--     tree_snapshot TEXT,
--     created_at TEXT DEFAULT (datetime('now')),
--     updated_at TEXT DEFAULT (datetime('now'))
-- );
-- ALTER TABLE audio ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;
-- ALTER TABLE jobs ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;
-- .quit
