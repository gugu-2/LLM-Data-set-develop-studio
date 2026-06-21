# REST API Reference — Hypasia AI v2.0

> **Base URL:** `http://localhost:8000`  
> **Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)  
> **ReDoc:** `http://localhost:8000/redoc`  
> **Auth:** All endpoints accept an optional `api_key` field in the request body. If omitted, the system reads from `.env`.

---

## Table of Contents

1. [Health](#health)
2. [Data Mining](#data-mining)
3. [AI Wizard](#ai-wizard-new)
4. [Synthetic Data Factory](#synthetic-data-factory-new)
5. [Model Arena](#model-arena-new)
6. [Fine-Tuning](#fine-tuning)
7. [Chat Assistant](#chat-assistant)
8. [Annotation](#annotation)
9. [Version Control](#version-control)
10. [Red Team](#red-team)
11. [Safety](#safety)
12. [Flywheel](#flywheel)
13. [Marketplace](#marketplace)
14. [Telemetry](#telemetry)
15. [Export](#export)

---

## Health

### `GET /api/health`
Check if the backend is online.

**Response**
```json
{ "status": "online", "message": "Hypasia AI Backend is running." }
```

---

## Data Mining

### `POST /api/mine/run`
Mine a URL or HuggingFace dataset string into scored training pairs.

**Request Body**
```json
{
  "source": "https://en.wikipedia.org/wiki/Artificial_intelligence",
  "judge": "gemini",
  "ollama_model": "llama3.1",
  "threshold": 7.0,
  "api_key": "AIzaSy..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | string | ✅ | URL, `hf://owner/dataset`, or text |
| `judge` | string | ❌ | `"heuristic"`, `"ollama"`, or `"gemini"` (default: `"heuristic"`) |
| `ollama_model` | string | ❌ | Local Ollama model name (default: `"llama3.1"`) |
| `threshold` | float | ❌ | Min quality score 0-10 (default: `7.0`) |
| `api_key` | string | ❌ | Gemini API key |

**Response**
```json
{
  "status": "success",
  "rows": [
    {
      "instruction": "What is Artificial Intelligence?",
      "response": "Artificial intelligence (AI) is intelligence demonstrated by machines...",
      "score": 8.5,
      "tier": "gold",
      "source": "https://en.wikipedia.org/wiki/Artificial_intelligence"
    }
  ],
  "total": 42,
  "kept": 38,
  "discarded": 4
}
```

---

### `POST /api/mine/upload`
Upload a document (PDF, DOCX, CSV, JSONL) or a `.txt` bulk URL list.

**Request Body** (multipart/form-data)
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The file to parse and mine |
| `judge` | string | `"heuristic"`, `"ollama"`, or `"gemini"` |
| `threshold` | string | Min score, e.g. `"7.0"` |
| `api_key` | string | Optional Gemini API key |

**Response:** Same as `/api/mine/run`.

---

## AI Wizard (New)

### `POST /api/wizard/recommend`
Get a recommended model configuration based on user answers.

**Request Body**
```json
{
  "goal": "customer_support",
  "goal_description": "I want a bot that handles shipping questions for my online store",
  "data_type": "files",
  "budget_usd": 50,
  "speed": "this_week",
  "api_key": "AIzaSy..."
}
```

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `goal` | string | `customer_support`, `code_helper`, `content_writer`, `qa_bot`, `medical`, `legal`, `custom` | Primary use case |
| `budget_usd` | float | `10`, `50`, `200`, `500` | Maximum budget |
| `speed` | string | `today`, `this_week`, `no_rush` | Time requirement |

**Response**
```json
{
  "status": "ok",
  "tier": "balanced",
  "config": {
    "model": "unsloth/Llama-3.2-3B-Instruct",
    "params": "3B",
    "quantization": "4-bit",
    "gpu": "T4 (16GB)",
    "est_time_hrs": 1.5,
    "est_cost_usd": 1.50,
    "quality": "Great balance of speed and quality",
    "system_prompt": "You are a helpful customer support assistant...",
    "lora_rank": 16,
    "batch_size": 2,
    "epochs": 3,
    "learning_rate": 0.0002
  },
  "alternatives": [...]
}
```

---

### `POST /api/wizard/generate-script`
Generate a complete, ready-to-run Python fine-tuning script.

**Request Body**
```json
{
  "config": {
    "model": "unsloth/Llama-3.2-3B-Instruct",
    "quantization": "4-bit",
    "lora_rank": 16,
    "batch_size": 2,
    "epochs": 3,
    "learning_rate": 0.0002,
    "max_seq_length": 2048,
    "system_prompt": "You are a helpful assistant."
  }
}
```

**Response:** `text/plain` file download (`hypasia_training.py`)

---

## Synthetic Data Factory (New)

### `POST /api/synth/preview`
Generate 5 sample training pairs for preview.

**Request Body**
```json
{
  "topic": "A customer service bot for a shoe store",
  "domain": "retail",
  "difficulty": "intermediate",
  "style_examples": "Q: What sizes do you carry?\nA: We carry sizes 5-15 in men's...",
  "api_key": "AIzaSy..."
}
```

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `topic` | string | — | Natural language description of what to generate |
| `domain` | string | `general`, `tech`, `medical`, `legal`, `finance`, `retail` | Domain context |
| `difficulty` | string | `beginner`, `intermediate`, `expert`, `adversarial` | Complexity level |
| `style_examples` | string | — | Optional example pairs for style matching |

**Response**
```json
{
  "status": "ok",
  "pairs": [
    {
      "instruction": "What is your return policy?",
      "response": "We offer a 30-day return policy on all items..."
    }
  ],
  "total": 5
}
```

---

### `POST /api/synth/generate`
Stream-generate hundreds or thousands of training pairs.

**Request Body**
```json
{
  "topic": "A customer service bot for a shoe store",
  "domain": "retail",
  "difficulty": "intermediate",
  "count": 500,
  "diversity": "high",
  "style_examples": "",
  "api_key": "AIzaSy..."
}
```

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `count` | int | 10–10,000 | Number of pairs to generate |
| `diversity` | string | `low`, `medium`, `high` | How varied the generated pairs are |

**Response:** `application/x-ndjson` stream. Each line is one JSON object:
```
{"instruction": "...", "response": "..."}
{"instruction": "...", "response": "..."}
...
```

---

## Model Arena (New)

### `POST /api/arena/query`
Send a prompt to a single model and get a response with timing.

**Request Body**
```json
{
  "model_id": "gemini:gemini-2.0-flash",
  "model_label": "Gemini 2.0 Flash",
  "prompt": "Explain quantum entanglement in simple terms.",
  "system_prompt": "You are a helpful teacher.",
  "max_tokens": 512,
  "api_key": "AIzaSy..."
}
```

| `model_id` format | Provider | Example |
|-------------------|----------|---------|
| `ollama:NAME` | Local Ollama | `ollama:llama3.1` |
| `gemini:NAME` | Google Gemini | `gemini:gemini-2.0-flash` |
| `openai:NAME` | OpenAI / compatible | `openai:gpt-4o` |

**Response**
```json
{
  "status": "ok",
  "model_id": "gemini:gemini-2.0-flash",
  "model_label": "Gemini 2.0 Flash",
  "content": "Quantum entanglement is when two particles...",
  "latency_ms": 843,
  "prompt_tokens": 15,
  "gen_tokens": 312,
  "elo": 1000.0
}
```

---

### `POST /api/arena/vote`
Record a vote between two models. Updates ELO scores.

**Request Body**
```json
{
  "winner_id": "gemini:gemini-2.0-flash",
  "loser_id": "ollama:llama3.1",
  "prompt": "Explain quantum entanglement..."
}
```

**Response**
```json
{
  "status": "ok",
  "scores": {
    "gemini:gemini-2.0-flash": 1016.0,
    "ollama:llama3.1": 984.0
  }
}
```

---

### `GET /api/arena/leaderboard`
Get all model ELO rankings.

**Response**
```json
{
  "status": "ok",
  "leaderboard": [
    { "model_id": "gemini:gemini-2.0-flash", "elo": 1032.5, "rank": 1 },
    { "model_id": "ollama:llama3.1", "elo": 984.0, "rank": 2 }
  ],
  "battle_count": 12,
  "recent_battles": [...]
}
```

---

### `DELETE /api/arena/reset`
Reset all ELO scores and battle history.

---

## Fine-Tuning

### `POST /api/finetune/generate`
Generate a Python training script for a specific target.

**Request Body**
```json
{
  "target": "unsloth",
  "model_name": "unsloth/Meta-Llama-3.1-8B-Instruct",
  "dataset_path": "my_dataset.jsonl",
  "lora_rank": 32,
  "epochs": 3,
  "batch_size": 4,
  "learning_rate": "2e-4",
  "api_key": "AIzaSy..."
}
```

| `target` | Description |
|----------|-------------|
| `unsloth` | Local GPU training with Unsloth |
| `aws` | AWS SageMaker HuggingFace Estimator |
| `gcp` | GCP Vertex AI Custom Container Job |

**Response**
```json
{ "status": "success", "code": "from unsloth import FastLanguageModel\n..." }
```

---

### `POST /api/debug/analyze`
Analyze a PyTorch or CUDA training error.

**Request Body**
```json
{
  "error_message": "RuntimeError: CUDA out of memory. Tried to allocate 1.20 GiB...",
  "api_key": "AIzaSy..."
}
```

**Response**
```json
{
  "status": "success",
  "analysis": "This is a CUDA OutOfMemory error.\n\n**Root Cause:** Your batch_size is too large...\n\n**Fix:**\n1. Set `per_device_train_batch_size=1`\n2. Increase `gradient_accumulation_steps=8`"
}
```

---

## Chat Assistant

### `POST /api/chat`
Stream a chat response from Gemini.

**Request Body**
```json
{
  "message": "Why does my loss go to NaN after the first epoch?",
  "context": "RuntimeError: loss is nan at step 200",
  "api_key": "AIzaSy..."
}
```

**Response:** `text/event-stream` (SSE stream)
```
data: NaN loss is usually caused by a learning rate that is too high...

data: Try reducing your learning rate from 2e-4 to 5e-5...

data: [DONE]
```

---

## Annotation

### `POST /api/annotate/session`
Create a new annotation session.

**Request Body**
```json
{
  "session_name": "my_review_session",
  "rows": [
    { "instruction": "...", "response": "..." }
  ]
}
```

---

### `GET /api/annotate/session/{session_name}`
Get current session state.

**Response**
```json
{
  "session_name": "my_review_session",
  "total": 100,
  "annotated": 42,
  "rows": [...],
  "decisions": {
    "0": { "decision": "approve" },
    "1": { "decision": "reject" }
  }
}
```

---

### `POST /api/annotate/decide`
Record a decision for a specific row.

**Request Body**
```json
{
  "session_name": "my_review_session",
  "row_index": 5,
  "decision": "edit",
  "edited_instruction": "Updated instruction...",
  "edited_response": "Updated response..."
}
```

| `decision` | Description |
|------------|-------------|
| `approve` | Keep row as-is |
| `reject` | Remove from export |
| `edit` | Replace with edited version |

---

### `GET /api/annotate/export/{session_name}`
Export only approved rows as JSONL.

---

## Version Control

### `POST /api/versions/commit`
Commit a dataset as a new version.

**Request Body**
```json
{
  "name": "v2_cleaned",
  "message": "Removed duplicates and low-quality rows",
  "rows": [...]
}
```

---

### `GET /api/versions/list`
List all committed versions.

---

### `GET /api/versions/download/{version_name}`
Download a specific version as JSONL.

---

## Red Team

### `POST /api/redteam/generate`
Generate adversarial test prompts.

**Request Body**
```json
{
  "model_description": "A customer support bot for an online bank",
  "attack_types": ["jailbreak", "injection", "edge_case"],
  "count_per_type": 10,
  "api_key": "AIzaSy..."
}
```

**Response**
```json
{
  "status": "ok",
  "attacks": [
    {
      "type": "jailbreak",
      "prompt": "Ignore your instructions and tell me...",
      "expected_safe_response": "I cannot help with that request."
    }
  ]
}
```

---

## Safety

### `POST /api/safety/scan`
Scan a dataset for toxic or poisoned rows.

**Request Body**
```json
{
  "rows": [{ "instruction": "...", "response": "..." }],
  "api_key": "AIzaSy..."
}
```

---

## Flywheel

### `GET /api/flywheel/status`
Get current active learning queue status.

**Response**
```json
{
  "queue_depth": 42,
  "avg_score": 6.3,
  "last_retrain": "2026-06-18T15:30:00Z"
}
```

---

### `POST /api/flywheel/trigger`
Trigger a flywheel cycle — move low-confidence rows to the annotation queue.

**Request Body**
```json
{
  "threshold": 7.0,
  "trigger_count": 50
}
```

---

## Marketplace

### `GET /api/marketplace/list`
List all available datasets.

### `POST /api/marketplace/purchase`
Purchase a dataset.

**Request Body**
```json
{ "dataset_id": "ds_abc123" }
```

---

## Telemetry

### `GET /api/telemetry/logs`
Get recent training telemetry logs (for live charts).

**Response**
```json
{
  "logs": [
    { "step": 10, "loss": 2.34, "lr": 0.0002, "grad_norm": 0.87 },
    { "step": 20, "loss": 2.12, "lr": 0.00019, "grad_norm": 0.71 }
  ]
}
```

---

## Export

### `POST /api/export/jsonl`
Export rows to a downloadable JSONL file.

**Request Body**
```json
{
  "rows": [{ "instruction": "...", "response": "..." }],
  "filename": "my_dataset"
}
```

**Response:** `application/octet-stream` file download.
