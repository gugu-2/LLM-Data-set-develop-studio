"""
Hypasia AI — Synthetic Data Factory Backend
Streams Gemini-generated instruction/response pairs from a topic description.
"""
import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class SynthPreviewRequest(BaseModel):
    topic: str
    domain: str = "general"
    difficulty: str = "intermediate"  # beginner | intermediate | expert | adversarial
    style_examples: Optional[str] = ""
    api_key: Optional[str] = None


class SynthGenerateRequest(BaseModel):
    topic: str
    domain: str = "general"
    difficulty: str = "intermediate"
    count: int = 100
    diversity: str = "medium"  # low | medium | high
    style_examples: Optional[str] = ""
    api_key: Optional[str] = None


DIFFICULTY_INSTRUCTIONS = {
    "beginner": "Generate simple, short, easy-to-understand questions and answers. Use plain language. Avoid jargon.",
    "intermediate": "Generate moderately complex questions and detailed answers. Include some technical terms with explanations.",
    "expert": "Generate highly technical, nuanced questions requiring deep domain knowledge. Answers should be comprehensive and cite reasoning.",
    "adversarial": "Generate tricky, edge-case, and adversarial questions designed to expose model weaknesses. Include ambiguous scenarios, contradictions, and out-of-scope requests.",
}

DIVERSITY_INSTRUCTIONS = {
    "low": "Generate similar pairs around a single sub-topic.",
    "medium": "Generate diverse pairs covering multiple aspects, perspectives, and use-cases of the topic.",
    "high": "Generate maximally diverse pairs: different formats (direct Q&A, troubleshooting, creative, factual, conversational), different sub-topics, different user personas, and edge cases.",
}


def build_prompt(topic: str, domain: str, difficulty: str, diversity: str, count: int, style_examples: str) -> str:
    diff_instr = DIFFICULTY_INSTRUCTIONS.get(difficulty, DIFFICULTY_INSTRUCTIONS["intermediate"])
    div_instr = DIVERSITY_INSTRUCTIONS.get(diversity, DIVERSITY_INSTRUCTIONS["medium"])

    style_section = ""
    if style_examples and style_examples.strip():
        style_section = f"""
STYLE REFERENCE (match this tone and format):
{style_examples}
"""

    return f"""You are a world-class AI training data generator. Your job is to generate high-quality instruction/response pairs for fine-tuning a large language model.

TOPIC: {topic}
DOMAIN: {domain}
{style_section}
DIFFICULTY LEVEL: {difficulty}
{diff_instr}

DIVERSITY LEVEL: {diversity}
{div_instr}

CRITICAL RULES:
1. Each pair must be unique and non-repetitive
2. Instructions must be realistic questions a real user would ask
3. Responses must be accurate, helpful, and appropriately detailed
4. Never generate harmful, biased, or false information
5. Output ONLY valid JSON objects, one per line, no extra text

Generate exactly {count} training pairs. Output each as a JSON object on its own line:
{{"instruction": "...", "response": "..."}}

Begin generating now:"""


@router.post("/synth/preview")
def synth_preview(req: SynthPreviewRequest):
    """Generate 5 sample pairs for preview before full generation."""
    from hypasia.config import cfg
    active_key = req.api_key or cfg.gemini_api_key
    if not active_key:
        raise HTTPException(status_code=401, detail="No Gemini API key. Add it in Settings.")

    try:
        from google import genai
        client = genai.Client(api_key=active_key)

        prompt = build_prompt(req.topic, req.domain, req.difficulty, "medium", 5, req.style_examples or "")
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = response.text or ""

        pairs = []
        for line in text.strip().split("\n"):
            line = line.strip()
            if line.startswith("{") and line.endswith("}"):
                try:
                    pairs.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

        return {"status": "ok", "pairs": pairs[:5], "total": len(pairs)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")


@router.post("/synth/generate")
def synth_generate(req: SynthGenerateRequest):
    """Streams generated instruction/response pairs as JSONL."""
    from hypasia.config import cfg
    active_key = req.api_key or cfg.gemini_api_key
    if not active_key:
        raise HTTPException(status_code=401, detail="No Gemini API key. Add it in Settings.")

    try:
        from google import genai
        client = genai.Client(api_key=active_key)

        # Split large counts into batches of 50 for reliability
        batch_size = 50
        total_generated = 0
        batches = []
        remaining = req.count
        while remaining > 0:
            batches.append(min(batch_size, remaining))
            remaining -= batch_size

        def stream_generator():
            nonlocal total_generated
            for batch_count in batches:
                prompt = build_prompt(
                    req.topic, req.domain, req.difficulty,
                    req.diversity, batch_count, req.style_examples or ""
                )
                try:
                    response = client.models.generate_content(
                        model="gemini-2.0-flash",
                        contents=prompt
                    )
                    text = response.text or ""
                    for line in text.strip().split("\n"):
                        line = line.strip()
                        if line.startswith("{") and line.endswith("}"):
                            try:
                                pair = json.loads(line)
                                if "instruction" in pair and "response" in pair:
                                    total_generated += 1
                                    yield json.dumps(pair) + "\n"
                            except json.JSONDecodeError:
                                pass
                except Exception as e:
                    yield json.dumps({"error": str(e)}) + "\n"

        return StreamingResponse(stream_generator(), media_type="application/x-ndjson")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")
