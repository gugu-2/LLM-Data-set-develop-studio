"""
Hypasia AI — VLAM Spatio-Temporal Miner
Real DOM Action Extraction using Playwright.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncio
import datetime
import base64

router = APIRouter()

class VLAMRequest(BaseModel):
    url: str

@router.post("/vlam/record")
async def record_session(req: VLAMRequest):
    """
    Uses headless Chromium to navigate to the URL, take a screenshot,
    and extract real actionable elements (buttons, inputs) to create
    a Vision-Language Action dataset.
    """
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        raise HTTPException(
            status_code=500, 
            detail="Playwright not installed. Run: pip install playwright && playwright install chromium"
        )
        
    dataset = []
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Navigate to the URL
            await page.goto(req.url, wait_until="networkidle", timeout=15000)
            
            # Take Base64 Screenshot
            screenshot_bytes = await page.screenshot()
            b64_image = "data:image/png;base64," + base64.b64encode(screenshot_bytes).decode('utf-8')
            
            # Extract Buttons
            buttons = await page.query_selector_all("button")
            for i, btn in enumerate(buttons[:3]): # Limit to 3 for demo
                box = await btn.bounding_box()
                if box:
                    text = await btn.inner_text()
                    html = await btn.evaluate("el => el.outerHTML")
                    dataset.append({
                        "id": f"vlam-btn-{i}",
                        "instruction": f"Click the '{text.strip()}' button.",
                        "image_url": b64_image,
                        "action_type": "click",
                        "coordinates": {"x": int(box["x"] + box["width"]/2), "y": int(box["y"] + box["height"]/2)},
                        "dom_element": html,
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                    })

            # Extract Inputs
            inputs = await page.query_selector_all("input")
            for i, inp in enumerate(inputs[:2]): # Limit to 2 for demo
                box = await inp.bounding_box()
                if box:
                    html = await inp.evaluate("el => el.outerHTML")
                    name = await inp.get_attribute("name") or await inp.get_attribute("type") or "input"
                    dataset.append({
                        "id": f"vlam-inp-{i}",
                        "instruction": f"Type a value into the '{name}' field.",
                        "image_url": b64_image,
                        "action_type": "type",
                        "coordinates": {"x": int(box["x"] + box["width"]/2), "y": int(box["y"] + box["height"]/2)},
                        "dom_element": html,
                        "typed_value": "[MOCK_USER_INPUT]",
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                    })
                    
            await browser.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"status": "success", "url": req.url, "dataset": dataset}
