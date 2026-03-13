"""
Audio Format Converter using FFmpeg.

Converts audio files to standard WAV format (16-bit PCM, 44100Hz, stereo)
for consistent playback in the audio engine.
"""
import subprocess
import logging
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class AudioConverter:
    """
    Audio format converter using FFmpeg.
    
    Converts audio files to standardized WAV format:
    - 16-bit PCM
    - 44100 Hz sample rate
    - Stereo (2 channels)
    """
    
    TARGET_SAMPLE_RATE = 44100
    TARGET_CHANNELS = 2
    TARGET_FORMAT = "wav"
    TARGET_BIT_DEPTH = 16
    
    @classmethod
    def convert_to_wav(
        cls,
        input_path: Path,
        output_path: Path,
    ) -> Dict[str, Any]:
        """
        Convert audio file to standard WAV format.
        
        Args:
            input_path: Path to input audio file
            output_path: Path where converted WAV will be saved
            
        Returns:
            Dict with conversion metadata (duration, sample_rate, channels, file_size)
            
        Raises:
            FileNotFoundError: If input file doesn't exist
            subprocess.CalledProcessError: If ffmpeg conversion fails
            RuntimeError: If ffmpeg is not installed
        """
        if not input_path.exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            # Convert to WAV with specific parameters
            # -i: input file
            # -ar: sample rate
            # -ac: audio channels
            # -acodec: audio codec
            # -sample_fmt: sample format (16-bit signed integer)
            # -y: overwrite output file
            cmd = [
                "ffmpeg",
                "-i", str(input_path),
                "-ar", str(cls.TARGET_SAMPLE_RATE),
                "-ac", str(cls.TARGET_CHANNELS),
                "-acodec", "pcm_s16le",  # 16-bit PCM
                "-y",  # Overwrite output
                str(output_path)
            ]
            
            logger.info(f"Converting audio: {input_path.name} -> {output_path.name}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            logger.info(f"Conversion successful: {output_path}")
            
            # Get metadata from converted file
            metadata = cls.get_audio_metadata(output_path)
            
            return metadata
            
        except FileNotFoundError:
            logger.error("FFmpeg not found. Please install ffmpeg.")
            raise RuntimeError(
                "FFmpeg is not installed. Install it using: "
                "sudo apt-get install ffmpeg (Linux) or brew install ffmpeg (Mac)"
            )
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg conversion failed: {e.stderr}")
            raise RuntimeError(f"Audio conversion failed: {e.stderr}")
    
    @classmethod
    def get_audio_metadata(cls, audio_path: Path) -> Dict[str, Any]:
        """
        Extract metadata from audio file using ffprobe.
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dict with duration, sample_rate, channels, file_size
        """
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        try:
            # Use ffprobe to get audio metadata
            cmd = [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration:stream=sample_rate,channels",
                "-of", "default=noprint_wrappers=1",
                str(audio_path)
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            # Parse output
            metadata = {}
            for line in result.stdout.strip().split("\n"):
                if "=" in line:
                    key, value = line.split("=", 1)
                    if key == "duration":
                        metadata["duration"] = float(value)
                    elif key == "sample_rate":
                        metadata["sample_rate"] = int(value)
                    elif key == "channels":
                        metadata["channels"] = int(value)
            
            # Add file size
            metadata["file_size"] = audio_path.stat().st_size
            
            return metadata
            
        except FileNotFoundError:
            logger.error("FFprobe not found. Please install ffmpeg.")
            raise RuntimeError("FFprobe is not installed (part of ffmpeg package)")
        except subprocess.CalledProcessError as e:
            logger.error(f"FFprobe failed: {e.stderr}")
            # Return basic metadata
            return {
                "duration": None,
                "sample_rate": cls.TARGET_SAMPLE_RATE,
                "channels": cls.TARGET_CHANNELS,
                "file_size": audio_path.stat().st_size if audio_path.exists() else 0
            }
    
    @classmethod
    def is_conversion_needed(cls, file_extension: str) -> bool:
        """
        Check if a file needs conversion based on its extension.
        
        Args:
            file_extension: File extension (e.g., '.mp3', '.wav')
            
        Returns:
            True if conversion is needed, False if already WAV
        """
        # Always convert to ensure consistent format (sample rate, channels, bit depth)
        # Even WAV files might have different specs
        return True
