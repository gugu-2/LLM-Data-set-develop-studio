"""
Hypasia AI — Transcript-to-Training-Pairs extractor.
Uses an LLM (Gemini or Ollama) to extract implicit expert knowledge
from raw transcripts into structured instruction-response pairs.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Optional

from hypasia.schema import HypasiaRow


_EXTRACTION_PROMPT = """You are an expert at extracting training data for LLM fine-tuning.

Below is a transcript from a domain expert (doctor, lawyer, engineer, etc.).
Your task: extract as many high-quality instruction-response pairs as possible.

Look for:
- Questions answered by the expert
- Problems explained with solutions
- "When X happens, do Y because Z" reasoning patterns
- Step-by-step procedures the expert describes
- Domain-specific knowledge that a specialist model should know

For each pair, create a clear, self-contained instruction and a complete response.

Return ONLY a JSON array of objects with keys "instruction" and "response". No markdown.

TRANSCRIPT:
{transcript}

Return JSON array:"""


def parse_transcript_text(
    text: str,
    source: str = "transcript",
    title: str = "Expert Session",
    api_key: Optional[str] = None,
    judge: str = "ollama",
    ollama_model: str = "llama3.1",
    max_chars: int = 12000,
) -> list[HypasiaRow]:
    """
    Extract training pairs from a raw transcript string.
    Uses Gemini (if api_key) or Ollama (if running locally).
    Falls back to rule-based extraction if no LLM is available.
    """
    # Trim if very long
    if len(text) > max_chars:
        text = text[:max_chars] + "\n[transcript truncated]"

    prompt = _EXTRACTION_PROMPT.format(transcript=text)
    pairs = []

    # Try LLM extraction
    if api_key or judge == "gemini":
        pairs = _extract_with_gemini(prompt, api_key or "")
    elif judge == "ollama":
        pairs = _extract_with_ollama(prompt, model=ollama_model)

    # Rule-based fallback
    if not pairs:
        pairs = _extract_rule_based(text)

    rows = []
    for pair in pairs:
        if not isinstance(pair, dict):
            continue
        instruction = str(pair.get("instruction", "")).strip()
        response = str(pair.get("response", "")).strip()
        if not instruction or not response or len(response) < 20:
            continue
        rows.append(HypasiaRow(
            instruction=instruction,
            response=response,
            source=source,
            source_type="expert",
            title=title,
            raw_text=text,
            date_extracted=datetime.now(timezone.utc).isoformat(),
        ))

    return rows


def _extract_with_gemini(prompt: str, api_key: str) -> list[dict]:
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return _parse_json_pairs(response.text)
    except Exception as e:
        print(f"[transcript] Gemini extraction failed: {e}")
        return []


def _extract_with_ollama(prompt: str, model: str = "llama3.1") -> list[dict]:
    try:
        import requests
        resp = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": model, "prompt": prompt, "stream": False,
                  "options": {"temperature": 0.2}},
            timeout=120
        )
        resp.raise_for_status()
        return _parse_json_pairs(resp.json().get("response", ""))
    except Exception as e:
        print(f"[transcript] Ollama extraction failed: {e}")
        return []


def _parse_json_pairs(text: str) -> list[dict]:
    """Extract JSON array from LLM response."""
    text = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`")
    try:
        data = json.loads(text)
        return data if isinstance(data, list) else []
    except Exception:
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
    return []


def _extract_rule_based(text: str) -> list[dict]:
    """
    Fallback: split transcript by Q&A patterns or paragraphs.
    Looks for lines starting with Q: A: or speaker labels.
    """
    pairs = []

    # Q&A pattern
    qa_pattern = re.findall(
        r'(?:Q:|Question:|QUESTION:)\s*(.+?)\s*(?:A:|Answer:|ANSWER:)\s*(.+?)(?=(?:Q:|Question:|QUESTION:)|$)',
        text, re.DOTALL | re.IGNORECASE
    )
    for q, a in qa_pattern:
        pairs.append({"instruction": q.strip(), "response": a.strip()})

    if pairs:
        return pairs

    # Paragraph split fallback
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 50]
    for i in range(0, len(paragraphs) - 1, 2):
        pairs.append({
            "instruction": f"Explain: {paragraphs[i][:100]}",
            "response": paragraphs[i + 1] if i + 1 < len(paragraphs) else paragraphs[i],
        })

    return pairs[:30]  # cap at 30 rule-based pairs
