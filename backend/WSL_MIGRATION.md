# WSL/Ubuntu Migration Guide

This guide helps you transition from Windows to WSL (Ubuntu) environment.

## Pre-Migration Checklist

### 1. Push Current Changes to GitHub
```bash
# On Windows, before migrating:
git add .
git commit -m "Pre-WSL migration: Windows environment"
git push origin main
```

### 2. Note Your Current Configuration
- Database credentials (if using PostgreSQL)
- Any custom environment variables
- Virtual environment location (if you want to recreate it)

## Post-Migration Setup (WSL/Ubuntu)

### 1. Clone/Pull Repository
```bash
# In WSL terminal
cd ~
git clone <your-repo-url> music-assistant
# OR if you already have it:
cd music-assistant
git pull origin main
```

### 2. Install System Dependencies

#### Python 3.10+
```bash
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip
```

#### PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### FFmpeg
```bash
sudo apt install ffmpeg
ffmpeg -version  # Verify installation
```

### 3. Set Up Python Virtual Environment
```bash
cd ~/music-assistant/backend
python3 -m venv venv
source venv/bin/activate  # Note: different from Windows!
pip install --upgrade pip
```

### 3a. Install PyTorch (Choose CUDA or CPU)

**⚠️ IMPORTANT:** PyTorch is not in `requirements.txt` because it needs to be installed separately based on your GPU setup.

#### Option A: CUDA/GPU (Recommended - 10-50x faster)
```bash
# Install CUDA-enabled PyTorch (for NVIDIA GPUs)
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118

# Verify CUDA works
python -c "import torch; print('CUDA:', torch.cuda.is_available())"
```

#### Option B: CPU-Only (Simpler, but slower)
```bash
# Install CPU-only PyTorch
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu

# Verify
python -c "import torch; print('CUDA:', torch.cuda.is_available())"
```

**See "PyTorch Installation: CUDA vs CPU" section below for detailed instructions.**

### 3b. Install Other Dependencies
```bash
# After PyTorch is installed, install the rest
pip install -r requirements.txt
```

**Important:** In WSL, use `source venv/bin/activate` (not `venv\Scripts\activate`)

### 4. Set Up PostgreSQL Database

```bash
# Create PostgreSQL user (if needed)
sudo -u postgres createuser --interactive
# Enter your username, answer 'y' for superuser

# Create database
sudo -u postgres createdb music

# Set password (optional)
sudo -u postgres psql
ALTER USER your_username WITH PASSWORD 'your_password';
\q
```

### 5. Configure Database Connection

Edit `app/db/session.py`:
```python
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://your_username:your_password@localhost:5432/music"
)
```

**OR** use environment variable:
```bash
export DATABASE_URL="postgresql://your_username:your_password@localhost:5432/music"
```

**OR** use SQLite for quick testing:
```python
DATABASE_URL = "sqlite:///./test.db"
```

### 6. Verify Setup

```bash
# Check Python
python3 --version  # Should be 3.10+

# Check PostgreSQL
sudo systemctl status postgresql
psql -U your_username -d music -c "SELECT version();"

# Check FFmpeg
ffmpeg -version

# Check virtual environment
which python  # Should point to venv/bin/python
```

## Running the Application

### Terminal 1: API Server
```bash
cd ~/music-assistant/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Terminal 2: Worker
```bash
cd ~/music-assistant/backend
source venv/bin/activate
python -m app.workers.audio_job_worker
```

## Key Differences from Windows

### Path Separators
- ✅ **Code uses `pathlib.Path`** - automatically handles `/` vs `\`
- ✅ **No changes needed** in code

### Virtual Environment Activation
- **Windows:** `venv\Scripts\activate`
- **WSL/Ubuntu:** `source venv/bin/activate`

### PostgreSQL Service
- **Windows:** `net start postgresql-x64-XX`
- **WSL/Ubuntu:** `sudo systemctl start postgresql`

### File Paths in Documentation
- All examples in docs now show both Windows and Linux commands
- Use forward slashes `/` in WSL (even for Windows paths accessed via `/mnt/c/`)

## Accessing Windows Files from WSL

If you need to access files from Windows:
```bash
# Windows C: drive is accessible at:
/mnt/c/Users/your_username/Documents/

# Example: Access Windows audio file
ls /mnt/c/Users/your_username/Music/
```

## Troubleshooting

### Issue: "No module named 'app'"
**Solution:** Make sure you're in the `backend` directory and virtual environment is activated:
```bash
cd ~/music-assistant/backend
source venv/bin/activate
```

### Issue: PostgreSQL connection refused
**Solution:** 
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Check if it's listening
sudo netstat -tlnp | grep 5432
```

### Issue: Permission denied errors
**Solution:**
```bash
# Fix permissions for tmp directory
chmod -R 755 backend/tmp

# Or run with appropriate user
sudo chown -R $USER:$USER backend/tmp
```

