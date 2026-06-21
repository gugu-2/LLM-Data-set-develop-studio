"""
Hypasia AI — AI Wizard Backend
Recommends model config and generates training scripts for non-technical users.
"""
from typing import Optional, List
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class WizardAnswers(BaseModel):
    goal: str           # "customer_support" | "code_helper" | "content_writer" | "qa_bot" | "medical" | "legal" | "custom"
    goal_description: str
    data_type: str      # "urls" | "files" | "marketplace" | "none"
    data_description: Optional[str] = ""
    budget_usd: float   # 10 | 50 | 200 | 500
    speed: str          # "today" | "this_week" | "no_rush"
    api_key: Optional[str] = None


class ScriptRequest(BaseModel):
    config: dict
    api_key: Optional[str] = None


# Model recommendations based on budget + speed
MODEL_TIERS = {
    "fast_cheap": {
        "model": "unsloth/Qwen2.5-0.5B-Instruct",
        "params": "0.5B",
        "quantization": "4-bit",
        "gpu": "T4 (16GB)",
        "vram_gb": 6,
        "est_time_hrs": 0.5,
        "est_cost_usd": 0.20,
        "quality": "Good for simple tasks",
    },
    "balanced": {
        "model": "unsloth/Llama-3.2-3B-Instruct",
        "params": "3B",
        "quantization": "4-bit",
        "gpu": "T4 (16GB)",
        "vram_gb": 8,
        "est_time_hrs": 1.5,
        "est_cost_usd": 1.50,
        "quality": "Great balance of speed and quality",
    },
    "quality": {
        "model": "unsloth/Meta-Llama-3.1-8B-Instruct",
        "params": "8B",
        "quantization": "4-bit",
        "gpu": "A100 (40GB)",
        "vram_gb": 14,
        "est_time_hrs": 3.0,
        "est_cost_usd": 7.30,
        "quality": "High quality, recommended for production",
    },
    "premium": {
        "model": "unsloth/Mistral-Small-Instruct-2409",
        "params": "22B",
        "quantization": "4-bit",
        "gpu": "A100 (80GB)",
        "vram_gb": 24,
        "est_time_hrs": 8.0,
        "est_cost_usd": 19.00,
        "quality": "Premium quality for enterprise use",
    },
}

GOAL_SYSTEM_PROMPTS = {
    "customer_support": "You are a helpful customer support assistant. Answer customer questions accurately, empathetically, and concisely. If you don't know the answer, say so and offer to escalate.",
    "code_helper": "You are an expert coding assistant. Provide clean, well-commented code with explanations. Debug issues step-by-step and suggest best practices.",
    "content_writer": "You are a creative content writer. Produce engaging, original content tailored to the user's brand voice and audience. Always maintain quality and clarity.",
    "qa_bot": "You are a precise question-answering assistant. Answer questions directly and factually based on the provided context. Cite your sources when possible.",
    "medical": "You are a medical information assistant. Provide accurate, evidence-based medical information while always recommending users consult qualified healthcare professionals.",
    "legal": "You are a legal information assistant. Explain legal concepts clearly while reminding users to consult qualified legal professionals for specific advice.",
    "custom": "You are a helpful AI assistant. Be accurate, concise, and helpful in all your responses.",
}


@router.post("/wizard/recommend")
def wizard_recommend(answers: WizardAnswers):
    """Returns the best model config based on user answers."""

    # Pick tier based on budget
    if answers.budget_usd <= 15:
        if answers.speed == "today":
            tier_key = "fast_cheap"
        else:
            tier_key = "balanced"
    elif answers.budget_usd <= 60:
        tier_key = "balanced" if answers.speed == "today" else "quality"
    elif answers.budget_usd <= 210:
        tier_key = "quality"
    else:
        tier_key = "premium"

    # Override for speed
    if answers.speed == "today" and tier_key == "quality":
        tier_key = "balanced"

    tier = MODEL_TIERS[tier_key]
    system_prompt = GOAL_SYSTEM_PROMPTS.get(answers.goal, GOAL_SYSTEM_PROMPTS["custom"])

    return {
        "status": "ok",
        "tier": tier_key,
        "config": {
            **tier,
            "system_prompt": system_prompt,
            "goal": answers.goal,
            "lora_rank": 16,
            "batch_size": 2,
            "epochs": 3,
            "learning_rate": 2e-4,
            "max_seq_length": 2048,
        },
        "alternatives": [MODEL_TIERS[k] for k in MODEL_TIERS if k != tier_key],
    }


