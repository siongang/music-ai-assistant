#!/bin/bash
# WSL Setup Script - Automated parts (no sudo required)
# Run the sudo commands manually or use setup_wsl.sh

set -e

echo "========================================="
echo "Music Assistant - WSL Setup (Auto)"
echo "========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check what's installed
echo -e "${YELLOW}Checking installed packages...${NC}"

# Check for python3-venv
if dpkg -l | grep -q python3.12-venv || dpkg -l | grep -q python3-venv; then
    echo -e "${GREEN}✓ python3-venv is installed${NC}"
    VENV_AVAILABLE=true
else
    echo -e "${RED}✗ python3-venv not installed${NC}"
    echo "  Run: sudo apt install python3.12-venv python3-pip"
    VENV_AVAILABLE=false
fi

# Check for PostgreSQL
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
    PG_AVAILABLE=true
else
    echo -e "${RED}✗ PostgreSQL not installed${NC}"
    echo "  Run: sudo apt install postgresql postgresql-contrib"
    PG_AVAILABLE=false
fi

# Check for FFmpeg
if command -v ffmpeg &> /dev/null; then
    echo -e "${GREEN}✓ FFmpeg is installed${NC}"
    FFMPEG_AVAILABLE=true
else
    echo -e "${RED}✗ FFmpeg not installed${NC}"
    echo "  Run: sudo apt install ffmpeg"
    FFMPEG_AVAILABLE=false
fi

echo ""

# If venv is available, proceed with Python setup
if [ "$VENV_AVAILABLE" = true ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    cd "$(dirname "$0")"
    
    # Remove old venv if exists
    if [ -d "venv" ]; then
        echo "Removing old virtual environment..."
        rm -rf venv
    fi
    
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
    echo ""
    
    echo -e "${YELLOW}Activating virtual environment and upgrading pip...${NC}"
    source venv/bin/activate
    pip install --upgrade pip
    echo -e "${GREEN}✓ pip upgraded${NC}"
    echo ""
    
    # Check for GPU
    echo -e "${YELLOW}Checking for GPU...${NC}"
    if command -v nvidia-smi &> /dev/null && nvidia-smi &> /dev/null; then
        echo -e "${GREEN}✓ NVIDIA GPU detected${NC}"
        GPU_AVAILABLE=true
    else
        echo "No NVIDIA GPU detected, will use CPU"
        GPU_AVAILABLE=false
    fi
    echo ""
    
    # Install PyTorch
    echo -e "${YELLOW}Installing PyTorch...${NC}"
    if [ "$GPU_AVAILABLE" = true ]; then
        echo "Installing CUDA-enabled PyTorch (GPU support)..."
        pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118
        echo -e "${GREEN}✓ PyTorch with CUDA installed${NC}"
        echo "Verifying CUDA..."
        python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"CPU only\"}')" || echo "CUDA check failed, but PyTorch is installed"
    else
        echo "Installing CPU-only PyTorch..."
        pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu
        echo -e "${GREEN}✓ PyTorch (CPU) installed${NC}"
        python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
    fi
    echo ""
    
    # Install other dependencies
    echo -e "${YELLOW}Installing other dependencies...${NC}"
    pip install -r requirements.txt
    echo -e "${GREEN}✓ All Python dependencies installed${NC}"
    echo ""
    
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}Python setup complete!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    
else
    echo -e "${RED}Cannot proceed without python3-venv.${NC}"
    echo "Please install it first:"
    echo "  sudo apt install python3.12-venv python3-pip"
    exit 1
fi

# PostgreSQL setup instructions
if [ "$PG_AVAILABLE" = false ]; then
    echo -e "${YELLOW}PostgreSQL Setup Required:${NC}"
    echo "Run these commands:"
    echo "  sudo apt install postgresql postgresql-contrib"
    echo "  sudo systemctl start postgresql"
    echo "  sudo systemctl enable postgresql"
    echo "  sudo -u postgres createuser --superuser $(whoami)"
    echo "  sudo -u postgres createdb music"
    echo ""
fi

# Database configuration
echo -e "${YELLOW}Database Configuration:${NC}"
DB_FILE="app/db/session.py"
if [ -f "$DB_FILE" ]; then
    CURRENT_USER=$(whoami)
    if grep -q "sqlite://" "$DB_FILE"; then
        echo "Current database URL uses SQLite."
        echo "To use PostgreSQL, update DATABASE_URL in $DB_FILE to:"
        echo "  postgresql://$CURRENT_USER@localhost:5432/music"
        echo ""
        echo "Or set environment variable:"
        echo "  export DATABASE_URL=\"postgresql://$CURRENT_USER@localhost:5432/music\""
    else
        echo "Database URL already configured for PostgreSQL"
    fi
fi

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




