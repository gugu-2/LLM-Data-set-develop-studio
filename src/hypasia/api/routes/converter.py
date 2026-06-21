"""
Hypasia AI — Universal Dataset Extractor
End-to-end pipeline: ANY source → multiple dataset formats simultaneously.

Sources: URL, Wikipedia, YouTube, HuggingFace, PDF, DOCX, CSV, bulk URL list, raw text
Formats: instruction, chat, dpo/preference, qa, completion, classification
"""
import json
import tempfile
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

# ─── Format metadata (also used by the frontend) ─────────────────────────────

DATASET_FORMATS = {
    "instruction": {
        "label": "Instruction",
        "icon": "✍️",
        "color": "#4868ff",
        "description": "Instruction → Response pairs. Best for: task-following, command execution.",
        "accuracy": "⭐⭐⭐⭐⭐",
        "schema": {"instruction": "str", "response": "str"},
    },
    "chat": {
        "label": "Chat",
        "icon": "💬",
        "color": "#10b981",
        "description": "Multi-turn conversations. Best for: chatbots, dialogue systems.",
        "accuracy": "⭐⭐⭐⭐⭐",
        "schema": {"messages": [{"role": "user|assistant|system", "content": "str"}]},
    },
    "dpo": {
        "label": "Preference / DPO",
        "icon": "⚖️",
        "color": "#f59e0b",
        "description": "Chosen vs Rejected. Best for: RLHF, DPO alignment training.",
        "accuracy": "⭐⭐⭐⭐⭐",
        "schema": {"prompt": "str", "chosen": "str", "rejected": "str"},
    },
    "qa": {
        "label": "Question–Answer",
        "icon": "❓",
        "color": "#8b5cf6",
        "description": "Factual Q&A with context. Best for: RAG, knowledge-grounded models.",
        "accuracy": "⭐⭐⭐⭐",
        "schema": {"question": "str", "answer": "str", "context": "str"},
    },
    "completion": {
        "label": "Completion",
        "icon": "📝",
        "color": "#ec4899",
        "description": "Text continuation. Best for: base model pretraining.",
        "accuracy": "⭐⭐⭐",
        "schema": {"text": "str"},
    },
    "classification": {
        "label": "Classification",
        "icon": "🏷️",
        "color": "#ea2804",
        "description": "Text + label. Best for: sentiment, intent, topic detection.",
        "accuracy": "⭐⭐⭐⭐⭐",
        "schema": {"text": "str", "label": "str", "label_id": "int"},
    },
}


# ─── Gemini conversion prompt ─────────────────────────────────────────────────

