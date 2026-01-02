# Database Migration Guide

This guide helps you migrate existing databases to the current schema.

## Current Schema

The application uses two main tables:

### Jobs Table
- `id` (UUID/TEXT): Primary key
- `type` (VARCHAR/TEXT): Job type (required)
- `status` (VARCHAR/TEXT): Job status - "queued", "running", "succeeded", "failed" (required, default: "queued")
- `input` (JSONB/TEXT): Input data with audio_id (required)
- `params` (JSONB/TEXT): Job parameters (optional)
- `output` (JSONB/TEXT): Output data with file paths (optional)
- `progress` (REAL): Progress value 0.0-1.0 (optional, default: 0.0)
- `error_message` (TEXT): Error message if failed (optional)
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

### Audio Table
- `id` (UUID/TEXT): Primary key
- `filename` (VARCHAR/TEXT): Original filename (required)
- `file_path` (VARCHAR/TEXT): Relative path to stored file (required)
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

## Migration Options

### Option 1: Fresh Start (Recommended for Development)

**PostgreSQL:**
```bash
# Drop and recreate database
dropdb music
createdb music
psql -U postgres -d music -f setup_db.sql
```

**SQLite:**
```bash
# Delete old database
rm test.db
# Restart server - tables will be auto-created
```

### Option 2: Migrate Existing Database

**PostgreSQL:**
```bash
# Backup first!
pg_dump -U postgres music > backup.sql

# Run migration
psql -U postgres -d music -f migrate_db.sql
```

**SQLite:**
```bash
# Backup first!
cp test.db test.db.backup

# Run migration script
./migrate_sqlite.sh test.db
```

### Option 3: Manual Migration

If you prefer to migrate manually, see the SQL commands in `migrate_db.sql` for PostgreSQL or the comments in `migrate_sqlite.sh` for SQLite.

## Common Issues

### Issue: "table jobs has no column named type"

**Cause:** Database schema is outdated.

**Solution:**
1. Run the appropriate migration script (see Option 2 above)
2. Or start fresh (see Option 1 above)

### Issue: "table audio does not exist"

**Cause:** Audio table was added in a recent update.

**Solution:**
- The migration scripts will create this table automatically
- Or it will be auto-created on server startup if using `Base.metadata.create_all()`

### Issue: Migration fails with "column already exists"

**Cause:** Some columns were already added manually.

**Solution:**
- This is fine - the migration scripts check for column existence (PostgreSQL)
- For SQLite, you may see errors but they're harmless if columns already exist

## Verification

After migration, verify the schema:

**PostgreSQL:**
```sql
\d jobs
\d audio
```

**SQLite:**
```bash
sqlite3 test.db
.schema jobs
.schema audio
.quit
```

## Notes

- Always backup your database before migrating
- The migration scripts are idempotent (safe to run multiple times)
- For production, consider using Alembic migrations instead of manual scripts
- Status values changed from "pending"/"processing"/"completed" to "queued"/"running"/"succeeded"/"failed"

