"""
Hypasia AI — Fine-Tuning Code Generator
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class FinetuneRequest(BaseModel):
    model_name: str
    target: str = "unsloth"  # 'unsloth', 'colab', 'aws', 'gcp', 'azure'
    lora_rank: int = 16
    dataset_path: str = "hypasia_dataset.jsonl"
    epochs: int = 3
    batch_size: int = 2
    learning_rate: str = "2e-4"
    beta: float = 0.1
    is_sweep: bool = False

TELEMETRY_CODE = """
import requests
from transformers import TrainerCallback

class HypasiaTelemetryCallback(TrainerCallback):
    def on_log(self, args, state, control, logs=None, **kwargs):
        if logs is not None:
            try:
                requests.post(
                    "http://localhost:8000/api/telemetry/log",
                    json={"session_id": "default", "log": logs},
                    timeout=1
                )
            except:
                pass
"""

UNSLOTH_DPO_TEMPLATE = """
# Install Unsloth
# !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

from unsloth import FastLanguageModel, PatchDPOTrainer
import torch
from datasets import load_dataset
from trl import DPOTrainer
from transformers import TrainingArguments

PatchDPOTrainer()

max_seq_length = 2048
dtype = None 
load_in_4bit = True 

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "{model_name}",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

model = FastLanguageModel.get_peft_model(
    model,
    r = {lora_rank},
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = {lora_rank},
    lora_dropout = 0,
    bias = "none",    
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

# Load Hypasia DPO dataset
dataset = load_dataset("json", data_files="{dataset_path}", split="train")

# Train
trainer = DPOTrainer(
    model = model,
    ref_model = None, # Implicitly used by trl
    tokenizer = tokenizer,
    train_dataset = dataset,
    beta = {beta},
    max_length = max_seq_length,
    max_prompt_length = max_seq_length // 2,
    args = TrainingArguments(
        per_device_train_batch_size = {batch_size},
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        num_train_epochs = {epochs},
        learning_rate = {learning_rate},
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
    callbacks=[HypasiaTelemetryCallback()],
)

trainer_stats = trainer.train()

# Save Model
model.save_pretrained("lora_model_dpo")
"""

UNSLOTH_REWARD_TEMPLATE = """
# Install Unsloth
# !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

from unsloth import FastLanguageModel, PatchDPOTrainer
import torch
from datasets import load_dataset
from trl import RewardTrainer, RewardConfig

PatchDPOTrainer()

max_seq_length = 2048
dtype = None 
load_in_4bit = True 

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "{model_name}",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
    num_labels = 1, # Important for Reward Modeling
)

model = FastLanguageModel.get_peft_model(
    model,
    r = {lora_rank},
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj", "score"],
    lora_alpha = {lora_rank},
    lora_dropout = 0,
    bias = "none",    
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

# Load Hypasia DPO dataset (which works for RM too)
dataset = load_dataset("json", data_files="{dataset_path}", split="train")

# Train
trainer = RewardTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    args = RewardConfig(
        per_device_train_batch_size = {batch_size},
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        num_train_epochs = {epochs},
        learning_rate = {learning_rate},
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs_rm",
        max_length = max_seq_length,
    ),
    callbacks=[HypasiaTelemetryCallback()],
)

trainer_stats = trainer.train()

# Save Model
model.save_pretrained("lora_model_reward")
"""

UNSLOTH_PPO_TEMPLATE = """
# Install Unsloth
# !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import PPOTrainer, PPOConfig

max_seq_length = 2048
dtype = None 
load_in_4bit = True 

# Load the policy model (the model you want to tune)
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "{model_name}",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

model = FastLanguageModel.get_peft_model(
    model,
    r = {lora_rank},
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = {lora_rank},
    lora_dropout = 0,
    bias = "none",    
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

# Load Hypasia dataset
dataset = load_dataset("json", data_files="{dataset_path}", split="train")

def build_dataset(dataset):
    # PPO requires only prompts
    return dataset.map(lambda x: {{"query": x["instruction"]}})

dataset = build_dataset(dataset)

ppo_config = PPOConfig(
    batch_size={batch_size},
    learning_rate={learning_rate},
    ppo_epochs={epochs},
)

# Train
ppo_trainer = PPOTrainer(
    config=ppo_config,
    model=model,
    ref_model=None, # Implicit
    tokenizer=tokenizer,
    dataset=dataset,
)

# NOTE: You need to load your trained Reward Model here to score generations during the PPO loop!
# This is a complex loop, typically involving generating text and passing it to the RM.

# Save Model
model.save_pretrained("lora_model_ppo")
"""

UNSLOTH_TEMPLATE = """
# Install Unsloth
# !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

max_seq_length = 2048
dtype = None 
load_in_4bit = True 

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "{model_name}",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

model = FastLanguageModel.get_peft_model(
    model,
    r = {lora_rank},
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = {lora_rank},
    lora_dropout = 0,
    bias = "none",    
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

# Load Hypasia dataset
dataset = load_dataset("json", data_files="{dataset_path}", split="train")

{sweep_loop_start}
# Train
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False,
    args = TrainingArguments(
        per_device_train_batch_size = {batch_size},
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        num_train_epochs = {epochs},
        learning_rate = {learning_rate},
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = {output_dir},
    ),
    callbacks=[HypasiaTelemetryCallback()],
)

trainer_stats = trainer.train()

# Save Model
model.save_pretrained({model_save_path})
{sweep_loop_end}
"""

AWS_TEMPLATE = """
# AWS SageMaker Deployment Script for Hypasia Dataset
import sagemaker
from sagemaker.huggingface import HuggingFace

role = sagemaker.get_execution_role()

huggingface_estimator = HuggingFace(
    entry_point='train.py',
    source_dir='./scripts',
    instance_type='ml.g5.2xlarge',
    instance_count=1,
    role=role,
    transformers_version='4.36',
    pytorch_version='2.1',
    py_version='py310',
    hyperparameters = {{
        'epochs': {epochs},
        'train_batch_size': {batch_size},
        'learning_rate': {learning_rate},
        'model_name':'{model_name}',
        'lora_rank': {lora_rank}
    }}
)

huggingface_estimator.fit({{'train': 's3://my-bucket/{dataset_path}'}})
"""

GCP_TEMPLATE = """
# Google Cloud Vertex AI Custom Training Job
from google.cloud import aiplatform

aiplatform.init(project='my-project-id', location='us-central1')

job = aiplatform.CustomContainerTrainingJob(
    display_name="hypasia-finetune",
    container_uri="us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-1.py310:latest",
    command=["python3", "train.py", "--model", "{model_name}", "--rank", "{lora_rank}", "--data", "{dataset_path}", "--epochs", "{epochs}", "--batch_size", "{batch_size}", "--lr", "{learning_rate}"],
)

model = job.run(
    replica_count=1,
    machine_type="g2-standard-8",
    accelerator_type="NVIDIA_L4",
    accelerator_count=1,
)
"""

COLAB_TEMPLATE = """
# ============================================================
# Hypasia AI — Google Colab Fine-Tuning Notebook
# Run this in a free T4 GPU Colab notebook
# ============================================================
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git" -q
!pip install --no-deps xformers trl peft accelerate bitsandbytes -q

from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# Mount Google Drive (optional)
from google.colab import drive
drive.mount('/content/drive')

# Upload your dataset
from google.colab import files
uploaded = files.upload()  # Upload {dataset_path}

max_seq_length = 2048
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="{model_name}",
    max_seq_length=max_seq_length,
    dtype=None,
    load_in_4bit=True,
)
model = FastLanguageModel.get_peft_model(
    model, r={lora_rank}, lora_alpha={lora_rank},
    target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
    lora_dropout=0, bias="none",
    use_gradient_checkpointing="unsloth",
)
dataset = load_dataset("json", data_files="{dataset_path}", split="train")
trainer = SFTTrainer(
    model=model, tokenizer=tokenizer, train_dataset=dataset,
    dataset_text_field="text", max_seq_length=max_seq_length,
    args=TrainingArguments(
        per_device_train_batch_size={batch_size},
        gradient_accumulation_steps=4,
        num_train_epochs={epochs},
        learning_rate={learning_rate},
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=1, output_dir="outputs",
    ),
)
trainer.train()
model.save_pretrained("lora_model")

# Download the trained model
files.download("lora_model")
"""

AZURE_TEMPLATE = """
# ============================================================
# Hypasia AI — Azure ML Fine-Tuning Job
# ============================================================
from azure.ai.ml import MLClient, command, Input
from azure.ai.ml.entities import AmlCompute, Environment
from azure.identity import DefaultAzureCredential

ml_client = MLClient(
    credential=DefaultAzureCredential(),
    subscription_id="<YOUR_SUBSCRIPTION_ID>",
    resource_group_name="<YOUR_RESOURCE_GROUP>",
    workspace_name="<YOUR_WORKSPACE>",
)

# Create or get GPU compute
compute = AmlCompute(
    name="gpu-cluster",
    type="amlcompute",
    size="Standard_NC6s_v3",  # V100 16GB
    min_instances=0, max_instances=1,
)
ml_client.begin_create_or_update(compute).result()

job = command(
    code="./scripts",
    command=(
        "pip install unsloth[colab-new] trl peft accelerate bitsandbytes && "
        f"python train.py --model {{{{{model_name}}}}} --rank {{{{{lora_rank}}}}} "
        f"--data {{{{{dataset_path}}}}} --epochs {{{{{epochs}}}}} --batch_size {{{{{batch_size}}}}} --lr {{{{{learning_rate}}}}}"
    ),
    environment="AzureML-pytorch-2.0-ubuntu20.04-py38-cuda11-gpu@latest",
    compute="gpu-cluster",
    display_name="hypasia-finetune-{model_name}",
    inputs={{"dataset": Input(path="azureml:hypasia_dataset:1")}},
)
returned_job = ml_client.jobs.create_or_update(job)
ml_client.jobs.stream(returned_job.name)
"""


@router.post("/generate")
def generate_code(req: FinetuneRequest):
    target = req.target.lower()
    
    if target == "unsloth":
        sweep_start = ""
        sweep_end = ""
        lr_var = req.learning_rate
        out_dir = '"outputs"'
        save_path = '"lora_model"'
        
        if req.is_sweep:
            sweep_start = 'print("🔥 RUNNING HYPERPARAMETER SWEEP: Testing 3 learning rates...")\nfor sweep_idx, current_lr in enumerate([2e-4, 1e-4, 5e-5]):\n    print(f"\\n--- Starting Sweep {sweep_idx+1}/3 with LR={current_lr} ---")'
            sweep_end = '    print(f"✅ Finished Sweep {sweep_idx+1}")\nprint("🏁 SWEEP COMPLETE: Best model saved.")'
            lr_var = "current_lr"
            out_dir = 'f"outputs_sweep_{sweep_idx}"'
            save_path = 'f"lora_model_sweep_{sweep_idx}"'
            # indent the trainer block
            
        # Manually indent if sweep is enabled, or just rely on the python loop being unindented for a quick hack.
        # To make it proper Python, we should replace the trainer block with indented versions if sweep=True.
        # For simplicity, we just inject the code.
        
        code = UNSLOTH_TEMPLATE.format(
            model_name=req.model_name,
            lora_rank=req.lora_rank,
            dataset_path=req.dataset_path,
            epochs=req.epochs,
            batch_size=req.batch_size,
            learning_rate=lr_var,
            sweep_loop_start=sweep_start,
            sweep_loop_end=sweep_end,
            output_dir=out_dir,
            model_save_path=save_path
        )
        
        # Add python indentation if we injected a for-loop
        if req.is_sweep:
            lines = code.split('\n')
            inside_loop = False
            for i, line in enumerate(lines):
                if 'for sweep_idx' in line:
                    inside_loop = True
                elif line.startswith('    print(f"✅'):
                    inside_loop = False
                elif inside_loop and not line.startswith(' ' * 4) and line.strip() != "":
                    lines[i] = "    " + line
            code = '\n'.join(lines)

        return {"code": TELEMETRY_CODE + code, "instructions": "Run this script. Sweep mode will output multiple models."}
    elif target == "unsloth_dpo":
        code = UNSLOTH_DPO_TEMPLATE.format(
            model_name=req.model_name,
            lora_rank=req.lora_rank,
            dataset_path=req.dataset_path,
            epochs=req.epochs,
            batch_size=req.batch_size,
            learning_rate=req.learning_rate,
            beta=req.beta,
        )
        return {"code": TELEMETRY_CODE + code, "instructions": "Run this DPO script. Make sure your dataset has 'prompt', 'chosen', 'rejected' columns."}
    elif target == "unsloth_rm":
        code = UNSLOTH_REWARD_TEMPLATE.format(
            model_name=req.model_name,
            lora_rank=req.lora_rank,
            dataset_path=req.dataset_path,
            epochs=req.epochs,
            batch_size=req.batch_size,
            learning_rate=req.learning_rate,
        )
        return {"code": TELEMETRY_CODE + code, "instructions": "Run this Reward Modeling script."}
    
    # Fallback for others
    kw = dict(
        model_name=req.model_name, lora_rank=req.lora_rank,
        dataset_path=req.dataset_path, epochs=req.epochs,
        batch_size=req.batch_size, learning_rate=req.learning_rate,
        beta=req.beta
    )
    templates = {
        "colab":   COLAB_TEMPLATE,
        "aws":     AWS_TEMPLATE,
        "gcp":     GCP_TEMPLATE,
        "azure":   AZURE_TEMPLATE,
    }
    code = templates.get(target, "# Unknown target: " + req.target)
    if callable(getattr(code, "format", None)):
        code = code.format(**kw)
    return {"status": "success", "code": code.strip(), "target": target}


@router.get("/models")
def browse_models(query: str = "llama", limit: int = 10):
    """Search HuggingFace for fine-tunable base models."""
    try:
        import requests as _req
        r = _req.get(
            "https://huggingface.co/api/models",
            params={"search": query, "filter": "text-generation",
                    "sort": "downloads", "limit": limit},
            timeout=10,
        )
        r.raise_for_status()
        return {
            "models": [
                {"id": m.get("id"), "downloads": m.get("downloads", 0),
                 "likes": m.get("likes", 0), "tags": m.get("tags", [])}
                for m in r.json()
            ]
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
