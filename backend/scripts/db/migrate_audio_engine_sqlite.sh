#!/bin/bash
# Add audio engine columns to SQLite audio table
# Run: ./migrate_audio_engine_sqlite.sh [database_file]
# Default: test.db (same as DATABASE_URL)

DB_FILE="${1:-test.db}"

if [ ! -f "$DB_FILE" ]; then
    echo "Database file $DB_FILE not found."
    exit 1
fi

echo "Adding audio engine columns to audio table: $DB_FILE"

# SQLite doesn't support IF NOT EXISTS for ADD COLUMN; ignore errors if column exists
sqlite3 "$DB_FILE" "ALTER TABLE audio ADD COLUMN converted_file_path TEXT;" 2>/dev/null || true
sqlite3 "$DB_FILE" "ALTER TABLE audio ADD COLUMN original_format TEXT;" 2>/dev/null || true
sqlite3 "$DB_FILE" "ALTER TABLE audio ADD COLUMN duration REAL;" 2>/dev/null || true
sqlite3 "$DB_FILE" "ALTER TABLE audio ADD COLUMN sample_rate INTEGER;" 2>/dev/null || true
sqlite3 "$DB_FILE" "ALTER TABLE audio ADD COLUMN channels INTEGER;" 2>/dev/null || true

echo "Done. Verify with: sqlite3 $DB_FILE '.schema audio'"
