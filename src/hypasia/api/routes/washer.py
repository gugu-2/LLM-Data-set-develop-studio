"""
Hypasia AI — IP Washer Routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import asyncio

router = APIRouter()

class WashRequest(BaseModel):
    rows: List[Dict]

@router.post("/washer/scrub")
async def scrub_dataset(req: WashRequest):
    """
    Scans a dataset for copyrighted text and cryptographically rewrites it.
    """
    try:
        if not req.rows:
            raise HTTPException(status_code=400, detail="Empty dataset")
            
        # Simulate processing time
        await asyncio.sleep(1)

        from hypasia.cleaner.ip_washer import scan_and_wash
        result = scan_and_wash(req.rows)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
