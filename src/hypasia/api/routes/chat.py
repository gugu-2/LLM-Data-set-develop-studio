"""
Hypasia AI — AI Chat Endpoint (Module 7 — full chat mode).
Streaming Gemini chat with context injection for debugging and dataset assistance.
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class Message(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    api_key: Optional[str] = None
    context: Optional[str] = None   # Optional injected context (error logs, code, etc.)
    model: str = "gemini-2.5-flash"


_SYSTEM_PROMPT = """You are Hypasia AI Assistant — an expert in:
- LLM fine-tuning (Unsloth, LoRA, QLoRA, SFT, RLHF)
- Training data curation and quality scoring
- Debugging Python ML training scripts
- HuggingFace ecosystem, datasets, transformers
- Google Colab, AWS SageMaker, GCP Vertex AI, Azure ML deployments
- Common errors: CUDA OOM, tokenizer issues, dataset formatting, dtype mismatches

When given an error, diagnose it precisely and give step-by-step fixes.
When given code, review it and suggest improvements.
Always be concise, technical, and actionable."""


@router.post("/chat")
def chat(req: ChatRequest):
    """Streaming chat endpoint."""
    from hypasia.config import cfg
    active_key = req.api_key or cfg.gemini_api_key

    if not active_key:
        raise HTTPException(status_code=401, detail="No API key provided. Please enter your Gemini API key.")

    try:
        from google import genai

        client = genai.Client(api_key=active_key)

        # Build full content list: system + history + current message
        contents = []
        for m in req.messages[:-1]:
            contents.append({
                "role": m.role if m.role == "user" else "model",
                "parts": [{"text": m.content}],
            })

        # Last message is the current user query
        last_msg = req.messages[-1].content if req.messages else ""

        # Inject context if provided
        if req.context:
            last_msg = f"CONTEXT:\n```\n{req.context}\n```\n\nQUESTION: {last_msg}"

        # Add system prompt prepended to the first user message
        if contents:
            contents.append({"role": "user", "parts": [{"text": last_msg}]})
        else:
            contents = [{"role": "user", "parts": [{"text": _SYSTEM_PROMPT + "\n\n" + last_msg}]}]

        response = client.models.generate_content_stream(
            model=req.model,
            contents=contents,
        )

        def stream_generator():
            try:
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
            except Exception as e:
                yield f"\n\n[API Error: {str(e)}]"

        return StreamingResponse(stream_generator(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

