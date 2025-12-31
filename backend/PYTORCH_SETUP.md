# PyTorch Setup Guide

Quick reference for installing PyTorch with CUDA or CPU support.

## Quick Decision Guide

**Do you have an NVIDIA GPU?**
- ✅ **Yes** → Use CUDA (10-50x faster for audio processing)
- ❌ **No** → Use CPU (works fine, just slower)

## Installation Commands

### CUDA/GPU Installation (Recommended)

```bash
# Activate virtual environment first
source venv/bin/activate

# Install CUDA-enabled PyTorch (CUDA 11.8)
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118

# Verify installation
python -c "import torch; print('CUDA available:', torch.cuda.is_available()); print('Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU only')"
```

**Expected output:**
```
CUDA available: True
Device: NVIDIA GeForce RTX 3060
```

### CPU-Only Installation

```bash
# Activate virtual environment first
source venv/bin/activate

# Install CPU-only PyTorch
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu

# Verify installation
python -c "import torch; print('CUDA available:', torch.cuda.is_available())"
```

**Expected output:**
```
CUDA available: False
```

## WSL2 CUDA Setup (If Using GPU)

If you're using WSL2 and want GPU support:

1. **Check if CUDA is available in WSL:**
   ```bash
   nvidia-smi
   ```
   If this works, you're good! If not, you need to install NVIDIA drivers on Windows.

2. **Install CUDA Toolkit in WSL2** (if needed):
   ```bash
   # For Ubuntu 22.04 / CUDA 12.3
   wget https://developer.download.nvidia.com/compute/cuda/repos/wsl-ubuntu/x86_64/cuda-wsl-ubuntu.pin
   sudo mv cuda-wsl-ubuntu.pin /etc/apt/preferences.d/cuda-repository-pin-600
   wget https://developer.download.nvidia.com/compute/cuda/12.3.0/local_installers/cuda-repo-wsl-ubuntu-12-3-local_12.3.0-1_amd64.deb
   sudo dpkg -i cuda-repo-wsl-ubuntu-12-3-local_12.3.0-1_amd64.deb
   sudo cp /var/cuda-repo-wsl-ubuntu-12-3-local/cuda-*-keyring.gpg /usr/share/keyrings/
   sudo apt-get update
   sudo apt-get -y install cuda
   ```

3. **Verify CUDA:**
   ```bash
   nvcc --version
   ```

## Performance Impact

For audio separation with Demucs (your use case):

| Setup | Processing Time (3-min song) | Use Case |
|-------|------------------------------|----------|
| **CUDA/GPU** | ~10-30 seconds | Production, multiple files |
| **CPU** | ~5-15 minutes | Testing, small files, no GPU |

## Switching Between CUDA and CPU

You can switch anytime by reinstalling PyTorch:

```bash
# Uninstall current PyTorch
pip uninstall torch torchaudio

# Install desired version
# For CUDA:
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118

# For CPU:
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu
```

## Troubleshooting

### "CUDA available: False" but I have a GPU

**WSL2:**
- Make sure NVIDIA drivers are installed on Windows
- Run `nvidia-smi` in WSL to verify GPU access
- Install CUDA toolkit in WSL (see above)

**Native Linux:**
- Install NVIDIA drivers: `sudo apt install nvidia-driver-XXX`
- Install CUDA toolkit
- Reboot if needed

### Import errors after installation

```bash
# Make sure you're in the virtual environment
source venv/bin/activate

# Reinstall if needed
pip install --force-reinstall torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118
```

### Out of memory errors (GPU)

- Reduce batch size in Demucs (if configurable)
- Process shorter audio segments
- Use CPU instead (slower but no memory limits)

## Code Compatibility

✅ **Your code automatically handles both:**
- `DemucsSeparator(device=None)` auto-detects CUDA if available
- Falls back to CPU if CUDA not available
- No code changes needed!

## References

- [PyTorch Installation Guide](https://pytorch.org/get-started/locally/)
- [WSL2 CUDA Guide](https://docs.nvidia.com/cuda/wsl-user-guide/)
- [Demucs Documentation](https://github.com/facebookresearch/demucs)

