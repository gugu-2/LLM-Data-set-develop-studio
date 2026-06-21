# Features Guide — Hypasia AI v2.0

> Complete reference for all 16 modules in the Hypasia AI Studio.

---

## Quick Navigation

1. [AI Wizard](#1-ai-wizard-wizard) ⭐ New
2. [Data Miner](#2-data-miner-mine)
3. [Expert Elicitor](#3-expert-elicitor-elicit)
4. [Annotation Studio](#4-annotation-studio-annotate)
5. [Version Control](#5-version-control-versions)
6. [Fine-Tune Studio](#6-fine-tune-studio-finetune)
7. [Cost Calculator](#7-cost-calculator-calculator)
8. [Synthetic Data Factory](#8-synthetic-data-factory-synth) ⭐ New
9. [Model Arena](#9-model-arena-arena) ⭐ New
10. [Auto-Eval](#10-auto-eval-eval)
11. [Red-Team Generator](#11-red-team-generator-redteam)
12. [Poison Detector](#12-poison-detector-safety)
13. [Data Flywheel](#13-data-flywheel-flywheel)
14. [Marketplace](#14-marketplace-marketplace)
15. [AI Chat Assistant](#15-ai-chat-assistant-chat)
16. [Settings](#16-settings-settings)

---

## 1. AI Wizard (`/wizard`) ⭐ New

**Who it's for:** Non-technical users, founders, BI analysts, beginners.

The AI Wizard is a 5-step guided setup that auto-configures and generates a complete, ready-to-run fine-tuning pipeline — no ML knowledge required.

### Steps
| Step | Question | What it does |
|------|----------|--------------|
| 1 | What do you want your AI to do? | Picks the right system prompt and use-case template |
| 2 | What data do you have? | Selects data ingestion method (upload, URL, Marketplace) |
| 3 | What's your budget? | Selects the best model tier (0.5B → 22B) |
| 4 | How fast do you need it? | Adjusts GPU and quantization for speed vs. quality |
| 5 | Review & Generate | Shows full config summary + downloads ready-to-run Python script |

### Supported Goals
- 💬 Customer Support Bot
- 💻 Code Helper
- ✍️ Content Writer
- ❓ Q&A Bot
- 🏥 Medical Assistant
- ⚖️ Legal Assistant
- 🔧 Custom (describe your own)

### Output
Downloads a complete `hypasia_training.py` script pre-configured with:
- Model selection (Qwen2.5, Llama 3.2, Mistral, etc.)
- 4-bit quantization via Unsloth
- LoRA adapter configuration
- Dataset loading from your exported JSONL
- Full training loop with logging
- Save + optional HuggingFace Hub push

---

## 2. Data Miner (`/mine`)

**Who it's for:** Developers who need to build training datasets from web content.

Transforms raw, unstructured data from the internet into scored JSONL training pairs.

### Data Sources
| Source | How to use |
|--------|-----------|
| Single URL | Paste any website URL. Recursively crawls up to depth 3. |
| Wikipedia | Paste a Wikipedia URL. Extracts clean article text. |
| Sitemap XML | Provide a sitemap.xml URL to mine entire documentation sites. |
| Bulk URL List | Upload a `.txt` or `.csv` file with thousands of URLs. |
| PDF | Drag and drop. Extracted using PDFPlumber. |
| DOCX | Drag and drop. Microsoft Word documents. |
| CSV/Excel/Parquet | Drag and drop tabular data files. |
| JSONL | Drag and drop existing training data for re-scoring. |

### AI Scoring
Every extracted row is evaluated on a 6-axis quality rubric:
- **Specificity** — Is the content detailed and precise?
- **Clarity** — Is it easy to understand?
- **Completeness** — Is the information complete?
- **Difficulty** — Is it appropriately challenging?
- **Uniqueness** — Is it novel (not duplicated)?
- **Domain Relevance** — Does it match the target domain?

Rows scoring below the threshold (default 7.0/10) are immediately discarded.

### Scoring Judges
| Judge | Speed | Cost | Privacy |
|-------|-------|------|---------|
| Heuristic | Instant | Free | ✅ Local |
| Ollama | Fast | Free | ✅ Local |
| Gemini Flash | Very fast | ~$0.001/row | ☁️ Cloud |

---

## 3. Expert Elicitor (`/elicit`)

**Who it's for:** Teams who want to capture domain expert knowledge systematically.

A structured interview tool that turns an expert's verbal knowledge into fine-tuning pairs.

### Features
- Guided question templates for different domains
- Auto-generates follow-up questions based on answers
- Exports structured instruction/response pairs directly to JSONL

---

## 4. Annotation Studio (`/annotate`)

**Who it's for:** Teams doing human-in-the-loop data quality control.

Label Studio-style annotation environment built into Hypasia.

### Features
- Load any JSONL dataset into a named session
- Review each row with full instruction/response view
- **Approve** ✅ / **Reject** ❌ / **Edit** ✏️ each pair
- **Keyboard shortcuts** for speed (A = Approve, R = Reject, E = Edit, → = Next)
- Progress bar with annotation statistics
- Export only approved rows as clean JSONL

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `A` | Approve current row |
| `R` | Reject current row |
| `E` | Edit current row |
| `→` or `N` | Next row |
| `←` or `P` | Previous row |

---

## 5. Version Control (`/versions`)

**Who it's for:** Teams managing multiple dataset iterations.

Git-like version management for your training datasets.

### Features
- Commit datasets with a name and message
- View full version history with timestamps and row counts
- Diff two versions to see exact row-level changes
- Rollback / Download any past version as JSONL
- Delete old versions to free space

---

## 6. Fine-Tune Studio (`/finetune`)

**Who it's for:** ML engineers running actual fine-tuning jobs.

The most advanced tab in Hypasia — a full training control center.

### Features
- **Model Selector:** 50+ pre-configured models across OpenAI, Meta, Mistral, Qwen, Google families
- **Deployment Targets:** Local Unsloth / AWS SageMaker / GCP Vertex AI / Azure ML / Google Colab
- **Hyperparameter Sliders:** Batch size, LoRA rank, context window, epochs
- **Live Telemetry Dashboard** (4 charts):
  - 📈 Model Learning Progress (training loss over steps)
  - 🟥 Confusion Meter (gradient norm — high = bad data)
  - 🌊 Brain Plasticity (learning rate decay curve)
  - ⏱️ Cost & Efficiency (epoch progress + ETA)
- **AI Debugging Assistant:** Paste any CUDA or PyTorch traceback — Gemini diagnoses and fixes it

---

## 7. Cost Calculator (`/calculator`)

**Who it's for:** Anyone planning a training run who needs to know cost upfront.

Predicts GPU VRAM usage, training time, and total cost before you spend a cent.

### Inputs
- Model parameter count (0.5B → 405B)
- Quantization (4-bit / 8-bit / 16-bit / 32-bit)
- Dataset size (number of rows + average words per row)
- LoRA rank, batch size, epochs, context window
- Cloud GPU selection (T4, A10, A100 40GB, A100 80GB, H100, etc.)

### Outputs
- **OOM Warning:** Predicts if your config will crash with CUDA OutOfMemory before you start
- **Recommended GPU:** Best GPU for your budget
- **Cheapest GPU:** Lowest total cost option
- **Fastest GPU:** Shortest training time
- **Comparison Charts:** Visual bar charts comparing all GPUs by cost and time

---

## 8. Synthetic Data Factory (`/synth`) ⭐ New

**Who it's for:** Anyone who needs training data but has none to start with.

Generate thousands of high-quality instruction/response training pairs using Gemini AI — from just a topic description.

### Workflow
1. **Describe your topic** — e.g., "A customer service bot for a shoe store"
2. **Paste style examples** (optional) — provide 2-3 pairs to match your tone
3. **Configure generation:**
   - Count: 100 to 10,000 pairs
   - Difficulty: Beginner / Intermediate / Expert / Adversarial
   - Diversity: Low / Medium / High
   - Domain: Tech / Medical / Legal / Finance / Retail / General
4. **Preview** — Generate 5 sample pairs first to validate quality
5. **Generate** — Stream full dataset in real-time
6. **Export** — Download as JSONL or send directly to Annotation Studio

### Quality Notes
- Each pair is generated with uniqueness and diversity constraints
- Adversarial mode generates edge cases to make your model robust
- High diversity mode uses different formats, personas, and sub-topics

---

## 9. Model Arena (`/arena`) ⭐ New

**Who it's for:** Researchers and engineers comparing multiple fine-tuned checkpoints.

A side-by-side model comparison ring with automatic ELO rating.

### Supported Model Providers
| Provider | Format | Example |
|----------|--------|---------|
| Ollama (local) | `ollama:model-name` | `ollama:llama3.1` |
| Gemini (cloud) | `gemini:model-name` | `gemini:gemini-2.0-flash` |
| OpenAI-compatible | `openai:model-name` | `openai:gpt-4o` |

### Features
- Load 2-4 models simultaneously
- Send one prompt to all models in parallel
- See responses side-by-side with latency and token count
- **Vote** on the best response → ELO scores update automatically
- **Live Leaderboard** showing model rankings by ELO
- **Battle History** log of all past comparisons
- Reset and start fresh anytime

### ELO System
Uses the standard chess ELO formula (K=32). Each vote updates both models:
- Winner gains points proportional to the expected upset
- Loser loses the equivalent amount
- New models start at 1000 ELO

---

## 10. Auto-Eval (`/eval`)

**Who it's for:** Engineers who need objective benchmarks.

Run automated evaluation benchmarks on your fine-tuned models.

---

## 11. Red-Team Generator (`/redteam`)

**Who it's for:** Safety engineers and teams deploying public-facing models.

Generate adversarial attack prompts to find weaknesses in your model before shipping.

### Attack Types
| Type | Color | Description |
|------|-------|-------------|
| Jailbreak | 🔴 Red | Attempts to bypass safety guardrails |
| Edge Case | 🟠 Orange | Unusual inputs that expose brittle behavior |
| Contradiction | 🟣 Purple | Conflicting instructions that cause confusion |
| Injection | 🔴 Dark Red | Prompt injection to hijack instructions |
| Ambiguous | 🔵 Blue | Intentionally unclear prompts |

### Output
For each attack type, generates N variants of adversarial prompts + expected safe responses. Export as JSONL for further human review.

---

## 12. Poison Detector (`/safety`)

**Who it's for:** Teams validating third-party or scraped datasets.

Scans datasets for toxic, biased, or deliberately poisoned training examples.

---

## 13. Data Flywheel (`/flywheel`)

**Who it's for:** Teams running production AI systems who want continuous improvement.

Implements an active learning loop. Low-confidence model outputs are automatically queued for human review and re-added to the training dataset.

### Features
- View the active learning queue with score distribution
- Set a score threshold — rows below it get re-queued
- Trigger retraining with a single click
- Track flywheel status (queue depth, average score, last retrain time)

---

## 14. Marketplace (`/marketplace`)

**Who it's for:** Anyone who wants to buy ready-made datasets or sell their own.

Browse and purchase curated, pre-scored training datasets.

### Features
- Browse by category, domain, and size
- Each dataset shows quality score, row count, and price
- One-click purchase → instant JSONL download
- (Coming soon) Sell your own datasets

---

## 15. AI Chat Assistant (`/chat`)

**Who it's for:** Everyone — especially when you're stuck.

A specialized Gemini-powered chatbot trained on LLM fine-tuning, HuggingFace, Unsloth, and common ML errors.

### Capabilities
- Debug CUDA OutOfMemory errors
- Explain training hyperparameters
- Review Python training scripts
- Answer HuggingFace ecosystem questions
- Diagnose tokenizer and dataset formatting issues

### How to use
1. Enter your Gemini API key at the top of the page
2. (Optional) Paste an error log or code into the Context panel
3. Ask your question — responses stream in real-time

---

## 16. Settings (`/settings`)

**Who it's for:** All users — configure once, use everywhere.

All settings are stored in your browser's `localStorage` — never uploaded to any server.

### Configurable Options
| Setting | Description |
|---------|-------------|
| Gemini API Key | Used by AI Wizard, Synth Factory, Chat, Debug Assistant, and Red Team |
| HuggingFace Token | Required for pushing models/datasets to HF Hub |
| Default LLM Judge | Heuristic / Ollama / Gemini |
| Ollama Model | Which local model to use for scoring |
| Quality Threshold | Minimum score to keep a row (default 7.0) |
| Language Filter | Filter mined content to specific languages |
| Auto-scrub PII | Automatically remove personal information |
| DNA Fingerprint | Embed invisible watermark into your datasets |
| Push to HF Hub | Upload datasets directly to HuggingFace Hub |
