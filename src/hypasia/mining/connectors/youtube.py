"""
Hypasia AI — YouTube Miner.
Fetches transcripts from YouTube videos (captions preferred, Whisper fallback).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from hypasia.schema import HypasiaRow


def fetch_youtube(url: str, use_whisper: bool = False) -> list[HypasiaRow]:
    """
    Mine a YouTube video URL for training data.
    1. Try youtube-transcript-api for captions (fast, no download).
    2. Fall back to yt-dlp + Whisper if no captions available.
    """
    video_id = _extract_video_id(url)
    if not video_id:
        raise ValueError(f"Could not extract video ID from: {url}")

    # Try captions first
    transcript_text = _fetch_captions(video_id)

    # Whisper fallback
    if not transcript_text and use_whisper:
        transcript_text = _fetch_with_whisper(url)

    if not transcript_text:
        raise ValueError(
            "No captions found. Install whisper and pass use_whisper=True for audio transcription."
        )

    from hypasia.mining.parsers.transcript import parse_transcript_text
    return parse_transcript_text(
        transcript_text,
        source=url,
        title=f"YouTube: {video_id}",
    )


def _extract_video_id(url: str) -> Optional[str]:
    import re
    patterns = [
        r"(?:v=|youtu\.be/|embed/|shorts/)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def _fetch_captions(video_id: str) -> Optional[str]:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join(entry["text"] for entry in transcript)
    except ImportError:
        print("[youtube] youtube-transcript-api not installed: pip install youtube-transcript-api")
        return None
    except Exception as e:
        print(f"[youtube] No captions for {video_id}: {e}")
        return None


def _fetch_with_whisper(url: str) -> Optional[str]:
    import tempfile
    import os
    try:
        import yt_dlp
        import whisper
    except ImportError:
        print("[youtube] yt-dlp or whisper not installed.")
        return None

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, "audio.mp3")
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": audio_path,
            "quiet": True,
            "postprocessors": [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3"}],
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        model = whisper.load_model("base")
        result = model.transcribe(audio_path)
        return result.get("text", "").strip()
