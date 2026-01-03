"""
Basic Pitch MIDI conversion wrapper.

This module provides a wrapper around Basic Pitch for converting audio to MIDI.
Uses lazy loading to avoid importing TensorFlow until the class is instantiated,
which is important for process separation when using both PyTorch and TensorFlow.
"""
from pathlib import Path
from typing import Optional, Sequence, Union
import logging
import subprocess

logger = logging.getLogger(__name__)


class ToMidi:
    """
    Convert audio to MIDI using Basic Pitch (TensorFlow).
    
    This class wraps Basic Pitch's inference functionality. TensorFlow and
    Basic Pitch are imported lazily (only when the class is instantiated) to
    avoid conflicts with PyTorch in the same process.
    
    Example:
        >>> to_midi = ToMidi()
        >>> to_midi.predict_and_save_midi(
        ...     audio_path_list=["audio.wav"],
        ...     output_directory="output/",
        ...     save_midi=True,
        ...     sonify_midi=False,
        ...     save_model_outputs=False,
        ...     save_notes=False
        ... )
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize Basic Pitch MIDI converter.
        
        Args:
            model_path: Optional path to custom model. If None, basic_pitch
                       will use its default model internally.
        
        Note:
            TensorFlow and Basic Pitch are imported lazily (in methods) to
            avoid importing them when this module is loaded. This allows
            PyTorch and TensorFlow to run in separate processes.
        """
        # Store model path - basic_pitch handles default internally
        self.model_path = model_path

    def predict(
        self, 
        audio_path: Path,
        # onset_threshold: float,
        # frame_threshold: float,
        # minimum_note_length: float,
        # minimum_frequency: Optional[float] = None,
        # maximum_frequency: Optional[float] = None,
        # multiple_pitch_bends: bool = False,
        # midi_tempo: Optional[float] = None,
    ):
        """
        Predict MIDI from audio file.
        
        Args:
            audio_path: Path to audio file to convert
            
        Returns:
            Model output (notes, note_events, etc.)
        """
        # Lazy import - only imports when method is called
        from basic_pitch import inference as bp_inference
        
        logger.info(f"Predicting MIDI from audio: {audio_path}")
        return bp_inference.predict(audio_path)

    def predict_and_save_midi(
        self, 
        audio_path_list: Sequence[Union[Path, str]],
        output_directory: Union[Path, str],        
        save_midi: bool,
        sonify_midi: bool,
        save_model_outputs: bool,
        save_notes: bool,
        midi_tempo: Optional[float] = None,
    ) -> None:
        """
        Predict MIDI from audio files and save results.
        
        Args:
            audio_path_list: List of audio file paths to process
            output_directory: Directory to save output files
            save_midi: Whether to save MIDI files
            sonify_midi: Whether to create audio from MIDI
            save_model_outputs: Whether to save raw model outputs
            save_notes: Whether to save note data
            midi_tempo: Optional tempo for MIDI files
            
        Raises:
            RuntimeError: If prediction fails
        """
        # Lazy import - only imports when method is called
        from basic_pitch import inference as bp_inference
        from basic_pitch import ICASSP_2022_MODEL_PATH
        
        # Use default model if no custom model path provided
        model_or_path = self.model_path if self.model_path is not None else ICASSP_2022_MODEL_PATH
        
        # Ensure output directory exists
        output_dir = Path(output_directory)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(
            f"Processing {len(audio_path_list)} audio file(s) to MIDI, "
            f"output directory: {output_directory}"
        )
        
        try:
            # Only pass midi_tempo if it's not None, otherwise use default (120)
            kwargs = {}
            if midi_tempo is not None:
                kwargs['midi_tempo'] = midi_tempo
            
            bp_inference.predict_and_save(
                audio_path_list,
                output_directory,
                save_midi,
                sonify_midi,
                save_model_outputs,
                save_notes,
                model_or_path,  # model_or_model_path: Model instance or path to model file
                **kwargs,
            )
            logger.info(f"Successfully converted {len(audio_path_list)} file(s) to MIDI")
        except Exception as e:
            logger.error(f"Failed to predict and save MIDI: {e}", exc_info=True)
            raise RuntimeError(f"Failed to predict and save MIDI: {e}") from e




    
if __name__ == "__main__":
    to_midi = ToMidi()
    to_midi.predict_and_save_midi(
        audio_path_list=["/home/sion/code/music-assistant/output/michael-row-the-boat-ashore-easy-piano.mp3"],
        output_directory="output/",
        save_midi=True,
        sonify_midi=False,
        save_model_outputs=False,
        save_notes=True
    )
    
    # # Encode the generated WAV file with ffmpeg
    # wav_file = Path("output/michael-row-the-boat-ashore-easy-piano_basic_pitch.wav")
    # if wav_file.exists():
    #     # Use temporary file since ffmpeg can't edit in-place
    #     temp_file = wav_file.parent / f"{wav_file.stem}_temp{wav_file.suffix}"
    #     subprocess.run([
    #         "ffmpeg",
    #         "-i", str(wav_file),
    #         "-acodec", "pcm_s16le",
    #         "-y",
    #         str(temp_file)
    #     ], check=True)
    #     # Replace original with encoded version
    #     temp_file.replace(wav_file)
    #     print(f"Encoded WAV file: {wav_file}")


    
    # out_dir = Path("output/")
    # out_dir.mkdir(parents=True, exist_ok=True)
    # results = to_midi.predict(
    #     audio_path="/home/sion/code/music-assistant/output/michael-row-the-boat-ashore-easy-piano.mp3"
    # )
    # model_output, midi_data, note_events = results
    # # Save model_output to a txt file
    # with open("model_output.txt", "w") as f:
    #     for key, value in model_output.items():
    #         f.write(f"{key}:\n{value}\n\n")
    
    # # Save midi_data to a txt file with a string representation
    # with open("midi_data.txt", "w") as f:
    #     f.write(str(midi_data))

    # # Save note_events to a txt file
    # with open("note_events.txt", "w") as f:
    #     for event in note_events:
    #         f.write(f"{event}\n")
    # print(result[0])