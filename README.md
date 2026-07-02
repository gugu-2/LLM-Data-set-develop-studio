<p align="center">
  <img src="https://img.shields.io/badge/Hypasia_AI-v2.0-ea2804?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNS0xMC01ek0yIDEybDEwIDUgMTAtNS0xMC01eiIvPjwvc3ZnPg=="/>
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react"/>
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge"/>
</p>

<h1 align="center">Vector OS</h1>
<p align="center"><strong>The world's most complete LLM development platform — from raw data to deployed model, in one tool.</strong></p>

---

## What is Vector OS?

Hypasia is an end-to-end, browser-based LLM development studio. It replaces a fragmented ecosystem of 6-8 separate tools (Scale AI, Labelbox, Weights & Biases, HuggingFace AutoTrain, Argilla, etc.) with a single, beautiful, integrated platform.

Whether you're a seasoned ML engineer or a non-technical founder who just wants a custom AI — Hypasia has you covered.

---

## ✨ Feature Overview (16 Modules)

| Module | Route | Description |
|--------|-------|-------------|
| 🏠 Dashboard | `/` | System overview, quick stats, activity feed |
| 🧙 AI Wizard | `/wizard` | 5-step no-code setup — auto-generates full training script |
| ⛏️ Data Miner | `/mine` | Crawl websites, parse PDFs, bulk-mine URLs |
| 🎙️ Expert Elicitor | `/elicit` | Extract structured knowledge from domain experts |
| ✅ Annotation Studio | `/annotate` | Label, approve, edit training pairs with keyboard shortcuts |
| 🌿 Version Control | `/versions` | Git-like versioning for your datasets |
| 🔧 Fine-Tune Studio | `/finetune` | Live training with real-time telemetry dashboard |
| 🧮 Cost Calculator | `/calculator` | Predict GPU cost, VRAM, and training time before you spend |
| 🤖 Synth Factory | `/synth` | Generate thousands of training pairs with Gemini AI |
| 🔬 Model Arena | `/arena` | Compare models side-by-side with ELO ranking |
| 📊 Auto-Eval | `/eval` | Automated benchmark evaluation suite |
| 🛡️ Red-Team Gen | `/redteam` | Generate adversarial attacks to find model weaknesses |
| 🔒 Poison Detector | `/safety` | Detect and remove poisoned/toxic training samples |
| ♻️ Data Flywheel | `/flywheel` | Active learning loop — continuously improve your dataset |
| 🛍️ Marketplace | `/marketplace` | Buy and sell curated training datasets |
| 🤖 AI Chat | `/chat` | Gemini-powered assistant for ML debugging help |

---

## 🚀 Quick Start

### Prerequisites
| Tool | Version | Required |
|------|---------|----------|
| Python | 3.10+ | ✅ Yes |
| Node.js | 18+ | ✅ Yes |
| Ollama | Latest | ⚪ Optional (free local AI scoring) |
| Gemini API Key | — | ⚪ Optional (cloud AI features) |

### 1. Clone & Install Backend
```bash
git clone https://github.com/yourusername/hypasia-ai.git
cd "hypasia-ai"

# Install Python package with all dependencies
pip install -e .[api,js]

# (Optional) Install Playwright for JS-heavy sites
playwright install chromium
```

### 2. Install Frontend
```bash
cd web
npm install
```

### 3. Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your keys (optional but recommended)
# GEMINI_API_KEY=AIzaSy...
# HF_TOKEN=hf_...
```

### 4. Run the Stack

Open **two terminals**:

**Terminal 1 — Backend (FastAPI)**
```bash
# Windows
$env:PYTHONUTF8="1"
cd src
python -m uvicorn hypasia.api.main:app --reload --port 8000

# macOS / Linux
cd src
python -m uvicorn hypasia.api.main:app --reload --port 8000
```

**Terminal 2 — Frontend (Vite + React)**
```bash
cd web
npm run dev
```

Open **http://localhost:5173** in your browser. 🎉

---

## 📖 Documentation Hub

| Document | Description |
|----------|-------------|
| [Features Guide](docs/FEATURES.md) | Detailed walkthrough of all 16 modules |
| [API Reference](docs/API_REFERENCE.md) | Complete REST API endpoint documentation |
| [System Architecture](docs/ARCHITECTURE.md) | How the backend and frontend connect |
| [Deployment Guide](docs/DEPLOYMENT.md) | Deploy to production (Docker, Cloud) |
| [Scoring Rubric](docs/SCORING_RUBRIC.md) | How Hypasia scores data quality |
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | How to add features and contribute |
| [Changelog](docs/CHANGELOG.md) | Version history and what's new |

---

## 🏗️ Tech Stack

**Backend**
- `FastAPI` — High-performance async Python API
- `Unsloth` — Optimized LoRA fine-tuning engine
- `google-genai` — Gemini Pro/Flash AI scoring and generation
- `Playwright` — JavaScript-rendered web crawling
- `PDFPlumber` — PDF text extraction
- `SQLite` — Local storage for marketplace, flywheel, versions

**Frontend**
- `React 18` + `Vite` — Fast, modern SPA framework
- `Recharts` — Beautiful animated data visualization
- `Lucide React` — Consistent icon system
- `Vanilla CSS` — Bespoke design system (no Tailwind)

---

## 🗺️ Architecture

```
User Browser (React/Vite :5173)
    │
    ▼
FastAPI Backend (:8000)
    │
    ├── /api/mine        → Web Crawler, PDF Parser, AI Scorer
    ├── /api/wizard      → Model Recommender, Script Generator
    ├── /api/synth       → Gemini Synthetic Data Generator (streaming)
    ├── /api/arena       → Multi-Model Query + ELO System
    ├── /api/finetune    → Training Code Generator
    ├── /api/chat        → Streaming Gemini Chat
    ├── /api/annotate    → Annotation Session Manager
    ├── /api/versions    → Dataset Version Control
    ├── /api/marketplace → Dataset Buy/Sell
    ├── /api/flywheel    → Active Learning Loop
    ├── /api/redteam     → Adversarial Attack Generator
    ├── /api/safety      → Poison & Toxicity Detector
    ├── /api/elicit      → Expert Knowledge Extractor
    ├── /api/debug       → ML Error Analyzer
    └── /api/telemetry   → Live Training Metrics WebSocket
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ❤️ by the Hypasia team. Star ⭐ the repo if this saves you time!</p>
