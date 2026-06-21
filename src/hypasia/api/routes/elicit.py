"""
Hypasia AI — Expert Knowledge Elicitor API Routes.
Upload audio or transcript → auto-generate training pairs → review UI.
"""
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

router = APIRouter()


@router.post("/upload")
async def elicit_upload(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    mode: str = Form("transcript"),  # "audio" | "transcript"
    judge: str = Form("ollama"),
    ollama_model: str = Form("llama3.1"),
    api_key: Optional[str] = Form(None),
):
    """
    Upload an audio file or paste a text transcript.
    Returns extracted instruction-response training pairs.
    """
    temp_path: Optional[Path] = None
    try:
        rows = []

        if mode == "audio" and file:
            safe_name = (file.filename or "upload.tmp").replace("/", "_")
            temp_path = Path(f"temp_elicit_{safe_name}")
            with open(temp_path, "wb") as f_out:
                f_out.write(await file.read())
            from hypasia.mining.parsers.audio import parse_audio
            rows = parse_audio(temp_path)
            temp_path.unlink()

        elif mode == "transcript":
            # Accept either an uploaded .txt file OR raw pasted text
            if file and not text:
                safe_name = (file.filename or "transcript.txt").replace("/", "_")
                temp_path = Path(f"temp_elicit_{safe_name}")
                with open(temp_path, "wb") as f_out:
                    f_out.write(await file.read())
                from hypasia.mining.parsers.audio import parse_transcript
                rows = parse_transcript(temp_path)
                temp_path.unlink()
            elif text:
                from hypasia.mining.parsers.transcript import parse_transcript_text
                rows = parse_transcript_text(
                    text,
                    judge=judge,
                    ollama_model=ollama_model,
                    api_key=api_key,
                )
            else:
                raise HTTPException(status_code=400, detail="Provide a file or text.")
        else:
            raise HTTPException(status_code=400, detail="Invalid mode. Use 'audio' or 'transcript'.")

        if not rows:
            raise HTTPException(status_code=400, detail="No training pairs could be extracted.")

        return {
            "status": "success",
            "pairs": [
                {
                    "instruction": r.instruction,
                    "response": r.response,
                    "source": r.source,
                    "title": r.title,
                }
                for r in rows
            ],
            "total": len(rows),
        }

    except HTTPException:
        raise
    except Exception as e:
        if temp_path and temp_path.exists():
            temp_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))