def _build_extraction_prompt(text: str, formats: list[str], domain: str, source_label: str) -> str:
    format_blocks = []

    if "instruction" in formats:
        format_blocks.append("""
[INSTRUCTION FORMAT]
Extract 2-5 instruction/response training pairs from this text.
Each instruction should be a realistic user request or task related to the content.
Each response should be accurate, detailed, and grounded in the source text.
{"format":"instruction","instruction":"<realistic user command or question>","response":"<accurate, detailed answer>"}""")

    if "chat" in formats:
        format_blocks.append("""
[CHAT FORMAT]
Create 1-2 natural multi-turn conversations (3-6 turns) exploring this content.
Make it feel authentic — include follow-up questions and natural dialogue.
{"format":"chat","messages":[{"role":"user","content":"..."},{"role":"assistant","content":"..."},{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}""")

    if "dpo" in formats:
        format_blocks.append("""
[PREFERENCE/DPO FORMAT]
Create 2-3 preference pairs for alignment training.
"chosen" = an accurate, helpful, safe, detailed response.
"rejected" = a plausible but flawed response: too vague, slightly inaccurate, or unhelpful.
{"format":"dpo","prompt":"<user question>","chosen":"<high-quality accurate answer>","rejected":"<plausible but flawed answer>"}""")

    if "qa" in formats:
        format_blocks.append("""
[QUESTION-ANSWER FORMAT]
Extract EVERY distinct factual claim or concept from the text as a Q&A pair.
Generate one pair per extractable fact (aim for 4-10 pairs depending on content density).
Include the exact source sentence as context.
{"format":"qa","question":"<specific factual question>","answer":"<precise, short answer>","context":"<exact relevant sentence from source>"}""")

    if "completion" in formats:
        format_blocks.append("""
[COMPLETION FORMAT]
Create 2-4 text completion training examples.
Each should be a natural sentence split ~60/40: the model reads the prefix and learns to continue.
Use [COMPLETION] to mark the split point.
{"format":"completion","text":"<natural sentence prefix up to split>[COMPLETION]<rest of sentence>"}""")

    if "classification" in formats:
        format_blocks.append("""
[CLASSIFICATION FORMAT]
Identify the main topics/categories in this text and create classification examples.
Generate 3-5 classification rows using different sentences or paragraphs from the source.
Use domain-appropriate labels (e.g. for news: politics/tech/sports; for science: biology/physics/chemistry).
{"format":"classification","text":"<sentence or short paragraph>","label":"<category name>","label_id":<integer starting at 0>}""")

    return f"""You are an expert AI training data engineer. Extract structured training dataset rows from the following source content.

SOURCE: {source_label}
DOMAIN: {domain}

SOURCE TEXT:
\"\"\"
{text[:4000]}
\"\"\"

RULES:
- Output ONLY valid JSON objects — one per line, no extra text, no markdown
- Each JSON object must have a "format" field indicating its type
- All content must be grounded in the source text — do not hallucinate facts
- Maximize the number of high-quality rows extracted from this content
- Every row must be genuinely useful for training an LLM

FORMATS TO GENERATE:
{"".join(format_blocks)}

Begin (one JSON object per line):"""


# ─── Source extraction helpers ────────────────────────────────────────────────

def _extract_from_url(url: str) -> list[tuple[str, str]]:
    """
    Returns list of (text, source_label) tuples for each extracted chunk.
    Handles: Wikipedia, YouTube, regular websites.
    """
    chunks = []
    try:
        if "youtube.com" in url or "youtu.be" in url:
            from hypasia.mining.connectors.youtube import fetch_youtube
            rows = fetch_youtube(url)
            for r in rows[:20]:
                if r.raw_text and len(r.raw_text.strip()) > 100:
                    chunks.append((r.raw_text, f"YouTube: {r.title}"))
        elif "wikipedia.org" in url:
            from hypasia.mining.connectors.wikipedia import fetch_wikipedia
            title = url.split("/wiki/")[-1].replace("_", " ")
            rows = fetch_wikipedia(title)
            for r in rows[:30]:
                if r.raw_text and len(r.raw_text.strip()) > 100:
                    chunks.append((r.raw_text, f"Wikipedia: {r.title}"))
        else:
            from hypasia.mining.crawler.web import crawl_source
            rows = crawl_source(url, depth=2)
            for r in rows[:20]:
                if r.raw_text and len(r.raw_text.strip()) > 100:
                    chunks.append((r.raw_text, r.source))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")

    if not chunks:
        raise HTTPException(status_code=400, detail="No text content could be extracted from this URL.")
    return chunks


def _split_into_chunks(text: str, max_chunk: int = 1500, overlap: int = 200) -> list[str]:
    """
    Split long text into overlapping chunks for better coverage.
    Each chunk is processed separately by Gemini.
    """
    words = text.split()
    chunk_words = max_chunk // 5  # rough chars-to-words ratio
    overlap_words = overlap // 5
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_words])
        if len(chunk.strip()) > 100:
            chunks.append(chunk)
        i += chunk_words - overlap_words
    return chunks if chunks else [text[:max_chunk]]


