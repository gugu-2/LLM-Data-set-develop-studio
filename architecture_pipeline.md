# Hypasia AI — Full Pipeline Architecture (v2.0)

```mermaid
flowchart TD
    subgraph INPUT["📥 Data Input Sources"]
        A1[🌐 Web URL / Sitemap]
        A2[📄 PDF / DOCX / CSV]
        A3[🤗 HuggingFace Dataset]
        A4[📋 Bulk URL List]
        A5[🎙️ Expert Interview]
        A6[🤖 Synthetic Generation]
    end

    subgraph MINING["⛏️ Mining & Parsing Layer"]
        B1[BFS Web Crawler\ntrafilatura]
        B2[File Parser Dispatcher\npdf / docx / tabular]
        B3[HF Dataset Loader]
        B4[Gemini Synthetic Engine\nSynth Factory]
        B5[Expert Elicitor\nStructured Q&A]
    end

    subgraph SCORING["📊 AI Quality Scoring"]
        C1{Judge Type}
        C2[Heuristic Scorer\nLength + N-gram rules]
        C3[Ollama Local LLM\nFree, Private]
        C4[Gemini Flash\nCloud, Fast]
        C5[6-Axis Rubric\nSpecificity · Clarity\nCompleteness · Difficulty\nUniqueness · Domain]
    end

    subgraph FILTER["🔍 Quality Filter"]
        D1{Score ≥ Threshold?}
        D2[🥇 Gold Tier ≥ 8.0]
        D3[🥈 Silver Tier ≥ 7.0]
        D4[❌ Discarded < 7.0]
    end

    subgraph QUALITY["✅ Human Quality Control"]
        E1[Annotation Studio\nApprove / Reject / Edit]
        E2[Dataset DNA Fingerprint\nOwnership Watermark]
        E3[Version Control\nGit-like Commits]
    end

    subgraph SAFETY["🛡️ Safety Layer"]
        F1[Red-Team Generator\nAdversarial Attacks]
        F2[Poison Detector\nToxicity Scan]
        F3[PII Scrubber\nAuto-remove personal info]
    end

    subgraph TRAINING["🔧 Training Pipeline"]
        G1[AI Wizard\n5-step No-Code Setup]
        G2[Fine-Tune Studio\nUnsloth / SageMaker / Vertex AI]
        G3[Cost Calculator\nVRAM + Time + Cost Prediction]
        G4[Live Telemetry\nLoss · Grad Norm · LR · ETA]
    end

    subgraph EVAL["📈 Evaluation"]
        H1[Auto-Eval\nBenchmark Suite]
        H2[Model Arena\nSide-by-Side + ELO Ranking]
        H3[AI Chat Debug\nGemini Error Analyzer]
    end

    subgraph PRODUCTION["🚀 Production"]
        I1[Export JSONL\nDownload Dataset]
        I2[Push to HuggingFace Hub\nModel + Dataset]
        I3[Data Flywheel\nActive Learning Loop]
        I4[Marketplace\nBuy / Sell Datasets]
    end

    %% Input flows
    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B1
    A5 --> B5
    A6 --> B4

    %% Mining to scoring
    B1 & B2 & B3 & B4 & B5 --> C1

    %% Scoring
    C1 -->|heuristic| C2
    C1 -->|ollama| C3
    C1 -->|gemini| C4
    C2 & C3 & C4 --> C5

    %% Filter
    C5 --> D1
    D1 -->|yes ≥8.0| D2
    D1 -->|yes ≥threshold| D3
    D1 -->|no| D4

    %% Quality control
    D2 & D3 --> E1
    E1 --> E2
    E2 --> E3

    %% Safety
    E3 --> F1
    E3 --> F2
    E3 --> F3

    %% Training
    F1 & F2 & F3 --> G1
    G1 --> G2
    G3 -.->|advises| G2
    G2 --> G4

    %% Evaluation
    G2 --> H1
    G2 --> H2
    G2 --> H3

    %% Production
    H1 & H2 --> I1
    I1 --> I2
    G4 --> I3
    I3 -->|low confidence rows| E1
    I1 --> I4

    style INPUT fill:#fef3c7,stroke:#f59e0b
    style MINING fill:#ede9fe,stroke:#7c3aed
    style SCORING fill:#dbeafe,stroke:#2563eb
    style FILTER fill:#dcfce7,stroke:#16a34a
    style QUALITY fill:#fce7f3,stroke:#db2777
    style SAFETY fill:#fee2e2,stroke:#dc2626
    style TRAINING fill:#ffedd5,stroke:#ea580c
    style EVAL fill:#f0fdf4,stroke:#15803d
    style PRODUCTION fill:#f0f9ff,stroke:#0369a1
```

---

## Module-to-Route Map

| UI Module | Frontend Route | Backend Prefix | Files |
|-----------|---------------|----------------|-------|
| Dashboard | `/` | — | `Dashboard.jsx` |
| AI Wizard | `/wizard` | `/api/wizard/` | `AIWizard.jsx` · `wizard.py` |
| Data Miner | `/mine` | `/api/mine/` | `DataMiner.jsx` · `mine.py` |
| Expert Elicitor | `/elicit` | `/api/elicit/` | `ExpertElicitor.jsx` · `elicit.py` |
| Annotation Studio | `/annotate` | `/api/annotate/` | `AnnotationStudio.jsx` · `studio.py` |
| Version Control | `/versions` | `/api/versions/` | `VersionControl.jsx` · `studio.py` |
| Fine-Tune Studio | `/finetune` | `/api/finetune/` | `FineTuneStudio.jsx` · `finetune.py` |
| Cost Calculator | `/calculator` | (client-side only) | `CostCalculator.jsx` |
| Synth Factory | `/synth` | `/api/synth/` | `SynthFactory.jsx` · `synth.py` |
| Model Arena | `/arena` | `/api/arena/` | `ModelArena.jsx` · `arena.py` |
| Auto-Eval | `/eval` | `/api/safety/` | `Evaluation.jsx` · `safety.py` |
| Red-Team Gen | `/redteam` | `/api/redteam/` | `RedTeam.jsx` · `studio.py` |
| Poison Detector | `/safety` | `/api/safety/` | `Evaluation.jsx` · `safety.py` |
| Data Flywheel | `/flywheel` | `/api/flywheel/` | `Flywheel.jsx` · `flywheel.py` |
| Marketplace | `/marketplace` | `/api/marketplace/` | `Marketplace.jsx` · `marketplace.py` |
| AI Chat | `/chat` | `/api/chat` | `AIChat.jsx` · `chat.py` |
| Settings | `/settings` | — | `Settings.jsx` (localStorage only) |
