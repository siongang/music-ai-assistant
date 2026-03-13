"""
Audio Conversion Service.

Service layer for audio format conversion operations.
"""
import logging
from pathlib import Path
from typing import Dict, Any
from uuid import UUID

from app.audio_engine.converter import AudioConverter
from app.core.constants import STORAGE_ROOT

logger = logging.getLogger(__name__)


class AudioConversionService:
    """Service for converting audio files to standard WAV format."""
    
    def __init__(self, storage_root: Path = None):
        """
        Initialize audio conversion service.
        
        Args:
            storage_root: Root directory for file storage
        """
        self.storage_root = storage_root or Path(STORAGE_ROOT)
        self.converter = AudioConverter()
    
    def convert_audio_file(
        self,
        audio_id: UUID,
        original_path: Path
    ) -> Dict[str, Any]:
        """
        Convert an audio file to standard WAV format.
        
        Args:
            audio_id: Audio ID (UUID)
            original_path: Path to original uploaded file
            
        Returns:
            Dict with converted_path and metadata (duration, sample_rate, channels, file_size)
        """
        # Create conversion output path
        audio_dir = self.storage_root / "audio" / str(audio_id)
        audio_dir.mkdir(parents=True, exist_ok=True)
        
        converted_path = audio_dir / "converted.wav"
        
        try:
            # Convert the audio file
            metadata = self.converter.convert_to_wav(
                input_path=original_path,
                output_path=converted_path
            )
            
            # Calculate relative path for database
            relative_path = str(Path("audio") / str(audio_id) / "converted.wav")
            
            logger.info(f"Audio conversion complete for {audio_id}: {metadata}")
            
            return {
                "converted_path": relative_path,
                "metadata": metadata
            }
            
        except Exception as e:
            logger.error(f"Audio conversion failed for {audio_id}: {e}", exc_info=True)
            raise
    
    def get_audio_metadata(self, audio_path: Path) -> Dict[str, Any]:
        """
        Get metadata from audio file.
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dict with duration, sample_rate, channels, file_size
        """
        return self.converter.get_audio_metadata(audio_path)
