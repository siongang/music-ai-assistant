from pathlib import Path

from app.storage.local_storage import LocalStorage
from app.services.stem_service import StemService 
from demucs.audio import save_audio



class PipelineRunnerService():
    def __init__(self, storage):
        self.stem_service = StemService()

    def run(self, input_path, stems_path, ext):
        # Run demucs, output tuple of tensors
        input, separated = self.stem_service.separate(audio_path=input_path)

        kwargs = {
            "samplerate": self.stem_service.samplerate
        }


        track = Path(input_path).name.rsplit(".", 1)[0]
        stem_path_template="{track}.{stem}.{ext}"

        for stem, source in separated.items():
            stem_path = stems_path / stem_path_template.format(
                track=track,
                stem=stem,
                ext=ext,
            )

            save_audio(
                source, 
                str(stem_path), 
                **kwargs
            )



if __name__ == "__main__":
    pipeline_runner = PipelineRunnerService()
    pipeline_runner.run("glimpse_of_us.mp3", 1, "wav")