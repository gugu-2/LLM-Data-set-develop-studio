"""
Hypasia AI — Flywheel API Routes.
Ingest, status, queue, and trigger endpoints.
"""
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_queue = None

def _get_queue():
    global _queue
    if _queue is None:
        from hypasia.flywheel.queue import FlywheelQueue
        _queue = FlywheelQueue()
    return _queue


class IngestRequest(BaseModel):
    prompt: str
    response: str
    correction: Optional[str] = None
    source: str = "production"
    thumbs_up: Optional[bool] = None


class TriggerRequest(BaseModel):
    threshold: float = 7.0
    trigger_count: int = 50
    api_key: Optional[str] = None


@router.post("/ingest")
def ingest(req: IngestRequest):
    """Capture a production interaction into the flywheel queue."""
    try:
        from hypasia.flywheel.collector import FlywheelCollector
        collector = FlywheelCollector(auto_score=True)
        row = collector.capture(
            prompt=req.prompt,
            response=req.response,
            correction=req.correction,
            source=req.source,
            thumbs_up=req.thumbs_up,
        )
        return {
            "status": "captured",
            "score": row.score,
            "tier": row.tier,
            "queue_size": _get_queue().size(),
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
def status():
    """Return current flywheel queue stats."""
    q = _get_queue()
    return {
        "queue_depth": q.size(),
        "avg_score": q.avg_score(),
        "last_retrain": q.last_retrain_time() or "Never",
    }


@router.get("/queue")
def get_queue(limit: int = 50):
    """Return pending rows in the queue."""
    q = _get_queue()
    return {"rows": q.peek(limit=limit)}


@router.post("/trigger")
def trigger_retrain(req: TriggerRequest):
    """Manually trigger the retrain pipeline."""
    try:
        from hypasia.flywheel.trigger import check_and_trigger
        result = check_and_trigger(
            queue=_get_queue(),
            trigger_count=req.trigger_count,
            threshold=req.threshold,
            api_key=req.api_key,
        )
        return result
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
