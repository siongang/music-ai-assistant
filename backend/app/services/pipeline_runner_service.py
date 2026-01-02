"""
Pipeline runner service for audio processing.

This service orchestrates different audio processing operations:
- Stem separation
- Melody extraction
- Chord analysis
"""
from pathlib import Path
import logging
from typing import Dict, Any

from app.services.stem_service import StemService
from app.core.constants import DEFAULT_STEM_FORMAT, STEMS_DIR
from demucs.audio import save_audio

logger = logging.getLogger(__name__)


class PipelineRunnerService:
    """
    Service for running audio processing operations.
    
    Provides methods for different types of audio processing:
    - Stem separation
    - Melody extraction (future)
    - Chord analysis (future)
    """
    
    def __init__(self, storage=None):
        """
        Initialize pipeline runner service.
        
        Args:
            storage: Storage instance for file operations
        """
        self.stem_service = StemService()
        self.storage = storage
        logger.debug("Initialized PipelineRunnerService")

    def process_stem_separation(
        self,
        audio_file_path: Path,
        job_id: str,
        params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Process stem separation for an audio file.
        
        This method:
        1. Separates the input audio file into stems
        2. Saves each stem to the job's output directory
        3. Returns output file paths (relative to storage root)
        
        Args:
            audio_file_path: Path to input audio file
            job_id: Job identifier for output directory
            params: Optional parameters (e.g., {"model": "demucs_v4"})
            
        Returns:
            dict: Output files mapping stem names to relative paths
            Example: {"vocals": "jobs/{job_id}/stems/track.vocals.mp3", ...}
            
        Raises:
            ValueError: If input path is invalid or separation fails
            RuntimeError: If saving stems fails
        """
        logger.info(f"Processing stem separation for job {job_id}")
        
        # Prepare output directory
        if not self.storage:
            raise ValueError("Storage instance required for stem separation")
        
        job_path = self.storage.job_path(job_id)
        stems_path = job_path / STEMS_DIR
        stems_path.mkdir(parents=True, exist_ok=True)
        
        # Get model from params or use default (currently not used, but reserved for future)
        model = params.get("model", "demucs_v4") if params else "demucs_v4"
        logger.debug(f"Using model: {model}")
        
        # Run demucs separation
        try:
            _, separated = self.stem_service.separate(audio_path=audio_file_path)
            
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
        track = Path(audio_file_path).name.rsplit(".", 1)[0]
        stem_path_template = "{track}.{stem}.{ext}"

        # Save each separated stem to disk
        for stem, source in separated.items():
            stem_path = stems_path / stem_path_template.format(
                track=track,
                stem=stem,
                ext=DEFAULT_STEM_FORMAT,
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
        
        # Collect output file paths (relative to storage root)
        output_files = {}
        storage_root = self.storage.root
        for stem_file in stems_path.glob(f"*.{DEFAULT_STEM_FORMAT}"):
            stem_name = stem_file.stem  # e.g., "track.vocals" -> "vocals"
            # Extract stem name (everything after the dot)
            if "." in stem_name:
                stem_name = stem_name.split(".", 1)[1]
            # Get relative path from storage root
            try:
                relative_path = stem_file.relative_to(storage_root)
                output_files[stem_name] = str(relative_path)
            except ValueError:
                # Fallback if relative_to fails
                relative_path = f"jobs/{job_id}/stems/{stem_file.name}"
                output_files[stem_name] = relative_path
        
        logger.info(f"Successfully processed stem separation for job {job_id}")
        return output_files
    
    def process_melody_extraction(
        self,
        audio_file_path: Path,
        job_id: str,
        params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Process melody extraction for an audio file.
        
        Args:
            audio_file_path: Path to input audio file
            job_id: Job identifier for output directory
            params: Optional parameters
            
        Returns:
            dict: Output files mapping
            
        Raises:
            NotImplementedError: Not yet implemented
        """
        logger.info(f"Processing melody extraction for job {job_id}")
        raise NotImplementedError("Melody extraction not yet implemented")
    
    def process_chord_analysis(
        self,
        audio_file_path: Path,
        job_id: str,
        params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Process chord analysis for an audio file.
        
        Args:
            audio_file_path: Path to input audio file
            job_id: Job identifier for output directory
            params: Optional parameters
            
        Returns:
            dict: Output files mapping
            
        Raises:
            NotImplementedError: Not yet implemented
        """
        logger.info(f"Processing chord analysis for job {job_id}")
        raise NotImplementedError("Chord analysis not yet implemented")