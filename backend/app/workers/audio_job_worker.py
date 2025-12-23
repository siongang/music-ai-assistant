from sqlalchemy.orm import Session
from pathlib import Path
import time
from uuid import UUID

from app.storage.local_storage import LocalStorage
from app.services.pipeline_runner_service import PipelineRunnerService
from app.services.job_service import JobService


class AudioJobWorker:
    def __init__(self, storage: LocalStorage, db: Session):
        self.storage = storage
        self.db = db
        self.pipeline_runner = PipelineRunnerService(storage)
        self.job_service = JobService(db)

    def process_job(self, job_id: UUID):
        """Process a single job"""
        try:
            # Update job status to processing
            self.job_service.update_job_status(job_id, "processing")
            
            # Prepare directories
            job_path = self.storage.job_path(str(job_id))
            input_path = job_path / "input"
            stems_path = job_path / "stems"
            
            input_path.mkdir(parents=True, exist_ok=True)
            stems_path.mkdir(parents=True, exist_ok=True)
            
            # Find audio file in input directory
            audio_extensions = {'.mp3', '.wav', '.flac', '.m4a', '.ogg', '.wma'}
            audio_files = [
                f for f in input_path.iterdir() 
                if f.is_file() and f.suffix.lower() in audio_extensions
            ]
            
            if not audio_files:
                raise ValueError(f"No audio file found in {input_path}")
            
            # Process the first audio file found
            audio_file = audio_files[0]
            
            # Run pipeline
            self.pipeline_runner.run(audio_file, stems_path, "mp3")
            
            # Update job status to completed
            self.job_service.update_job_status(job_id, "completed")
            print(f"Job {job_id} completed successfully")
            
        except Exception as e:
            # Update job status to failed
            error_msg = str(e)
            self.job_service.update_job_status(job_id, "failed", error_message=error_msg)
            print(f"Job {job_id} failed: {error_msg}")
            raise

    def poll_and_process(self, poll_interval: int = 5):
        """Continuously poll for pending jobs and process them"""
        print(f"Worker started. Polling every {poll_interval} seconds...")
        
        while True:
            try:
                # Get pending jobs
                pending_jobs = self.job_service.get_pending_jobs()
                
                if pending_jobs:
                    print(f"Found {len(pending_jobs)} pending job(s)")
                    for job in pending_jobs:
                        print(f"Processing job {job.id}...")
                        self.process_job(job.id)
                else:
                    print("No pending jobs found")
                
                # Wait before next poll
                time.sleep(poll_interval)
                
            except KeyboardInterrupt:
                print("\nWorker stopped by user")
                break
            except Exception as e:
                print(f"Error in polling loop: {e}")
                time.sleep(poll_interval)


if __name__ == "__main__":
    from app.db.session import SessionLocal
    
    # Initialize storage and database
    root = Path("backend/tmp")
    storage = LocalStorage(root)
    db = SessionLocal()
    
    try:
        worker = AudioJobWorker(storage, db)
        worker.poll_and_process(poll_interval=5)
    finally:
        db.close()