@router.post("/wizard/generate-script")
def generate_script(req: ScriptRequest):
    """Generates a complete Unsloth fine-tuning Python script."""
    c = req.config
    model = c.get("model", "unsloth/Llama-3.2-3B-Instruct")
    quant = c.get("quantization", "4-bit")
    lora_rank = c.get("lora_rank", 16)
    batch_size = c.get("batch_size", 2)
    epochs = c.get("epochs", 3)
    lr = c.get("learning_rate", 2e-4)
    max_seq = c.get("max_seq_length", 2048)
    system_prompt = c.get("system_prompt", "You are a helpful assistant.")

    load_in_4bit = "True" if "4-bit" in quant else "False"

    script = f'''#!/usr/bin/env python3
"""
Auto-generated by Hypasia AI Wizard
Model: {model}
Generated: Fine-tuning script ready to run on Google Colab or local GPU
"""

# ─── 1. Install Dependencies ─────────────────────────────────────────────────
# Run this in your terminal or Colab cell:
# !pip install unsloth transformers datasets trl

# ─── 2. Imports ───────────────────────────────────────────────────────────────
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset
import torch

# ─── 3. Model Configuration ───────────────────────────────────────────────────
MODEL_NAME = "{model}"
MAX_SEQ_LENGTH = {max_seq}
LOAD_IN_4BIT = {load_in_4bit}

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=None,               # Auto-detect (float16 on GPU, bfloat16 on Ampere+)
    load_in_4bit=LOAD_IN_4BIT,
)

# ─── 4. LoRA Adapters ─────────────────────────────────────────────────────────
model = FastLanguageModel.get_peft_model(
    model,
    r={lora_rank},
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_alpha={lora_rank * 2},
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)

# ─── 5. Dataset ───────────────────────────────────────────────────────────────
# Replace with your JSONL file path exported from Hypasia
DATASET_PATH = "hypasia_dataset.jsonl"

SYSTEM_PROMPT = """{system_prompt}"""

def format_row(row):
    return tokenizer.apply_chat_template(
        [
            {{"role": "system",  "content": SYSTEM_PROMPT}},
            {{"role": "user",    "content": row.get("instruction", row.get("input", ""))}},
            {{"role": "assistant", "content": row.get("response", row.get("output", ""))}},
        ],
        tokenize=False,
        add_generation_prompt=False,
    )

dataset = load_dataset("json", data_files=DATASET_PATH, split="train")
dataset = dataset.map(lambda x: {{"text": format_row(x)}})

# ─── 6. Training ──────────────────────────────────────────────────────────────
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=MAX_SEQ_LENGTH,
    args=TrainingArguments(
        per_device_train_batch_size={batch_size},
        gradient_accumulation_steps=4,
        num_train_epochs={epochs},
        learning_rate={lr},
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        output_dir="hypasia_output",
        save_strategy="epoch",
        report_to="none",
    ),
)

print("🚀 Starting fine-tuning with Hypasia AI...")
trainer.train()
print("✅ Training complete!")

# ─── 7. Save & Export ─────────────────────────────────────────────────────────
model.save_pretrained("hypasia_lora_model")
tokenizer.save_pretrained("hypasia_lora_model")
print("💾 Model saved to hypasia_lora_model/")

# Optional: Merge and save full model
# model.save_pretrained_merged("hypasia_merged", tokenizer, save_method="merged_16bit")

# Optional: Push to HuggingFace Hub
# model.push_to_hub("your-username/hypasia-model", token="hf_...")
# tokenizer.push_to_hub("your-username/hypasia-model", token="hf_...")

print("🎉 Done! Your model is ready.")
'''

    # Return as streaming download
    return StreamingResponse(
        iter([script]),
        media_type="text/plain",
        headers={"Content-Disposition": "attachment; filename=hypasia_training.py"},
    )
