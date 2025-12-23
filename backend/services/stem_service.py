from pathlib import Path
from ..audio_engine.stems.demucs_separator import DemucsSeparator


class StemService():
    def __init__(self):
        self.separator = DemucsSeparator()

    def separate(self, audio_path: Path):
        return self.separator.separate(audio_path)

    @property
    def samplerate(self):
        return self.separator.samplerate