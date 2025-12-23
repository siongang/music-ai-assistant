````md
# Backend Installation

## Requirements
- Python 3.10
- ffmpeg installed and available on PATH
- NVIDIA GPU + CUDA 11.8 (optional, for GPU acceleration)

---

## Setup

From the `backend/` directory:

### 1. Create and activate virtual environment

```bash
python -m venv venv
````

**Windows (PowerShell)**

```powershell
venv\Scripts\Activate.ps1
```

**macOS / Linux**

```bash
source venv/bin/activate
```

---

### 2. Install CUDA-enabled PyTorch (GPU only)

Install PyTorch manually to avoid CPU-only installs:

```bash
pip install torch==2.1.0+cu118 torchaudio==2.1.0+cu118 --index-url https://download.pytorch.org/whl/cu118
```

Verify CUDA:

```bash
python -c "import torch; print(torch.cuda.is_available())"
```

---

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Install Demucs (without dependencies)

Prevents Demucs from installing CPU Torch:

```bash
python3 -m pip install --no-deps -U git+https://github.com/facebookresearch/demucs#egg=demucs

```

---

## Run the API

```bash
uvicorn app.main:app --reload
```

Open:

* [http://localhost:8000/docs](http://localhost:8000/docs)

```
```