def _extract_from_file_bytes(filename: str, content: bytes, api_key: str = None) -> list[tuple[str, str]]:
    """Parse file content into (text, source_label) chunks."""
    suffix = Path(filename).suffix.lower()
    chunks = []

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        from hypasia.mining.parsers.dispatcher import parse_file
        rows = parse_file(tmp_path)
        for r in rows:
            if r.raw_text and len(r.raw_text.strip()) > 100:
                chunks.append((r.raw_text, f"{filename}: {r.title or 'section'}"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File parse error: {str(e)}")
    finally:
        tmp_path.unlink(missing_ok=True)

    if not chunks:
        raise HTTPException(status_code=400, detail="Could not extract text from file.")
    return chunks


# ─── Main streaming extraction engine ────────────────────────────────────────

def _stream_extraction(chunks: list[tuple[str, str]], formats: list[str], domain: str, api_key: str):
    """
    Core generator: for each (text, label) chunk, call Gemini and stream results.
    Yields NDJSON lines with format, source, and data fields.
    """
    from google import genai
    client = genai.Client(api_key=api_key)

    total_chunks = len(chunks)
    for chunk_idx, (raw_text, source_label) in enumerate(chunks):
        # Split large text into sub-chunks for better extraction
        sub_chunks = _split_into_chunks(raw_text)

        for sub_text in sub_chunks:
            if len(sub_text.strip()) < 80:
                continue

            # Send progress event
            yield json.dumps({
                "event": "progress",
                "chunk": chunk_idx + 1,
                "total": total_chunks,
                "source": source_label,
            }) + "\n"

            try:
                prompt = _build_extraction_prompt(sub_text, formats, domain, source_label)
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                )
                raw_output = response.text or ""

                for line in raw_output.strip().split("\n"):
                    line = line.strip()
                    if not (line.startswith("{") and line.endswith("}")):
                        continue
                    try:
                        obj = json.loads(line)
                        fmt = obj.pop("format", None)
                        if fmt and fmt in DATASET_FORMATS:
                            yield json.dumps({
                                "event": "row",
                                "format": fmt,
                                "source": source_label,
                                **obj,
                            }) + "\n"
                    except json.JSONDecodeError:
                        pass

            except Exception as e:
                yield json.dumps({
                    "event": "error",
                    "source": source_label,
                    "message": str(e),
                }) + "\n"

    yield json.dumps({"event": "done"}) + "\n"


# ─── API Endpoints ────────────────────────────────────────────────────────────

@router.get("/extract/formats")
def get_formats():
    """Return all supported dataset formats and their metadata."""
    return {"status": "ok", "formats": DATASET_FORMATS}


class ExtractFromTextRequest(BaseModel):
    text: str
    formats: list[str]
    domain: str = "general"
    api_key: Optional[str] = None


class ExtractFromUrlRequest(BaseModel):
    url: str
    formats: list[str]
    domain: str = "general"
    depth: int = 2
    api_key: Optional[str] = None


class ExtractFromBulkRequest(BaseModel):
    urls: list[str]
    formats: list[str]
    domain: str = "general"
    api_key: Optional[str] = None


class ExtractFromHFRequest(BaseModel):
    dataset: str          # e.g. "squad", "tatsu-lab/alpaca"
    formats: list[str]
    domain: str = "general"
    limit: int = 50
    api_key: Optional[str] = None


@router.post("/extract/from-text")
def extract_from_text(req: ExtractFromTextRequest):
    """
    Extract structured training pairs from pasted raw text.
    Streams results as NDJSON.
    """
    from hypasia.config import cfg
    key = req.api_key or cfg.gemini_api_key
    if not key:
        raise HTTPException(status_code=401, detail="No Gemini API key. Add it in Settings.")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if not req.formats:
        raise HTTPException(status_code=400, detail="Select at least one format.")

    chunks = [(req.text, "Pasted Text")]
    return StreamingResponse(
        _stream_extraction(chunks, req.formats, req.domain, key),
        media_type="application/x-ndjson"
    )


@router.post("/extract/from-url")
def extract_from_url(req: ExtractFromUrlRequest):
    """
    Crawl a URL (Wikipedia, YouTube, any website) and extract training pairs.
    Streams results as NDJSON.
    """
    from hypasia.config import cfg
    key = req.api_key or cfg.gemini_api_key
    if not key:
        raise HTTPException(status_code=401, detail="No Gemini API key. Add it in Settings.")
    if not req.formats:
        raise HTTPException(status_code=400, detail="Select at least one format.")

    chunks = _extract_from_url(req.url)
    return StreamingResponse(
        _stream_extraction(chunks, req.formats, req.domain, key),
        media_type="application/x-ndjson"
    )


@router.post("/extract/from-bulk-urls")
def extract_from_bulk(req: ExtractFromBulkRequest):
    """
    Extract training pairs from a list of URLs in parallel.
    Streams results as NDJSON.
    """
    from hypasia.config import cfg
    key = req.api_key or cfg.gemini_api_key
    if not key:
        raise HTTPException(status_code=401, detail="No Gemini API key. Add it in Settings.")

    all_chunks = []
    for url in req.urls[:50]:  # cap at 50 URLs
        try:
            chunks = _extract_from_url(url)
            all_chunks.extend(chunks[:3])  # max 3 chunks per URL
        except Exception:
            pass  # skip failed URLs

    if not all_chunks:
        raise HTTPException(status_code=400, detail="No content could be extracted from the provided URLs.")

    return StreamingResponse(
        _stream_extraction(all_chunks, req.formats, req.domain, key),
        media_type="application/x-ndjson"
    )


@router.post("/extract/from-file")
async def extract_from_file(
    file: UploadFile = File(...),
    formats: str = Form(...),          # comma-separated: "instruction,qa,chat"
    domain: str = Form("general"),
    api_key: str = Form(""),
):
    """
    Upload a PDF, DOCX, CSV, TXT, JSONL, or bulk URL list and extract training pairs.
    Streams results as NDJSON.
    """
    from hypasia.config import cfg
    key = api_key or cfg.gemini_api_key
    if not key:
        raise HTTPException(status_code=401, detail="No Gemini API key. Add it in Settings.")

    fmt_list = [f.strip() for f in formats.split(",") if f.strip() in DATASET_FORMATS]
    if not fmt_list:
        raise HTTPException(status_code=400, detail="No valid formats selected.")

    content = await file.read()
    filename = file.filename or "upload"

    # Check for bulk URL file
    suffix = Path(filename).suffix.lower()
    if suffix in [".txt", ".csv"]:
        text_content = content.decode("utf-8", errors="ignore")
        lines = [l.strip() for l in text_content.splitlines() if l.strip().startswith("http")]
        if len(lines) > 2:
            # It's a bulk URL file
            all_chunks = []
            for url in lines[:30]:
                try:
                    all_chunks.extend(_extract_from_url(url)[:2])
                except Exception:
                    pass
            if all_chunks:
                return StreamingResponse(
                    _stream_extraction(all_chunks, fmt_list, domain, key),
                    media_type="application/x-ndjson"
                )

    chunks = _extract_from_file_bytes(filename, content, key)
    return StreamingResponse(
        _stream_extraction(chunks, fmt_list, domain, key),
        media_type="application/x-ndjson"
    )


@router.post("/extract/from-huggingface")
def extract_from_hf(req: ExtractFromHFRequest):
    """
    Load a HuggingFace dataset and re-extract it in new formats.
    Streams results as NDJSON.
    """
    from hypasia.config import cfg
    key = req.api_key or cfg.gemini_api_key
    if not key:
        raise HTTPException(status_code=401, detail="No Gemini API key. Add it in Settings.")

    try:
        from hypasia.mining.connectors.huggingface import fetch_hf_dataset
        rows = fetch_hf_dataset(req.dataset)[:req.limit]
        chunks = []
        for r in rows:
            text = f"{r.instruction}\n\n{r.response}" if r.instruction else r.raw_text
            if text and len(text.strip()) > 80:
                chunks.append((text, f"HuggingFace:{req.dataset}"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"HuggingFace error: {str(e)}")

    if not chunks:
        raise HTTPException(status_code=400, detail="No content extracted from dataset.")

    return StreamingResponse(
        _stream_extraction(chunks, req.formats, req.domain, key),
        media_type="application/x-ndjson"
    )
