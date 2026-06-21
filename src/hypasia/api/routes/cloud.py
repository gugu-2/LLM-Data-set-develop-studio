import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from hypasia.config import cfg
from fastapi.responses import StreamingResponse
import json

router = APIRouter()

class CloudDispatchRequest(BaseModel):
    provider: str # 'aws', 'gcp', 'azure'
    model_name: str
    dataset_path: str
    target_compute: str = "g5.2xlarge"

@router.post("/cloud/dispatch")
async def dispatch_to_cloud(req: CloudDispatchRequest):
    """
    Simulates connecting to the cloud provider using the configured IAM credentials
    and spinning up a GPU cluster to run the training job.
    """
    provider = req.provider.lower()
    
    # 1. Validate Credentials
    if provider == "aws":
        if not cfg.aws_access_key_id or not cfg.aws_secret_access_key:
            raise HTTPException(status_code=401, detail="Missing AWS IAM Credentials. Please configure them in Settings.")
    elif provider == "gcp":
        if not cfg.gcp_service_account:
            raise HTTPException(status_code=401, detail="Missing GCP Service Account JSON. Please configure it in Settings.")
    elif provider == "azure":
        if not cfg.azure_client_secret:
            raise HTTPException(status_code=401, detail="Missing Azure Client Secret. Please configure it in Settings.")
    else:
        raise HTTPException(status_code=400, detail="Invalid cloud provider.")

    # 2. Simulate Cloud Provisioning Stream
    async def event_stream():
        yield json.dumps({"status": "authenticating", "message": f"Authenticating with {provider.upper()} IAM..."}) + "\n"
        await asyncio.sleep(1.5)
        
        yield json.dumps({"status": "provisioning", "message": f"Requesting {req.target_compute} spot instance..."}) + "\n"
        await asyncio.sleep(2)
        
        yield json.dumps({"status": "uploading", "message": f"Uploading {req.dataset_path} to {provider.upper()} Storage Bucket..."}) + "\n"
        await asyncio.sleep(1.5)
        
        yield json.dumps({"status": "container", "message": f"Pulling Hypasia PyTorch Container..."}) + "\n"
        await asyncio.sleep(2)
        
        yield json.dumps({"status": "executing", "message": f"🚀 Launching Unsloth Training Job on {req.model_name}..."}) + "\n"
        await asyncio.sleep(1)
        
        yield json.dumps({"status": "success", "message": f"Job submitted! Telemetry will stream to dashboard automatically."}) + "\n"

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")
