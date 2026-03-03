"""
Waveform Peak Generator.

Generates waveform visualization data (min/max peaks) at multiple zoom levels
for efficient rendering in the frontend.
"""
import json
import logging
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Tuple
import wave

logger = logging.getLogger(__name__)


class WaveformGenerator:
    """
    Generate waveform peak data for audio visualization.
    
    Generates peaks at multiple resolutions (samples per second) for
    zoom-level adaptive rendering.
    """
    
    # Supported zoom levels (samples per second)
    ZOOM_LEVELS = [256, 512, 1024, 2048]
    
    @classmethod
    def generate_peaks(
        cls,
        audio_path: Path,
        level: int = 512
    ) -> Dict[str, Any]:
        """
        Generate waveform peak data for a given zoom level.
        
        Args:
            audio_path: Path to WAV audio file
            level: Samples per second (resolution)
            
        Returns:
            Dict with audio_id, level, duration, channels, and peaks array
        """
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        if level not in cls.ZOOM_LEVELS:
            logger.warning(f"Unsupported zoom level {level}, using 512")
            level = 512
        
        logger.info(f"Generating waveform peaks at level {level} for {audio_path.name}")
        
        try:
            # Read WAV file
            with wave.open(str(audio_path), 'rb') as wav_file:
                # Get audio parameters
                n_channels = wav_file.getnchannels()
                sample_width = wav_file.getsampwidth()
                framerate = wav_file.getframerate()
                n_frames = wav_file.getnframes()
                duration = n_frames / float(framerate)
                
                # Read all frames
                frames = wav_file.readframes(n_frames)
                
                # Convert to numpy array
                if sample_width == 1:
                    dtype = np.uint8
                elif sample_width == 2:
                    dtype = np.int16
                elif sample_width == 4:
                    dtype = np.int32
                else:
                    raise ValueError(f"Unsupported sample width: {sample_width}")
                
                audio_data = np.frombuffer(frames, dtype=dtype)
                
                # Reshape to (n_samples, n_channels)
                if n_channels > 1:
                    audio_data = audio_data.reshape(-1, n_channels)
                else:
                    audio_data = audio_data.reshape(-1, 1)
                
                # Normalize to -1.0 to 1.0
                if dtype == np.uint8:
                    audio_data = (audio_data.astype(np.float32) - 128) / 128.0
                elif dtype == np.int16:
                    audio_data = audio_data.astype(np.float32) / 32768.0
                elif dtype == np.int32:
                    audio_data = audio_data.astype(np.float32) / 2147483648.0
                
                # Generate peaks
                peaks = cls._calculate_peaks(audio_data, framerate, level, n_channels)
                
                return {
                    "level": level,
                    "duration": duration,
                    "channels": n_channels,
                    "peaks": peaks
                }
                
        except Exception as e:
            logger.error(f"Failed to generate waveform peaks: {e}", exc_info=True)
            raise RuntimeError(f"Waveform generation failed: {e}")
    
    @classmethod
    def _calculate_peaks(
        cls,
        audio_data: np.ndarray,
        sample_rate: int,
        level: int,
        n_channels: int
    ) -> List[Dict[str, float]]:
        """
        Calculate min/max peaks for visualization.
        
        Args:
            audio_data: Normalized audio data (n_samples, n_channels)
            sample_rate: Sample rate in Hz
            level: Target samples per second
            n_channels: Number of audio channels
            
        Returns:
            List of dicts with 'min' and 'max' values
        """
        n_samples = audio_data.shape[0]
        
        # Calculate how many audio samples per peak
        samples_per_peak = sample_rate // level
        
        if samples_per_peak < 1:
            samples_per_peak = 1
        
        # Calculate number of peaks
        n_peaks = n_samples // samples_per_peak
        
        if n_peaks == 0:
            n_peaks = 1
        
        peaks = []
        
        # For stereo, we'll mix down to mono for visualization
        if n_channels > 1:
            audio_mono = np.mean(audio_data, axis=1)
        else:
            audio_mono = audio_data.flatten()
        
        # Calculate peaks
        for i in range(n_peaks):
            start_idx = i * samples_per_peak
            end_idx = min((i + 1) * samples_per_peak, len(audio_mono))
            
            if start_idx >= len(audio_mono):
                break
            
            chunk = audio_mono[start_idx:end_idx]
            
            if len(chunk) > 0:
                min_val = float(np.min(chunk))
                max_val = float(np.max(chunk))
                
                peaks.append({
                    "min": min_val,
                    "max": max_val
                })
        
        return peaks
    
    @classmethod
    def save_peaks_to_file(
        cls,
        peaks_data: Dict[str, Any],
        output_path: Path
    ) -> None:
        """
        Save waveform peaks to JSON file.
        
        Args:
            peaks_data: Peaks data dict
            output_path: Path where JSON will be saved
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(peaks_data, f, separators=(',', ':'))
        
        logger.info(f"Saved waveform peaks to {output_path}")
    
    @classmethod
    def load_peaks_from_file(cls, peaks_path: Path) -> Dict[str, Any]:
        """
        Load waveform peaks from JSON file.
        
        Args:
            peaks_path: Path to JSON file
            
        Returns:
            Peaks data dict
        """
        if not peaks_path.exists():
            raise FileNotFoundError(f"Peaks file not found: {peaks_path}")
        
        with open(peaks_path, 'r') as f:
            return json.load(f)
