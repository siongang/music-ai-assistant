# backend/workers/fetch_input.py
from pathlib import Path
import shutil
import requests

def fetch_input(job, storage) -> Path:
    input_path = storage.input_audio_path(job.id)

    if job.input_path:  # local filesystem
        shutil.copy(job.input_path, input_path)
        return input_path

    if job.input_url:  # HTTP / signed URL
        input_path.parent.mkdir(parents=True, exist_ok=True)
        with requests.get(job.input_url, stream=True) as r:
            r.raise_for_status()
            with input_path.open("wb") as f:
                for chunk in r.iter_content(8192):
                    if chunk:
                        f.write(chunk)
        return input_path

    raise ValueError("Job has no input source")
