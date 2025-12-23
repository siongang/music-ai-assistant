from ..storage.local_storage import LocalStorage
from ..services.pipeline_runner_service import PipelineRunnerService
from pathlib import Path

class AudioJobWorker:
    def __init__(self, storage):
        self.storage = storage
        self.pipeline_runner = PipelineRunnerService(self.storage)



    def run(self, job_id):

        # Prepare tmp directories, in future job path will be a db link and worker will
        # have direct access to the db
        job_path = self.storage.job_path(job_id)
        input_path = job_path / "input"
        stems_path = job_path / "stems"
        
        input_path.mkdir(parents=True, exist_ok=True)
        stems_path.mkdir(parents=True, exist_ok=True)

        print(input_path)
        print(stems_path)

        self.pipeline_runner.run(input_path, stems_path, "mp3")



if __name__ == "__main__":
    print("Running...")
    root = Path("C:/Users/siong/Documents/Code/music-assistant/backend/tmp")
    storage = LocalStorage(root)
    worker = AudioJobWorker(storage)
    
    # For testing: you need to place an audio file in the input directory
    # The pipeline runner will automatically find it
    job_path = storage.job_path("test")
    input_dir = job_path / "input"
    input_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if there's an audio file in the input directory
    audio_extensions = {'.mp3', '.wav', '.flac', '.m4a', '.ogg', '.wma'}
    audio_files = [f for f in input_dir.iterdir() 
                  if f.is_file() and f.suffix.lower() in audio_extensions]
    
    if not audio_files:
        print(f"WARNING: No audio file found in {input_dir}")
        print("Please add an audio file to the input directory before running.")
    else:
        print(f"Found audio file: {audio_files[0]}")
        worker.run("test")