### Issue: FFmpeg not found
**Solution:**
```bash
# Install FFmpeg
sudo apt install ffmpeg

# Verify
which ffmpeg
ffmpeg -version
```

### Issue: CUDA/PyTorch issues
**Solution:** 
- WSL2 supports CUDA, but you may need to install CUDA toolkit separately
- Check PyTorch installation: `python -c "import torch; print(torch.cuda.is_available())"`
- See: https://docs.nvidia.com/cuda/wsl-user-guide/

## PyTorch Installation: CUDA vs CPU

**Important Decision:** Your code uses Demucs for audio separation, which is a neural network model. GPU acceleration provides **10-50x speedup** compared to CPU.

### Option 1: CUDA/GPU (Recommended if you have NVIDIA GPU)

**Performance:** 10-50x faster for audio separation  
**Setup Complexity:** Medium  
**Requirements:** NVIDIA GPU with CUDA support

#### Setup Steps:

1. **Install NVIDIA Drivers on Windows** (if not already installed):
   - Download from: https://www.nvidia.com/Download/index.aspx
   - Install latest drivers for your GPU

2. **Install CUDA Toolkit in WSL2:**
   ```bash
   # Check if CUDA is available in WSL
   nvidia-smi
   
   # If nvidia-smi works, install CUDA toolkit
   wget https://developer.download.nvidia.com/compute/cuda/repos/wsl-ubuntu/x86_64/cuda-wsl-ubuntu.pin
   sudo mv cuda-wsl-ubuntu.pin /etc/apt/preferences.d/cuda-repository-pin-600
   wget https://developer.download.nvidia.com/compute/cuda/12.3.0/local_installers/cuda-repo-wsl-ubuntu-12-3-local_12.3.0-1_amd64.deb
   sudo dpkg -i cuda-repo-wsl-ubuntu-12-3-local_12.3.0-1_amd64.deb
   sudo cp /var/cuda-repo-wsl-ubuntu-12-3-local/cuda-*-keyring.gpg /usr/share/keyrings/
   sudo apt-get update
   sudo apt-get -y install cuda
   ```

3. **Install CUDA-enabled PyTorch:**
   ```bash
   source venv/bin/activate
   pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118
   ```

4. **Verify CUDA:**
   ```bash
   python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'CUDA device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"N/A\"}')"
   ```

**Expected Output:**
```
CUDA available: True
CUDA device: NVIDIA GeForce RTX 3060
```

### Option 2: CPU-Only (Simpler Setup)

**Performance:** 10-50x slower, but works fine for testing/small files  
**Setup Complexity:** Low  
**Requirements:** Just Python

#### Setup Steps:

1. **Install CPU-only PyTorch:**
   ```bash
   source venv/bin/activate
   pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu
   ```

2. **Verify (should show CUDA as False):**
   ```bash
   python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
   ```

**Expected Output:**
```
CUDA available: False
```

### Performance Comparison

For a typical 3-minute song:
- **GPU (CUDA):** ~10-30 seconds
- **CPU:** ~5-15 minutes

### Recommendation

- **Use CUDA if:** You have an NVIDIA GPU and plan to process multiple/long audio files
- **Use CPU if:** You're just testing, have no GPU, or processing very short files

### Code Compatibility

✅ **Good news:** Your code auto-detects CUDA if available:
- `device=None` in `DemucsSeparator` means it will automatically use GPU if available
- Falls back to CPU if CUDA not available
- No code changes needed!

### Switching Later

You can switch between CPU and CUDA by reinstalling PyTorch:
```bash
# Switch to CUDA
pip uninstall torch torchaudio
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118

# Switch to CPU
pip uninstall torch torchaudio
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu
```

## Environment Variables

Create a `.env` file in `backend/` directory (optional):
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/music
STORAGE_ROOT=/home/your_username/music-assistant/backend/tmp
```

Then load it:
```bash
export $(cat .env | xargs)
```

Or use `python-dotenv` package (add to requirements.txt):
```python
from dotenv import load_dotenv
load_dotenv()
```

## Next Steps

1. ✅ Test API server: `curl http://localhost:8000/api/health`
2. ✅ Test job creation: Upload a test audio file
3. ✅ Verify worker processes jobs
4. ✅ Check output files in `backend/tmp/jobs/{job_id}/stems/`

## Notes

- All code is cross-platform compatible (uses `pathlib.Path`)
- Database connection strings work the same way
- Only documentation had Windows-specific examples (now updated)
- Virtual environment activation is the main difference

## Additional Resources

- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [PostgreSQL Ubuntu Guide](https://www.postgresql.org/download/linux/ubuntu/)
- [Python venv Guide](https://docs.python.org/3/library/venv.html)

