"""
Hypasia AI — API Routes for Mining and Scoring
"""
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from hypasia.schema import HypasiaRow
from hypasia.mining.crawler.web import crawl_source
from hypasia.mining.connectors.huggingface import fetch_hf_dataset
from hypasia.mining.parsers.dispatcher import parse_file
from hypasia.scorer.composite import score_rows
from hypasia.cleaner.normalise import normalise_rows
from hypasia.cleaner.dedup import dedup_rows
from hypasia.cleaner.length import filter_by_length
from hypasia.selector.strategies import filter_by_threshold
from hypasia.selector.clustering import select_diverse

router = APIRouter()

class RunRequest(BaseModel):
    source: str
    judge: str = "gemini"
    ollama_model: str = "llama3.1"
    threshold: float = 7.0
    depth: int = 2
    limit: Optional[int] = 50
    api_key: Optional[str] = None
    scrub_pii: bool = False
    language_filter: Optional[str] = None  # e.g. "en" or "en,fr"
    diversity_clusters: Optional[int] = None
    use_playwright: bool = False

@router.post("/run")
async def run_pipeline(req: RunRequest):
    """Run the pipeline on a URL or HF dataset."""
    try:
        # 1. Mine
        if req.source.startswith("http") and (
            "youtube.com" in req.source or "youtu.be" in req.source
        ):
            from hypasia.mining.connectors.youtube import fetch_youtube
            rows = fetch_youtube(req.source)
        elif req.source.startswith("http") and "wikipedia.org" in req.source:
            from hypasia.mining.connectors.wikipedia import fetch_wikipedia
            title = req.source.split("/wiki/")[-1].replace("_", " ")
            rows = fetch_wikipedia(title)
        elif req.source.startswith("http"):
            rows = crawl_source(req.source, depth=req.depth, use_playwright=req.use_playwright)
        elif req.source.lower().startswith("wikipedia:"):
            from hypasia.mining.connectors.wikipedia import fetch_wikipedia_search
            query = req.source[10:].strip()
            rows = fetch_wikipedia_search(query, max_articles=5)
        else:
            rows = fetch_hf_dataset(req.source)


        if req.limit:
            rows = rows[:req.limit]

        if not rows:
            raise HTTPException(status_code=400, detail="No data extracted.")

        # 2. Clean
        rows = normalise_rows(rows)
        rows = filter_by_length(rows)
        rows = dedup_rows(rows)

        # 2b. Optional: language filter
        if req.language_filter:
            from hypasia.cleaner.language import filter_by_language
            allowed = [l.strip() for l in req.language_filter.split(",") if l.strip()]
            rows = filter_by_language(rows, allowed=allowed)

        # 2c. Optional: PII scrub
        if req.scrub_pii:
            from hypasia.cleaner.pii import scrub_rows
            rows = scrub_rows(rows)

        rows = score_rows(
            rows, 
            judge=req.judge, 
            ollama_model=req.ollama_model, 
            threshold=req.threshold, 
            batch_size=10,
            api_key=req.api_key
        )

        # 4. Filter
        rows = filter_by_threshold(rows, req.threshold)

        # 5. Diversity Clustering
        if req.diversity_clusters and req.diversity_clusters > 0:
            rows = select_diverse(rows, req.diversity_clusters)

        return {"status": "success", "rows": [r.__dict__ for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_and_run(
    file: UploadFile = File(...),
    judge: str = Form("gemini"),
    ollama_model: str = Form("llama3.1"),
    threshold: float = Form(7.0),
    api_key: Optional[str] = Form(None),
    diversity_clusters: Optional[int] = Form(None),
    use_playwright: bool = Form(False)
):
    """Upload a local file and run the pipeline. Supports Bulk URLs in .txt."""
    temp_path: Optional[Path] = None
    try:
        # Sanitize filename
        safe_name = file.filename.replace("/", "_").replace("\\", "_") if file.filename else "upload.tmp"
        temp_path = Path(f"temp_{safe_name}")
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        # Check for bulk URL mining (.txt or .csv with http lines)
        if temp_path.suffix.lower() in [".txt", ".csv"]:
            content = temp_path.read_text(encoding="utf-8", errors="ignore")
            lines = [line.strip() for line in content.splitlines() if line.strip().startswith("http")]
            total_lines = max(len(content.splitlines()), 1)
            if len(lines) > 0 and len(lines) / total_lines > 0.5:
                # Majority of lines are URLs — Bulk Mine mode
                rows = []
                for url in lines:
                    rows.extend(crawl_source(url, depth=1, use_playwright=use_playwright))
                temp_path.unlink()
                if not rows:
                    raise HTTPException(status_code=400, detail="No data extracted from bulk URLs.")
            else:
                rows = parse_file(temp_path, api_key=api_key)
                temp_path.unlink()
        else:
            rows = parse_file(temp_path, api_key=api_key)
            temp_path.unlink()

        if not rows:
            raise HTTPException(status_code=400, detail="Could not parse file.")

        # Clean
        rows = normalise_rows(rows)
        rows = filter_by_length(rows)
        rows = dedup_rows(rows)

        # Score
        rows = score_rows(
            rows,
            judge=judge,
            ollama_model=ollama_model,
            threshold=threshold,
            batch_size=10,
            api_key=api_key
        )

        # Filter
        rows = filter_by_threshold(rows, threshold)

        if diversity_clusters and diversity_clusters > 0:
            rows = select_diverse(rows, diversity_clusters)

        return {"status": "success", "rows": [r.__dict__ for r in rows]}
    except HTTPException:
        raise
    except Exception as e:
        if temp_path and temp_path.exists():
            temp_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))
