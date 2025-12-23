from pathlib import Path
from demucs.api import Separator, save_audio
from sympy import tensor

import torch

class DemucsSeparator:
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
        self._engine = Separator(
            model=model,
            device=device,
            shifts=shifts,
            overlap=overlap,
            split=split,
            segment=segment,
            jobs=jobs, 
        )
        
    def separate(self, audio_path: Path) -> tuple[torch.tensor, dict[str, torch.tensor]]:
        print("separating audio")
        return self._engine.separate_audio_file(audio_path)

    @property
    def samplerate(self) -> int:
        return self._engine.samplerate

# temporary "worker" 
if __name__ == "__main__":
    separator = DemucsSeparator()
    input, separated = separator.separate("glimpse_of_us.mp3")
    
    for stem, source in separated.items():
        save_audio()

    print(separator.separate("glimpse_of_us.mp3"))


