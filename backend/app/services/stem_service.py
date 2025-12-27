"""
Stem separation service.

This service provides a high-level interface for separating audio files
into individual stems (vocals, drums, bass, other).
"""
from pathlib import Path
import logging

from app.audio_engine.stems.demucs_separator import DemucsSeparator

logger = logging.getLogger(__name__)


class StemService:
    """
    Service for audio stem separation.
    
    Provides a high-level interface for separating audio files into stems.
    This service wraps the DemucsSeparator and provides a clean API for
    the rest of the application.
    """
    
    def __init__(self):
        """Initialize stem service with Demucs separator."""
        logger.debug("Initializing StemService")
        self.separator = DemucsSeparator()

    def separate(self, audio_path: Path):
        """
        Separate audio file into stems.
        
        Args:
            audio_path: Path to audio file to separate
            
        Returns:
            Tuple of (original_audio_tensor, dict_of_stems) where dict keys
            are stem names (e.g., 'vocals', 'drums', 'bass', 'other')
            
        Raises:
            RuntimeError: If separation fails
        """
        logger.info(f"Separating audio: {audio_path}")
        return self.separator.separate(audio_path)

    @property
    def samplerate(self) -> int:
        """
        Get the sample rate used by the separator.
        
        Returns:
            Sample rate in Hz
        """
        return self.separator.samplerate