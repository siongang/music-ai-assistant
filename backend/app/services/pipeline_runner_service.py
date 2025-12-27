"""
Pipeline runner service for audio processing.

This service orchestrates the audio processing pipeline, including
stem separation and saving the results to disk.
"""
from pathlib import Path
import logging

from app.services.stem_service import StemService
from app.core.constants import DEFAULT_STEM_FORMAT
from demucs.audio import save_audio

logger = logging.getLogger(__name__)


class PipelineRunnerService:
    """
    Service for running the audio processing pipeline.
    
    Orchestrates stem separation and saving of separated audio files.
    This service coordinates between the stem separation service and
    file storage.
    """
    
    def __init__(self, storage=None):
        """
        Initialize pipeline runner service.
        
        Args:
            storage: Storage instance (optional, reserved for future use)
        """
        self.stem_service = StemService()
        self.storage = storage
        logger.debug("Initialized PipelineRunnerService")

    def run(self, input_path: Path, stems_path: Path, ext: str = DEFAULT_STEM_FORMAT):
        """
        Run the audio processing pipeline.
        
        This method:
        1. Separates the input audio file into stems
        2. Saves each stem to the specified output directory
        
        Args:
            input_path: Path to input audio file
            stems_path: Directory where separated stems will be saved
            ext: Output file extension (e.g., 'mp3', 'wav')
            
        Raises:
            ValueError: If input path is invalid or separation fails
            RuntimeError: If saving stems fails
        """
        logger.info(f"Running pipeline for input: {input_path}, output: {stems_path}")
        
        # Ensure output directory exists
        stems_path = Path(stems_path)
        stems_path.mkdir(parents=True, exist_ok=True)
        
        # Run demucs separation - returns tuple of (original_audio, separated_stems_dict)
        try:
            _, separated = self.stem_service.separate(audio_path=input_path)
            
            if not isinstance(separated, dict) or not separated:
                raise ValueError("Separation returned invalid or empty results")
            
            logger.info(f"Separation successful, saving {len(separated)} stems")
        except Exception as e:
            logger.error(f"Failed to separate audio: {e}")
            raise RuntimeError(f"Failed to separate audio: {e}") from e

        # Prepare audio save parameters
        kwargs = {
            "samplerate": self.stem_service.samplerate
        }

        # Extract track name from input filename (without extension)
        track = Path(input_path).name.rsplit(".", 1)[0]
        stem_path_template = "{track}.{stem}.{ext}"

        # Save each separated stem to disk
        for stem, source in separated.items():
            stem_path = stems_path / stem_path_template.format(
                track=track,
                stem=stem,
                ext=ext,
            )

            try:
                save_audio(
                    source, 
                    str(stem_path), 
                    **kwargs
                )
                logger.debug(f"Saved stem '{stem}' to {stem_path}")
            except Exception as e:
                logger.error(f"Failed to save stem '{stem}' to {stem_path}: {e}")
                raise RuntimeError(f"Failed to save stem '{stem}': {e}") from e
        
        logger.info(f"Successfully saved all stems to {stems_path}")



if __name__ == "__main__":
    pipeline_runner = PipelineRunnerService()
    pipeline_runner.run("glimpse_of_us.mp3", 1, "wav")