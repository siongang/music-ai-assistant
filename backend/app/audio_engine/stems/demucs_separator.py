"""
Demucs audio stem separator implementation.

This module provides a wrapper around the Demucs library for separating
audio files into individual stems (vocals, drums, bass, other).
"""
from pathlib import Path
from typing import Tuple, Dict
import logging

from demucs.api import Separator
import torch as th

logger = logging.getLogger(__name__)


class DemucsSeparator:
    """
    Wrapper around Demucs Separator for audio stem separation.
    
    Provides a clean interface to the Demucs library for separating
    audio files into individual stems (vocals, drums, bass, other).
    """
    
    def __init__(
        self,
        model: str = "htdemucs", 
        device: str | None = None,
        shifts: int = 1,
        overlap: float = 0.25,
        split: bool = True,
        segment: int | None = None,
        jobs: int = 0,
    ):
        """
        Initialize Demucs separator.
        
        Args:
            model: Model name to use (default: "htdemucs")
            device: Device to run on (None for auto-detect, "cuda" for GPU, "cpu" for CPU)
            shifts: Number of random shifts for better quality (higher = better but slower)
            overlap: Overlap between segments (0.0 to 1.0)
            split: Whether to split long audio into segments
            segment: Segment length in seconds (None for auto)
            jobs: Number of parallel jobs (0 for auto)
        """
        logger.info(f"Initializing Demucs separator with model: {model}, device: {device}")
        self._engine = Separator(
            model=model,
            device=device,
            shifts=shifts,
            overlap=overlap,
            split=split,
            segment=segment,
            jobs=jobs, 
        )
        
    def separate(self, audio_path: Path) -> Tuple[th.Tensor, Dict[str, th.Tensor]]:
        """
        Separate audio file into stems using Demucs.
        
        This method loads an audio file and separates it into individual stems:
        - vocals: Isolated vocal track
        - drums: Isolated drum track
        - bass: Isolated bass track
        - other: Everything else
        
        Args:
            audio_path: Path to audio file to separate
            
        Returns:
            Tuple of (original_audio_tensor, dict_of_stems) where:
            - original_audio_tensor: The original audio as a PyTorch tensor
            - dict_of_stems: Dictionary mapping stem names to separated audio tensors
            
        Raises:
            FileNotFoundError: If audio file doesn't exist
            RuntimeError: If separation fails (e.g., unsupported format, model error)
        """
        logger.info(f"Separating audio file: {audio_path}")
        try:
            result = self._engine.separate_audio_file(audio_path)
            logger.info(f"Successfully separated audio into {len(result[1])} stems")
            return result
        except Exception as e:
            logger.error(f"Failed to separate audio file {audio_path}: {e}")
            raise RuntimeError(f"Failed to separate audio: {e}") from e

    @property
    def samplerate(self) -> int:
        """
        Get the sample rate of the separator model.
        
        Returns:
            Sample rate in Hz (typically 44100 for most models)
        """
        return self._engine.samplerate


