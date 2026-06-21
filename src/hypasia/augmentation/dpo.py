"""
Hypasia AI — DPO Pair Generation.
Generates bad/rejected responses for given instructions to create DPO training pairs.
"""
from __future__ import annotations

import json
from typing import Optional

from hypasia.schema import HypasiaRow

_BAD_RESPONSE_PROMPT = """You are an AI tasked with generating a poor, unhelpful, or lazy response to the given instruction.
The goal is to use this as a 'rejected' example for DPO alignment training.
Make the response lazy, slightly hallucinatory, or lacking detail, but keep it somewhat relevant.

INSTRUCTION: {instruction}

Return ONLY the bad response. No markdown, no prefixes.
"""

def generate_dpo_pairs(
    rows: list[HypasiaRow],
    api_key: Optional[str] = None,
    judge: str = "gemini",
    ollama_model: str = "llama3.1",
) -> list[dict]:
    """
    Given a list of rows (which act as 'chosen'), generate 'rejected' responses
    and return a list of dicts: {prompt, chosen, rejected}.
    """
    if judge == "gemini" and not api_key:
        raise ValueError("api_key is required for Gemini DPO generation.")

    pairs = []

    if judge == "gemini":
        from google import genai
        from google.genai import types
        import time

        client = genai.Client(api_key=api_key)
        for i, row in enumerate(rows):
            prompt = _BAD_RESPONSE_PROMPT.format(instruction=row.instruction)
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.7),
                )
                bad_resp = response.text.strip()
            except Exception as e:
                bad_resp = f"I don't know the answer to this. Error: {e}"

            pairs.append({
                "prompt": row.instruction,
                "chosen": row.response,
                "rejected": bad_resp
            })
            if i < len(rows) - 1:
                time.sleep(4.0)  # Respect free tier rate limits (15 req/min)

    elif judge == "ollama":
        import requests
        for row in rows:
            prompt = _BAD_RESPONSE_PROMPT.format(instruction=row.instruction)
            try:
                resp = requests.post(
                    "http://localhost:11434/api/generate",
                    json={"model": ollama_model, "prompt": prompt, "stream": False},
                    timeout=60
                )
                if resp.status_code == 200:
                    bad_resp = resp.json().get("response", "").strip()
                else:
                    bad_resp = "I cannot provide an answer."
            except Exception:
                bad_resp = "I don't know."

            pairs.append({
                "prompt": row.instruction,
                "chosen": row.response,
                "rejected": bad_resp
            })

    return pairs
