"""
Hypasia AI — Configuration management.
Reads from .env file and environment variables.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load .env from project root (walk up from cwd)
_env_path = Path.cwd() / ".env"
if not _env_path.exists():
    _env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(_env_path, override=False)


class Config:
    """Central configuration — all settings in one place."""

    # ── API Keys ─────────────────────────────────────────────────────────
    @property
    def gemini_api_key(self) -> Optional[str]:
        return os.getenv("GEMINI_API_KEY")

    @property
    def openai_api_key(self) -> Optional[str]:
        return os.getenv("OPENAI_API_KEY")

    @property
    def anthropic_api_key(self) -> Optional[str]:
        return os.getenv("ANTHROPIC_API_KEY")

    @property
    def groq_api_key(self) -> Optional[str]:
        return os.getenv("GROQ_API_KEY")

    @property
    def huggingface_token(self) -> Optional[str]:
        return os.getenv("HUGGINGFACE_TOKEN")

    # ── Cloud Credentials ────────────────────────────────────────────────
    @property
    def aws_access_key_id(self) -> Optional[str]:
        return os.getenv("AWS_ACCESS_KEY_ID")

    @property
    def aws_secret_access_key(self) -> Optional[str]:
        return os.getenv("AWS_SECRET_ACCESS_KEY")

    @property
    def gcp_service_account(self) -> Optional[str]:
        return os.getenv("GCP_SERVICE_ACCOUNT_JSON")

    @property
    def azure_client_secret(self) -> Optional[str]:
        return os.getenv("AZURE_CLIENT_SECRET")

    def save_keys(self, keys: dict):
        """Saves keys to the .env file and updates os.environ."""
        import dotenv
        if not _env_path.exists():
            _env_path.touch()
            
        for k, v in keys.items():
            if v is not None:
                os.environ[k] = v
                dotenv.set_key(str(_env_path), k, v)


    # ── Scoring ───────────────────────────────────────────────────────────
    @property
    def judge(self) -> str:
        """Which LLM judge to use: gemini | heuristic | openai"""
        return os.getenv("HYPASIA_JUDGE", "gemini")

    @property
    def threshold(self) -> float:
        return float(os.getenv("HYPASIA_THRESHOLD", "7.0"))

    @property
    def language(self) -> str:
        return os.getenv("HYPASIA_LANGUAGE", "en")

    # ── Storage ───────────────────────────────────────────────────────────
    @property
    def output_dir(self) -> Path:
        p = Path(os.getenv("HYPASIA_OUTPUT_DIR", "./hypasia_output"))
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def models_dir(self) -> Path:
        p = Path(os.getenv("HYPASIA_MODELS_DIR", "./models"))
        p.mkdir(parents=True, exist_ok=True)
        return p

    # ── Logging ───────────────────────────────────────────────────────────
    @property
    def log_level(self) -> str:
        return os.getenv("HYPASIA_LOG_LEVEL", "INFO")

    # ── Validation ────────────────────────────────────────────────────────
    def validate_for_scoring(self) -> tuple[bool, str]:
        """Returns (ok, message)."""
        if self.judge == "gemini" and not self.gemini_api_key:
            return False, (
                "GEMINI_API_KEY not set. Run: hypasia config set-key GEMINI_API_KEY <your-key>\n"
                "Or use heuristic scoring: hypasia score input.jsonl --judge heuristic"
            )
        if self.judge == "openai" and not self.openai_api_key:
            return False, "OPENAI_API_KEY not set."
        return True, "OK"

    def validate_for_hf(self) -> tuple[bool, str]:
        if not self.huggingface_token:
            return False, (
                "HUGGINGFACE_TOKEN not set. Required for HF import/export.\n"
                "Get yours at https://huggingface.co/settings/tokens"
            )
        return True, "OK"

    def summary(self) -> dict:
        return {
            "judge": self.judge,
            "threshold": self.threshold,
            "language": self.language,
            "gemini_key": "✅ set" if self.gemini_api_key else "❌ missing",
            "hf_token": "✅ set" if self.huggingface_token else "❌ missing",
            "output_dir": str(self.output_dir),
        }


# Singleton
cfg = Config()
