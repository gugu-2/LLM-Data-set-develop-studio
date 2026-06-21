"""
Hypasia AI — Debugging Assistant
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class DebugRequest(BaseModel):
    error_message: str
    api_key: Optional[str] = None  # Optional UI-supplied key; falls back to .env

@router.post("/analyze")
def analyze_error(req: DebugRequest):
    from hypasia.config import cfg

    active_key = req.api_key or cfg.gemini_api_key

    if not active_key:
        return {
            "status": "error",
            "message": "No Gemini API key found. Enter your key in the Data Miner settings bar or set GEMINI_API_KEY in your .env file."
        }

    try:
        from google import genai
        client = genai.Client(api_key=active_key)

        prompt = f"""
        You are an expert AI engineer. The user is trying to fine-tune an LLM or use the Hypasia AI data mining engine, and encountered this error:

        ERROR:
        {req.error_message}

        Analyze the error and provide a concise, step-by-step solution.
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return {"status": "success", "message": response.text}
    except Exception as e:
        return {"status": "error", "message": f"AI Debugger Error: {str(e)}"}

