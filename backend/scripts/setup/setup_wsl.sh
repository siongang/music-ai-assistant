#!/bin/bash
# WSL Setup Script for Music Assistant
# Run this script to set up your environment

set -e  # Exit on error

echo "========================================="
echo "Music Assistant - WSL Setup Script"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install system dependencies
echo -e "${YELLOW}Step 1: Installing system dependencies...${NC}"
sudo apt update
sudo apt install -y python3.12-venv python3-pip postgresql postgresql-contrib ffmpeg

echo -e "${GREEN}✓ System dependencies installed${NC}"
echo ""

# Step 2: Check for GPU
echo -e "${YELLOW}Step 2: Checking for GPU...${NC}"
if command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPU detected!"
    GPU_AVAILABLE=true
else
    echo "No NVIDIA GPU detected, will use CPU"
    GPU_AVAILABLE=false
fi
echo ""

# Step 3: Create virtual environment
echo -e "${YELLOW}Step 3: Creating virtual environment...${NC}"
cd "$(dirname "$0")"
python3 -m venv venv
echo -e "${GREEN}✓ Virtual environment created${NC}"
echo ""

# Step 4: Activate venv and upgrade pip
echo -e "${YELLOW}Step 4: Upgrading pip...${NC}"
source venv/bin/activate
pip install --upgrade pip
echo -e "${GREEN}✓ pip upgraded${NC}"
echo ""

# Step 5: Install PyTorch
echo -e "${YELLOW}Step 5: Installing PyTorch...${NC}"
if [ "$GPU_AVAILABLE" = true ]; then
    echo "Installing CUDA-enabled PyTorch (GPU support)..."
    pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118
    echo -e "${GREEN}✓ PyTorch with CUDA installed${NC}"
    echo "Verifying CUDA..."
    python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"CPU only\"}')"
else
    echo "Installing CPU-only PyTorch..."
    pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu
    echo -e "${GREEN}✓ PyTorch (CPU) installed${NC}"
    python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
fi
echo ""

# Step 6: Install other dependencies
echo -e "${YELLOW}Step 6: Installing other dependencies...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}✓ All dependencies installed${NC}"
echo ""

# Step 7: Set up PostgreSQL
echo -e "${YELLOW}Step 7: Setting up PostgreSQL...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Get current username
CURRENT_USER=$(whoami)

# Create database user if it doesn't exist
echo "Creating PostgreSQL user '$CURRENT_USER' (if needed)..."
sudo -u postgres psql -c "SELECT 1 FROM pg_user WHERE usename='$CURRENT_USER'" | grep -q 1 || \
    sudo -u postgres createuser --superuser --createdb --createrole "$CURRENT_USER" || true

# Create database
echo "Creating database 'music'..."
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='music'" | grep -q 1 || \
    sudo -u postgres createdb music || true

echo -e "${GREEN}✓ PostgreSQL database 'music' created${NC}"
echo ""

# Step 8: Verify installations
echo -e "${YELLOW}Step 8: Verifying installations...${NC}"
echo "Python version: $(python --version)"
echo "FFmpeg version: $(ffmpeg -version | head -n 1)"
echo "PostgreSQL status: $(sudo systemctl is-active postgresql)"
echo ""

# Step 9: Database configuration
echo -e "${YELLOW}Step 9: Database configuration...${NC}"
DB_FILE="app/db/session.py"
if [ -f "$DB_FILE" ]; then
    # Check if already configured for PostgreSQL
    if grep -q "sqlite://" "$DB_FILE"; then
        echo "Updating database URL to use PostgreSQL..."
        # Create backup
        cp "$DB_FILE" "$DB_FILE.bak"
        # Update DATABASE_URL (this is a simple approach, user may need to adjust)
        sed -i 's|sqlite:///./test.db|postgresql://'"$CURRENT_USER"'@localhost:5432/music|g' "$DB_FILE"
        echo -e "${GREEN}✓ Database URL updated to PostgreSQL${NC}"
        echo "Note: If you set a password for PostgreSQL, update DATABASE_URL in $DB_FILE"
    else
        echo "Database URL already configured"
    fi
else
    echo "Warning: $DB_FILE not found"
fi
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Activate the virtual environment:"
echo "   cd /home/sion/code/music-assistant/backend"
echo "   source venv/bin/activate"
echo ""
echo "2. Start the API server (Terminal 1):"
echo "   uvicorn app.main:app --reload"
echo ""
echo "3. Start the worker (Terminal 2):"
echo "   python -m app.workers.audio_job_worker"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:8000/api/health"
echo ""
echo "If you need to set a PostgreSQL password, run:"
echo "   sudo -u postgres psql"
echo "   ALTER USER $CURRENT_USER WITH PASSWORD 'your_password';"
echo "   \\q"
echo "Then update DATABASE_URL in app/db/session.py"
echo ""




