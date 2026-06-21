"""
Hypasia AI — Dataset Health Inspector Backend
Analyzes uploaded datasets for duplicates, length distributions, and formatting anomalies.
"""
import io
import json
import statistics
import traceback
from typing import List, Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter()

def _parse_file(content: bytes, filename: str) -> List[Dict[str, Any]]:
    rows = []
    text = content.decode("utf-8", errors="replace")
    
    if filename.endswith(".jsonl"):
        for i, line in enumerate(text.split("\n")):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except Exception:
                raise HTTPException(status_code=400, detail=f"Invalid JSON on line {i+1}")
    elif filename.endswith(".json"):
        try:
            data = json.loads(text)
            if isinstance(data, list):
                rows = data
            else:
                raise HTTPException(status_code=400, detail="JSON must contain a list of objects")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON file structure")
    else:
        raise HTTPException(status_code=400, detail="Only .json and .jsonl files are supported for Inspection currently")
        
    return rows

@router.post("/inspector/analyze")
async def analyze_dataset(file: UploadFile = File(...)):
    """Analyze a dataset and return a health report."""
    content = await file.read()
    
    try:
        rows = _parse_file(content, (file.filename or "").lower())
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    if not rows:
        raise HTTPException(status_code=400, detail="Dataset is empty")
        
    total_rows = len(rows)
    
    # Analyze Duplicates
    seen = set()
    exact_duplicates = 0
    
    # Analyze Structure & Length
    missing_fields = 0
    instruction_lengths = []
    response_lengths = []
    
    for row in rows:
        # Detect format implicitly
        instr = row.get("instruction") or row.get("prompt") or row.get("question") or ""
        resp = row.get("response") or row.get("completion") or row.get("answer") or ""
        
        # fallback for chat format
        if "messages" in row and isinstance(row["messages"], list):
            instr = row["messages"][0].get("content", "") if len(row["messages"]) > 0 else ""
            resp = row["messages"][-1].get("content", "") if len(row["messages"]) > 1 else ""
            
        if not instr and not resp:
            missing_fields += 1
            
        # length
        instruction_lengths.append(len(str(instr).split()))
        response_lengths.append(len(str(resp).split()))
        
        # Exact duplication hash
        # To avoid hashing dicts, serialize to sorted string
        row_str = json.dumps(row, sort_keys=True)
        if row_str in seen:
            exact_duplicates += 1
        else:
            seen.add(row_str)
            
    # Calculate distributions
    avg_instr = round(statistics.mean(instruction_lengths)) if instruction_lengths else 0
    avg_resp = round(statistics.mean(response_lengths)) if response_lengths else 0
    max_instr = max(instruction_lengths) if instruction_lengths else 0
    max_resp = max(response_lengths) if response_lengths else 0
    
    # Sub-scores
    dup_ratio = exact_duplicates / total_rows
    dup_score = 100 - (dup_ratio * 100)
    
    format_ratio = missing_fields / total_rows
    format_score = 100 - (format_ratio * 100)
    
    # Balance: Ideal is response being reasonably detailed (avg > 20 words) but not too long
    # This is a very rough heuristic for demonstration
    balance_score = 100
    if avg_resp < 10:
        balance_score -= 30
    if avg_resp > 500:
        balance_score -= 20
        
    final_score = round((dup_score * 0.4) + (format_score * 0.4) + (balance_score * 0.2))
    
    if final_score >= 90:
        grade = "A"
    elif final_score >= 80:
        grade = "B"
    elif final_score >= 70:
        grade = "C"
    elif final_score >= 60:
        grade = "D"
    else:
        grade = "F"
        
    return {
        "status": "ok",
        "report": {
            "total_rows": total_rows,
            "overall_score": final_score,
            "grade": grade,
            "duplicates": {
                "count": exact_duplicates,
                "percentage": round(dup_ratio * 100, 1),
                "score": round(dup_score)
            },
            "formatting": {
                "missing_fields": missing_fields,
                "percentage": round(format_ratio * 100, 1),
                "score": round(format_score)
            },
            "lengths": {
                "avg_instruction_words": avg_instr,
                "avg_response_words": avg_resp,
                "max_instruction_words": max_instr,
                "max_response_words": max_resp,
                "score": round(balance_score)
            },
            "recommendations": _generate_recommendations(dup_ratio, format_ratio, avg_resp, max_resp)
        }
    }

def _generate_recommendations(dup_ratio: float, format_ratio: float, avg_resp: int, max_resp: int) -> List[str]:
    recs = []
    if dup_ratio > 0.05:
        recs.append("High duplication detected. De-duplicate your dataset to prevent the model from overfitting on repeated samples.")
    if format_ratio > 0.01:
        recs.append("Some rows are missing instructions or responses. Filter out empty or malformed rows.")
    if avg_resp < 10:
        recs.append("Average response length is very short. This might result in a model that gives terse, unhelpful answers.")
    if max_resp > 2000:
        recs.append("Some responses are extremely long. Ensure they do not exceed the context window of your target model during training.")
        
    if not recs:
        recs.append("Dataset looks healthy! Proceed to fine-tuning.")
        
    return recs
