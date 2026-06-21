"""
Hypasia AI — Image Parser using Gemini Vision.
Analyzes images and extracts Q&A pairs suitable for fine-tuning.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from hypasia.schema import HypasiaRow

def parse_image(path: Path, api_key: str = None) -> list[HypasiaRow]:
    """Parse an image using Gemini Vision."""
    if not api_key:
        raise ValueError("Gemini API key is required for Vision & Multi-Modal Mining.")

    try:
        import google.generativeai as genai
        from PIL import Image
    except ImportError:
        raise ImportError("google-generativeai or Pillow not installed.")

    genai.configure(api_key=api_key)
    # Use the vision-capable model
    model = genai.GenerativeModel('gemini-2.5-flash')

    img = Image.open(path)
    prompt = """
    Analyze this image in detail. Extract any text, data, concepts, or visual information present.
    Then, generate 3 diverse Instruction/Response pairs that can be used to fine-tune an AI model to understand the content of this image.
    Format your output strictly as a JSON array of objects, where each object has 'instruction' and 'response' string fields.
    Do not include markdown codeblocks or any other text outside the JSON array.
    """

    response = model.generate_content([prompt, img])
    
    # Parse the JSON response
    try:
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        
        pairs = json.loads(text.strip())
    except Exception as e:
        raise ValueError(f"Failed to parse JSON from Gemini response: {e}\nRaw output: {response.text}")

    rows = []
    source_url = str(path.resolve())
    for p in pairs:
        instruction = p.get("instruction", "")
        resp = p.get("response", "")
        if not instruction or not resp:
            continue
            
        rows.append(HypasiaRow(
            instruction=instruction,
            response=resp,
            source=source_url,
            source_type="image",
            title=path.stem,
            raw_text=f"Image QA: {instruction} -> {resp}",
            date_extracted=datetime.now(timezone.utc).isoformat(),
        ))
        
    return rows
