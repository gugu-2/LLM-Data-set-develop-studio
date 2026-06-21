"""
Hypasia AI — Webhooks & Integrations
Sends structured payloads to Slack or Discord webhooks for team notifications.
"""
import httpx
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class WebhookConfig(BaseModel):
    url: str
    events: List[str]
    channel: str = "slack" # "slack" or "discord"

# In-memory storage for demo purposes
WEBHOOKS = []

@router.get("/webhooks/list")
def list_webhooks():
    return {"webhooks": WEBHOOKS}

@router.post("/webhooks/add")
def add_webhook(config: WebhookConfig):
    if not config.url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid webhook URL")
    WEBHOOKS.append(config.dict())
    return {"status": "ok", "message": "Webhook added successfully"}

@router.post("/webhooks/delete")
def delete_webhook(url: str):
    global WEBHOOKS
    WEBHOOKS = [w for w in WEBHOOKS if w["url"] != url]
    return {"status": "ok"}

class TestPayload(BaseModel):
    url: str
    channel: str

@router.post("/webhooks/test")
async def test_webhook(payload: TestPayload):
    """Fires a test message to the specified webhook."""
    
    if payload.channel == "slack":
        body = {
            "text": "🚀 *Hypasia AI Test Alert*\nThis is a test notification from your Hypasia Studio."
        }
    else: # discord
        body = {
            "content": "**Hypasia AI Test Alert** 🚀\nThis is a test notification from your Hypasia Studio."
        }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(payload.url, json=body, timeout=5.0)
            if resp.status_code >= 400:
                raise HTTPException(status_code=400, detail=f"Target returned error: {resp.text}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    return {"status": "ok", "message": "Test notification sent!"}

async def dispatch_event(event_type: str, message: str):
    """
    Internal function used by other routes to trigger notifications.
    E.g. `await dispatch_event("training_complete", "Llama-3 fine-tune finished in 2h40m")`
    """
    import asyncio
    matching = [w for w in WEBHOOKS if event_type in w["events"]]
    if not matching:
        return

    async def _post(client, w):
        try:
            body = {"text": message} if w["channel"] == "slack" else {"content": message}
            await client.post(w["url"], json=body, timeout=5.0)
        except Exception:
            pass

    async with httpx.AsyncClient() as client:
        await asyncio.gather(*[_post(client, w) for w in matching])
