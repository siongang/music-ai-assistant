from pathlib import Path
from .base import Storage
class LocalStorage(Storage):
    def __init__(self, root: Path):
        self.root = root

    def job_path(self, job_id):
        path = self.root / "jobs" / job_id
        path.mkdir(parents=True, exist_ok=True)
        return path

