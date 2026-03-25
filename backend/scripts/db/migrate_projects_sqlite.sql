-- Migration: Projects own audio and jobs (SQLite)
-- Run on existing SQLite DBs:  sqlite3 test.db < migrate_projects_sqlite.sql
-- Use the same DB file as in your DATABASE_URL (e.g. test.db).

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tempo REAL NOT NULL DEFAULT 120.0,
    key TEXT NOT NULL DEFAULT 'C',
    time_signature TEXT NOT NULL DEFAULT '{"numerator": 4, "denominator": 4}',
    description TEXT,
    thumbnail TEXT,
    tree_snapshot TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- 2. Add project_id to audio (ignore error if column already exists)
ALTER TABLE audio ADD COLUMN project_id TEXT REFERENCES projects(id);

-- 3. Add project_id to jobs (ignore error if column already exists)
ALTER TABLE jobs ADD COLUMN project_id TEXT REFERENCES projects(id);

CREATE INDEX IF NOT EXISTS idx_audio_project_id ON audio(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id);
