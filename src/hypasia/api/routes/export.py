"""
Hypasia AI — Parquet Export API + Server-side JSONL write endpoint.
"""
from typing import Optional, List
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter()


class ExportRequest(BaseModel):
    rows: List[dict]
    filename: str = "hypasia_dataset"
    format: str = "jsonl"   # "jsonl" | "parquet"


@router.post("/export/dataset")
def export_dataset(req: ExportRequest):
    """Write rows to a file server-side and return download path."""
    try:
        out_dir = Path("hypasia_output")
        out_dir.mkdir(exist_ok=True)

        safe_name = req.filename.replace("/", "_").replace("\\", "_")
        fmt = req.format.lower()

        if fmt == "parquet":
            try:
                import pandas as pd
                out_path = out_dir / f"{safe_name}.parquet"
                df = pd.DataFrame(req.rows)
                df.to_parquet(str(out_path), index=False)
            except ImportError:
                raise HTTPException(status_code=500, detail="pandas/pyarrow not installed: pip install pandas pyarrow")
        else:
            import json
            out_path = out_dir / f"{safe_name}.jsonl"
            with open(out_path, "w", encoding="utf-8") as f:
                for row in req.rows:
                    f.write(json.dumps(row, ensure_ascii=False) + "\n")

        return {
            "status": "success",
            "path": str(out_path),
            "rows": len(req.rows),
            "format": fmt,
            "filename": out_path.name,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
