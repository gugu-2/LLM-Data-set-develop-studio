"""
Hypasia AI — Voice & Audio Dataset Builder
Transcribes YouTube links or audio files using Whisper.
"""
import asyncio
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class YouTubeRequest(BaseModel):
    url: str
    language: str = "en"

@router.post("/mine/audio/youtube")
async def extract_youtube(req: YouTubeRequest):
    """
    Simulates extracting audio via yt-dlp and transcribing via Whisper.
    In production, this would spawn a celery task because whisper is slow.
    """
    if "youtube.com" not in req.url and "youtu.be" not in req.url:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
    # Simulate extraction delay
    await asyncio.sleep(3)
    
    # Return simulated high-quality parsed instruction/response pairs from a "podcast"
    return {
        "status": "ok",
        "source": req.url,
        "results": [
            {
                "instruction": "Explain the concept of self-attention in transformers simply.",
                "response": "Self-attention is a mechanism that allows a model to weigh the importance of different words in a sentence relative to each other. Imagine reading a sentence and instantly knowing which words connect to 'it' or 'they'. That's what self-attention does mathematically.",
                "timestamp": "01:23"
            },
            {
                "instruction": "Why is data quality more important than model size?",
                "response": "Because neural networks are pattern matchers. If you feed a 100-billion parameter model noisy, contradictory data, it will learn to be confidently wrong. A 7-billion parameter model trained on pristine, highly-curated textbook data will consistently outperform it on targeted tasks.",
                "timestamp": "04:15"
            },
            {
                "instruction": "What are the limitations of synthetic data?",
                "response": "Synthetic data can suffer from mode collapse, where the generated responses lose diversity over time. It can also inherit the latent biases of the teacher model. You always need a gold-standard human validation set to anchor it.",
                "timestamp": "08:42"
            }
        ]
    }

@router.post("/mine/audio/upload")
async def extract_upload(file: UploadFile = File(...), language: str = Form("en")):
    """
    Simulates transcribing an uploaded audio file using Whisper.
    """
    if not (file.filename or "").endswith((".mp3", ".wav", ".m4a")):
        raise HTTPException(status_code=400, detail="Unsupported audio format. Use MP3, WAV, or M4A.")
        
    await asyncio.sleep(2)
    
    return {
        "status": "ok",
        "source": file.filename,
        "results": [
            {
                "instruction": "Summarize the key finding of this audio recording.",
                "response": "The key finding discussed is that fine-tuning small models on highly specific datasets yields better ROI for enterprise applications than relying on generalized frontier models via API.",
                "timestamp": "00:00"
            }
        ]
    }
