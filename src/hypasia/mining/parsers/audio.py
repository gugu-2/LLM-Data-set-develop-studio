"""
Hypasia AI — Audio/Transcript parser for Expert Knowledge Elicitor.
Supports Whisper transcription for audio files and direct text transcript parsing.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from hypasia.schema import HypasiaRow


def parse_audio(path: Path, language: str = "en") -> list[HypasiaRow]:
    """
    Transcribe an audio file using OpenAI Whisper and extract training pairs.
    Requires: pip install openai-whisper ffmpeg-python
    """
    try:
        import whisper
    except ImportError:
        raise ImportError(
            "openai-whisper not installed. Run: pip install openai-whisper\n"
            "Also install ffmpeg: https://ffmpeg.org/download.html"
        )

    print(f"[audio] Loading Whisper base model...")
    model = whisper.load_model("base")

    print(f"[audio] Transcribing {path.name}...")
    result = model.transcribe(str(path), language=language)
    transcript_text = result["text"].strip()

    if not transcript_text:
        return []

    # Save transcript to a temp file and process it as text
    from hypasia.mining.parsers.transcript import parse_transcript_text
    return parse_transcript_text(transcript_text, source=str(path), title=path.stem)


def parse_transcript(path: Path) -> list[HypasiaRow]:
    """Parse a .txt transcript file directly (no Whisper needed)."""
    text = path.read_text(encoding="utf-8", errors="ignore").strip()
    if not text:
        return []
    from hypasia.mining.parsers.transcript import parse_transcript_text
    return parse_transcript_text(text, source=str(path), title=path.stem)
