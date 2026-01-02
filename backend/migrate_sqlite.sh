#!/bin/bash
# SQLite migration script for Music Assistant
# This script migrates an existing SQLite database to the current schema
#
# Usage: ./migrate_sqlite.sh [database_file]
# Default: test.db

DB_FILE="${1:-test.db}"

if [ ! -f "$DB_FILE" ]; then
    echo "Database file $DB_FILE not found."
    echo "If you're starting fresh, just delete the old database and restart the server."
    exit 1
fi

echo "Migrating SQLite database: $DB_FILE"
echo "Backing up database..."
cp "$DB_FILE" "${DB_FILE}.backup"

echo "Adding missing columns to jobs table..."

# Add columns one by one, ignoring errors if they already exist
# SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
sqlite3 "$DB_FILE" "ALTER TABLE jobs ADD COLUMN type TEXT;" 2>/dev/null || true
sqlite3 "$DB_FILE" "ALTER TABLE jobs ADD COLUMN input TEXT;" 2>/dev/null || true
sqlite3 "$DB_FILE" "ALTER TABLE jobs ADD COLUMN params TEXT;" 2>/dev/null || true
sqlite3 "$DB_FILE" "ALTER TABLE jobs ADD COLUMN output TEXT;" 2>/dev/null || true
sqlite3 "$DB_FILE" "ALTER TABLE jobs ADD COLUMN progress REAL DEFAULT 0.0;" 2>/dev/null || true

echo "Updating existing data..."

sqlite3 "$DB_FILE" <<EOF
-- Update existing rows with default values
UPDATE jobs SET type = 'stem_separation' WHERE type IS NULL;
UPDATE jobs SET input = '{}' WHERE input IS NULL;
UPDATE jobs SET progress = 0.0 WHERE progress IS NULL;
UPDATE jobs SET status = 'queued' WHERE status = 'pending';

-- Create audio table if it doesn't exist
CREATE TABLE IF NOT EXISTS audio (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_audio_created_at ON audio(created_at DESC);
EOF

MIGRATION_EXIT=$?

if [ $MIGRATION_EXIT -eq 0 ]; then
    echo ""
    echo "✓ Migration completed successfully!"
    echo "Backup saved to: ${DB_FILE}.backup"
    echo ""
    echo "Verifying schema..."
    sqlite3 "$DB_FILE" ".schema jobs" | head -5
    sqlite3 "$DB_FILE" ".schema audio" | head -5
    echo ""
    echo "You can now restart the server."
else
    echo ""
    echo "✗ Migration failed. Restoring backup..."
    mv "${DB_FILE}.backup" "$DB_FILE"
    echo "Database restored from backup."
    exit 1
fi

