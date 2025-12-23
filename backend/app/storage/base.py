from abc import ABC, abstractmethod
from pathlib import Path

class Storage:
    @abstractmethod
    def job_path(self, job_id):
        pass