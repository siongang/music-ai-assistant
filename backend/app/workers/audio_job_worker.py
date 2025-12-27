"""
Audio job worker for processing background jobs.

This worker polls the database for pending jobs and processes them
by running the audio separation pipeline.
"""
from sqlalchemy.orm import Session
from pathlib import Path
import time
import logging
from uuid import UUID

from app.storage.local_storage import LocalStorage
from app.services.pipeline_runner_service import PipelineRunnerService
from app.services.job_service import JobService
from app.core.constants import AUDIO_EXTENSIONS, STEMS_DIR, DEFAULT_STEM_FORMAT, JobStatus

logger = logging.getLogger(__name__)


class AudioJobWorker:
    """
    Worker for processing audio jobs in the background.
    
    This worker continuously polls the database for pending jobs and
    processes them by:
    1. Finding the input audio file
    2. Running the separation pipeline
    3. Saving separated stems
    4. Updating job status
    """
    
    def __init__(self, storage: LocalStorage, db: Session):
        """
        Initialize audio job worker.
        
        Args:
            storage: Storage instance for file operations
            db: Database session for job operations
        """
        self.storage = storage
        self.db = db
        self.pipeline_runner = PipelineRunnerService(storage)
        self.job_service = JobService(db)
        logger.info("AudioJobWorker initialized")

    def process_job(self, job_id: UUID):
        """
        Process a single job.
        
        This method:
        1. Updates job status to "processing"
        2. Finds the input audio file
        3. Runs the separation pipeline
        4. Updates job status to "completed" or "failed"
        
        Args:
            job_id: UUID of the job to process
            
        Raises:
            ValueError: If no audio file found
            RuntimeError: If processing fails
        """
        logger.info(f"Processing job: {job_id}")
        try:
            # Update job status to processing
            self.job_service.update_job_status(job_id, JobStatus.PROCESSING)
            
            # Prepare directories
            job_path = self.storage.job_path(str(job_id))
            input_path = job_path / "input"
            stems_path = job_path / STEMS_DIR
            
            # Ensure directories exist
            input_path.mkdir(parents=True, exist_ok=True)
            stems_path.mkdir(parents=True, exist_ok=True)
            
            # Find audio file in input directory
            audio_files = [
                f for f in input_path.iterdir() 
                if f.is_file() and f.suffix.lower() in AUDIO_EXTENSIONS
            ]
            
            if not audio_files:
                raise ValueError(f"No audio file found in {input_path}")
            
            # Process the first audio file found
            audio_file = audio_files[0]
            logger.info(f"Found audio file: {audio_file}")
            
            # Run pipeline - this separates the audio and saves stems
            self.pipeline_runner.run(audio_file, stems_path, DEFAULT_STEM_FORMAT)
            
            # Update job status to completed
            self.job_service.update_job_status(job_id, JobStatus.COMPLETED)
            logger.info(f"Job {job_id} completed successfully")
            
        except Exception as e:
            # Update job status to failed
            error_msg = str(e)
            logger.error(f"Job {job_id} failed: {error_msg}")
            self.job_service.update_job_status(job_id, JobStatus.FAILED, error_message=error_msg)
            raise

    def poll_and_process(self, poll_interval: int = 5):
        """
        Continuously poll for pending jobs and process them.
        
        This method runs in an infinite loop, checking for pending jobs
        every `poll_interval` seconds. It processes jobs sequentially.
        
        Args:
            poll_interval: Seconds to wait between polls (default: 5)
        """
        logger.info(f"Worker started. Polling every {poll_interval} seconds...")
        
        while True:
            try:
                # Get pending jobs from database
                pending_jobs = self.job_service.get_pending_jobs()
                
                if pending_jobs:
                    logger.info(f"Found {len(pending_jobs)} pending job(s)")
                    for job in pending_jobs:
                        logger.info(f"Processing job {job.id}...")
                        self.process_job(job.id)
                else:
                    logger.debug("No pending jobs found")
                
                # Wait before next poll
                time.sleep(poll_interval)
                
            except KeyboardInterrupt:
                logger.info("Worker stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in polling loop: {e}")
                time.sleep(poll_interval)


if __name__ == "__main__":
    import logging
    from app.db.session import SessionLocal
    from app.core.constants import STORAGE_ROOT
    
    # Setup logging for standalone execution
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Initialize storage and database
    root = Path(STORAGE_ROOT)
    storage = LocalStorage(root)
    db = SessionLocal()
    
    try:
        worker = AudioJobWorker(storage, db)
        worker.poll_and_process(poll_interval=5)
    finally:
        db.close()
