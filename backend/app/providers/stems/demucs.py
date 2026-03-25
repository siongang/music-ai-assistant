"""
Demucs provider for stem_separation capability.

This is the ONLY place in the codebase that imports demucs.
Implements BaseProvider[StemSeparationInput, StemSeparationOutput].
"""
import time
import logging
from pathlib import Path

from app.providers.base import BaseProvider
from app.capabilities.stems import (
    StemSeparationInput,
    StemSeparationOutput,
    StemFile,
)
from app.capabilities.base import ModelMetadata

logger = logging.getLogger(__name__)

# Model imports are intentionally deferred to run() to allow the registry
# to load even when demucs is not installed, and to avoid loading the model
# until it's actually needed.
_DEMUCS_VERSION = "4.0.1"


class DemucsHtdemucsProvider(BaseProvider[StemSeparationInput, StemSeparationOutput]):
    """
    Stem separation using Demucs htdemucs model (4-stem).

    Produces: vocals, drums, bass, other.
    Quality: high. Speed: moderate (~1–2x realtime on CPU, ~10x on GPU).
    """
    provider_key = "demucs_htdemucs"
    capability = "stem_separation"
    _model_name = "htdemucs"

    def __init__(self, device: str | None = None, shifts: int = 1, overlap: float = 0.25):
        self._device = device
        self._shifts = shifts
        self._overlap = overlap
        self._separator = None  # lazy-loaded

    def _get_separator(self):
        if self._separator is None:
            # demucs is only imported here, inside a provider
            from demucs.api import Separator
            self._separator = Separator(
                model=self._model_name,
                device=self._device,
                shifts=self._shifts,
                overlap=self._overlap,
            )
        return self._separator

    @property
    def is_available(self) -> bool:
        try:
            import demucs  # noqa: F401
            return True
        except ImportError:
            return False

    def run(self, input: StemSeparationInput) -> StemSeparationOutput:
        # demucs.audio is also only imported inside this provider
        from demucs.audio import save_audio

        start = time.monotonic()
        separator = self._get_separator()

        logger.info(f"Running {self._model_name} on {input.audio_path}")
        _, separated = separator.separate_audio_file(input.audio_path)

        output_dir = input.output_dir
        output_dir.mkdir(parents=True, exist_ok=True)
        track_name = input.audio_path.stem

        stem_files: list[StemFile] = []
        for stem_name, tensor in separated.items():
            if stem_name not in input.stems_requested:
                continue
            out_path = output_dir / f"{track_name}.{stem_name}.mp3"
            save_audio(tensor, str(out_path), samplerate=separator.samplerate)

            # Confidence is estimated from energy ratio (no native model output)
            energy = float(tensor.pow(2).mean().sqrt())
            confidence = min(1.0, max(0.0, energy * 2))  # heuristic

            stem_files.append(StemFile(
                stem_name=stem_name,
                output_path=out_path,
                confidence=confidence,
            ))

        elapsed = time.monotonic() - start
        overall_confidence = (
            sum(s.confidence for s in stem_files) / len(stem_files) if stem_files else 0.0
        )

        return StemSeparationOutput(
            stems=stem_files,
            sample_rate=separator.samplerate,
            confidence=overall_confidence,
            model_metadata=ModelMetadata(
                provider_key=self.provider_key,
                model_name=self._model_name,
                model_version=_DEMUCS_VERSION,
                params_used={
                    "shifts": self._shifts,
                    "overlap": self._overlap,
                    "device": str(self._device),
                },
                processing_time_seconds=round(elapsed, 2),
            ),
        )
