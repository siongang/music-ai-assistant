"""
Waveform Service.

Service layer for waveform generation and caching.
"""
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from uuid import UUID

from app.audio_engine.waveform import WaveformGenerator
from app.core.constants import STORAGE_ROOT

logger = logging.getLogger(__name__)


class WaveformService:
    """Service for generating and caching waveform visualization data."""
    
    def __init__(self, storage_root: Path = None):
        """
        Initialize waveform service.
        
        Args:
            storage_root: Root directory for file storage
        """
        self.storage_root = storage_root or Path(STORAGE_ROOT)
        self.generator = WaveformGenerator()
    
    def get_waveform_cache_path(self, artifact_id: UUID, level: int) -> Path:
        """
        Get the cache file path for waveform peaks.
        
        Args:
            artifact_id: Source artifact ID (UUID)
            level: Zoom level (samples per second)
            
        Returns:
            Path to cache file
        """
        waveform_dir = self.storage_root / "waveforms" / str(artifact_id)
        return waveform_dir / f"peaks_{level}.json"
    
    def get_waveform_data(
        self,
        artifact_id: UUID,
        audio_path: Path,
        level: int = 512
    ) -> Dict[str, Any]:
        """
        Get waveform peak data, generating and caching if needed.
        
        Args:
            artifact_id: Source artifact ID (UUID)
            audio_path: Path to audio WAV file
            level: Zoom level (samples per second)
            
        Returns:
            Dict with artifact_id, level, duration, channels, peaks
        """
        # Check if cached version exists
        cache_path = self.get_waveform_cache_path(artifact_id, level)
        
        if cache_path.exists():
            try:
                logger.info(f"Loading cached waveform data: {cache_path}")
                peaks_data = self.generator.load_peaks_from_file(cache_path)
                peaks_data["artifact_id"] = str(artifact_id)
                return peaks_data
            except Exception as e:
                logger.warning(f"Failed to load cached waveform: {e}, regenerating...")
        
        # Generate waveform peaks
        logger.info(f"Generating waveform peaks for {artifact_id} at level {level}")
        
        try:
            peaks_data = self.generator.generate_peaks(audio_path, level)
            peaks_data["artifact_id"] = str(artifact_id)
            
            # Cache the results
            self.generator.save_peaks_to_file(peaks_data, cache_path)
            
            return peaks_data
            
        except Exception as e:
            logger.error(f"Waveform generation failed for {artifact_id}: {e}", exc_info=True)
            raise
    
    def generate_all_levels(
        self,
        artifact_id: UUID,
        audio_path: Path
    ) -> Dict[int, Dict[str, Any]]:
        """
        Generate waveform peaks at all supported zoom levels.
        
        Args:
            artifact_id: Source artifact ID (UUID)
            audio_path: Path to audio WAV file
            
        Returns:
            Dict mapping level to peaks data
        """
        results = {}
        
        for level in self.generator.ZOOM_LEVELS:
            try:
                peaks_data = self.get_waveform_data(artifact_id, audio_path, level)
                results[level] = peaks_data
            except Exception as e:
                logger.error(f"Failed to generate level {level}: {e}")
        
        return results
    
    def clear_cache(self, artifact_id: UUID) -> None:
        """
        Clear cached waveform data for an audio file.
        
        Args:
            artifact_id: Source artifact ID (UUID)
        """
        waveform_dir = self.storage_root / "waveforms" / str(artifact_id)
        
        if waveform_dir.exists():
            import shutil
            shutil.rmtree(waveform_dir)
            logger.info(f"Cleared waveform cache for {artifact_id}")
