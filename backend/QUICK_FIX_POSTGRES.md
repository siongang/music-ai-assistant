# Quick PostgreSQL Setup

## Issues:
1. ❌ Wrong database credentials in `app/db/session.py`
2. ❌ Database "music" might not exist
3. ❌ Tables might not be created

## Quick Fix Steps:

### Step 1: Update Database URL
Edit `app/db/session.py` and replace:
```python
DATABASE_URL = "postgresql://user:password@localhost:5432/music"
```

With your actual PostgreSQL credentials:
```python
DATABASE_URL = "postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/music"
```

**Common defaults:**
- Username: `postgres` (default PostgreSQL user)
- Password: Whatever you set during PostgreSQL installation
- Database: `music` (we'll create this)

### Step 2: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE music;

# Exit
\q
```

### Step 3: Create Tables
Run the SQL script:
```bash
psql -U postgres -d music -f setup_db.sql
```

Or manually:
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 4: Restart Server
The server should auto-reload, but if not:
```bash
# Stop current server (Ctrl+C)
uvicorn app.main:app --reload
```

## Alternative: Use Default PostgreSQL User

If you don't know your PostgreSQL password, you can:

1. **Reset password:**
```bash
# Windows (run as admin)
net stop postgresql-x64-XX
# Edit pg_hba.conf to use trust authentication temporarily
# Then reset password
```

2. **Or use postgres user with no password** (if configured):
```python
DATABASE_URL = "postgresql://postgres@localhost:5432/music"
```

## Test Connection

After updating, the server should start without database errors. Try creating a job in Swagger UI.
