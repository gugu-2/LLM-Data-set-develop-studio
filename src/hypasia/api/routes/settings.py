from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from hypasia.config import cfg

router = APIRouter()

class APIKeys(BaseModel):
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    gcp_service_account: Optional[str] = None
    azure_client_secret: Optional[str] = None

@router.get("/settings/keys")
def get_keys():
    """Returns whether keys are set (masks the actual key)."""
    return {
        "openai_api_key": "sk-..." if cfg.openai_api_key else "",
        "anthropic_api_key": "sk-ant-..." if cfg.anthropic_api_key else "",
        "groq_api_key": "gsk-..." if cfg.groq_api_key else "",
        "gemini_api_key": "AIzaSy..." if cfg.gemini_api_key else "",
        "aws_access_key_id": "AKIA..." if cfg.aws_access_key_id else "",
        "aws_secret_access_key": "********" if cfg.aws_secret_access_key else "",
        "gcp_service_account": "{...}" if cfg.gcp_service_account else "",
        "azure_client_secret": "********" if cfg.azure_client_secret else ""
    }

@router.post("/settings/keys")
def update_keys(keys: APIKeys):
    update_dict = {}
    if keys.openai_api_key and not keys.openai_api_key.startswith("sk-..."):
        update_dict["OPENAI_API_KEY"] = keys.openai_api_key
    if keys.anthropic_api_key and not keys.anthropic_api_key.startswith("sk-ant-..."):
        update_dict["ANTHROPIC_API_KEY"] = keys.anthropic_api_key
    if keys.groq_api_key and not keys.groq_api_key.startswith("gsk-..."):
        update_dict["GROQ_API_KEY"] = keys.groq_api_key
    if keys.gemini_api_key and not keys.gemini_api_key.startswith("AIzaSy..."):
        update_dict["GEMINI_API_KEY"] = keys.gemini_api_key
    if keys.aws_access_key_id and not keys.aws_access_key_id.startswith("AKIA..."):
        update_dict["AWS_ACCESS_KEY_ID"] = keys.aws_access_key_id
    if keys.aws_secret_access_key and not keys.aws_secret_access_key.startswith("********"):
        update_dict["AWS_SECRET_ACCESS_KEY"] = keys.aws_secret_access_key
    if keys.gcp_service_account and not keys.gcp_service_account.startswith("{...}"):
        update_dict["GCP_SERVICE_ACCOUNT_JSON"] = keys.gcp_service_account
    if keys.azure_client_secret and not keys.azure_client_secret.startswith("********"):
        update_dict["AZURE_CLIENT_SECRET"] = keys.azure_client_secret
        
    if update_dict:
        cfg.save_keys(update_dict)
        
    return {"status": "success", "updated": list(update_dict.keys())}
