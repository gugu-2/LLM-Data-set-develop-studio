"""
Hypasia AI — Augmentation Engine: Rephrase & Harder Variants.
Uses Gemini or Ollama to generate diverse, harder versions of training pairs.
"""
from __future__ import annotations

import json
import re
from typing import Optional

from hypasia.schema import HypasiaRow


_REPHRASE_PROMPT = """You are a dataset augmentation specialist for LLM fine-tuning.

Given this instruction-response training pair, generate {n} diverse variations.
Each variation should:
1. Rephrase the instruction differently (same intent, different wording)
2. Optionally make it slightly harder or more specific
3. Provide a complete, high-quality response

Return ONLY a JSON array of objects with "instruction" and "response" keys. No markdown.

ORIGINAL:
Instruction: {instruction}
Response: {response}

Return {n} variations as JSON array:"""


def rephrase_rows(
    rows: list[HypasiaRow],
    n_variants: int = 2,
    judge: str = "ollama",
    ollama_model: str = "llama3.1",
    api_key: Optional[str] = None,
) -> list[HypasiaRow]:
    """
    For each row, generate n_variants rephrased versions.
    Returns new rows (originals not included).
    """
    augmented = []
    for row in rows:
        variants = _generate_variants(
            row.instruction, row.response, n=n_variants,
            judge=judge, ollama_model=ollama_model, api_key=api_key,
        )
        for v in variants:
            if not isinstance(v, dict):
                continue
            instr = str(v.get("instruction", "")).strip()
            resp = str(v.get("response", "")).strip()
            if not instr or len(resp) < 20:
                continue
            new_row = HypasiaRow(
                instruction=instr,
                response=resp,
                source=row.source + "[augmented]",
                source_type=row.source_type,
                title=row.title,
            )
            augmented.append(new_row)
    return augmented


def _generate_variants(
    instruction: str,
    response: str,
    n: int = 2,
    judge: str = "ollama",
    ollama_model: str = "llama3.1",
    api_key: Optional[str] = None,
) -> list[dict]:
    prompt = _REPHRASE_PROMPT.format(
        n=n,
        instruction=instruction[:500],
        response=response[:800],
    )

    if api_key or judge == "gemini":
        return _call_gemini(prompt, api_key or "")
    elif judge == "ollama":
        return _call_ollama(prompt, model=ollama_model)
    return []


def _call_gemini(prompt: str, api_key: str) -> list[dict]:
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return _parse_json(response.text)
    except Exception as e:
        print(f"[augment] Gemini error: {e}")
        return []


def _call_ollama(prompt: str, model: str) -> list[dict]:
    try:
        import requests
        resp = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": model, "prompt": prompt, "stream": False,
                  "options": {"temperature": 0.7}},
            timeout=120,
        )
        resp.raise_for_status()
        return _parse_json(resp.json().get("response", ""))
    except Exception as e:
        print(f"[augment] Ollama error: {e}")
        return []


def _parse_json(text: str) -> list[dict]:
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
