import requests
import json

BASE = 'http://localhost:8000'

def check(label, condition):
    status = "OK" if condition else "FAIL"
    print(f"  [{status}] {label}")

# 1. Health check
print("=== 1. Health Check ===")
r = requests.get(f"{BASE}/api/health")
print(r.status_code, r.json())

# 2. Finetune generate - unsloth
print("\n=== 2. Fine-Tune Generate (unsloth) ===")
r = requests.post(f"{BASE}/api/finetune/generate", json={
    "model_name": "unsloth/llama-3-8b-Instruct-bnb-4bit",
    "target": "unsloth",
    "lora_rank": 32,
    "dataset_path": "my_data.jsonl",
    "epochs": 5,
    "batch_size": 4,
    "learning_rate": "5e-5"
})
print("Status:", r.status_code)
code = r.json().get("code", "")
check("dataset path injected", "my_data.jsonl" in code)
check("epochs injected", "num_train_epochs = 5" in code)
check("batch_size injected", "per_device_train_batch_size = 4" in code)
check("learning_rate injected", "5e-5" in code)
check("lora_rank injected", "r = 32" in code)

# 3. Finetune generate - aws
print("\n=== 3. Fine-Tune Generate (aws) ===")
r = requests.post(f"{BASE}/api/finetune/generate", json={
    "model_name": "unsloth/llama-3-8b",
    "target": "aws",
    "lora_rank": 16,
    "dataset_path": "aws_data.jsonl",
    "epochs": 3,
    "batch_size": 8,
    "learning_rate": "2e-4"
})
print("Status:", r.status_code)
code = r.json().get("code", "")
check("AWS sagemaker template", "sagemaker" in code.lower())
check("dataset aws_data.jsonl injected", "aws_data.jsonl" in code)
check("epochs 3 injected", "'epochs': 3" in code)

# 4. Finetune generate - gcp
print("\n=== 4. Fine-Tune Generate (gcp) ===")
r = requests.post(f"{BASE}/api/finetune/generate", json={
    "model_name": "unsloth/llama-3-8b",
    "target": "gcp",
    "lora_rank": 16,
    "dataset_path": "gcp_data.jsonl",
    "epochs": 2,
    "batch_size": 4,
    "learning_rate": "1e-4"
})
print("Status:", r.status_code)
code = r.json().get("code", "")
check("GCP aiplatform template", "aiplatform" in code.lower())
check("dataset gcp_data.jsonl injected", "gcp_data.jsonl" in code)

# 5. Debug endpoint with no API key
print("\n=== 5. Debug Endpoint (no API key) ===")
r = requests.post(f"{BASE}/api/debug/analyze", json={"error_message": "CUDA out of memory"})
print("Status:", r.status_code, r.json().get("status"), "-", r.json().get("message", "")[:80])

# 6. Mine run - invalid source
print("\n=== 6. Mine Run - Empty Source ===")
r = requests.post(f"{BASE}/api/mine/run", json={
    "source": "https://httpbin.org/html",
    "judge": "ollama",
    "threshold": 1.0,
    "limit": 1
})
print("Status:", r.status_code)
if r.status_code == 200:
    rows = r.json().get("rows", [])
    print(f"  Rows returned: {len(rows)}")
    if rows:
        check("Row has instruction", bool(rows[0].get("instruction")))
        check("Row has response", bool(rows[0].get("response")))
        check("Row has score", rows[0].get("score") is not None)
        check("Row has tier", rows[0].get("tier") is not None)
else:
    print(f"  Error: {r.json()}")

print("\n=== DONE ===")
