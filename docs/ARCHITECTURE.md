# System Architecture — Hypasia AI v2.0

> Technical deep-dive into how the Hypasia backend and frontend are structured, communicate, and scale.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                                  │
│   React 18 + Vite SPA @ http://localhost:5173                       │
│                                                                      │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ AI Wizard│  │Synth Factory│  │ Model Arena  │  │Fine-Tune   │  │
│  │ /wizard  │  │ /synth      │  │ /arena       │  │ /finetune  │  │
│  └────┬─────┘  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │
│       └───────────────┼────────────────┼────────────────┘          │
│                        ▼ fetch() / axios                            │
└───────────────────────────────────────────────────────────────────-─┘
                         │ HTTP/SSE
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FastAPI BACKEND @ :8000                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    main.py (App Router)                       │  │
│  │                                                              │  │
│  │  /api/mine      /api/wizard   /api/synth    /api/arena       │  │
│  │  /api/finetune  /api/chat     /api/annotate /api/versions    │  │
│  │  /api/redteam   /api/safety   /api/flywheel /api/marketplace │  │
│  │  /api/telemetry /api/export   /api/elicit   /api/debug       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                         │                                           │
│         ┌───────────────┼──────────────────────┐                   │
│         ▼               ▼                      ▼                   │
│  ┌────────────┐  ┌─────────────┐  ┌───────────────────────────┐   │
│  │  AI Engines│  │  Databases  │  │   External APIs           │   │
│  │            │  │             │  │                           │   │
│  │ • Gemini   │  │ SQLite:     │  │ • Google Gemini API       │   │
│  │ • Ollama   │  │  flywheel   │  │ • HuggingFace Hub API     │   │
│  │ • Unsloth  │  │  marketplace│  │ • Ollama REST API (:11434)│   │
│  │            │  │  versions   │  │ • OpenAI-compatible APIs  │   │
│  └────────────┘  └─────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
hypasia-ai/
├── README.md
├── pyproject.toml            # Python package config + dependencies
├── .env                      # API keys (not committed to git)
├── .env.example              # Example env vars template
│
├── src/
│   └── hypasia/
│       ├── __init__.py
│       ├── config.py         # Pydantic Settings (reads .env)
│       ├── schema.py         # HypasiaRow dataclass (core data model)
│       │
│       ├── api/
│       │   ├── main.py       # FastAPI app entry point + router registration
│       │   └── routes/
│       │       ├── mine.py        # Web crawling + file parsing
│       │       ├── wizard.py      # ⭐ AI Wizard (model recommender + script gen)
│       │       ├── synth.py       # ⭐ Synthetic Data Factory
│       │       ├── arena.py       # ⭐ Model Arena + ELO system
│       │       ├── finetune.py    # Training code generator
│       │       ├── chat.py        # Streaming Gemini chat
│       │       ├── studio.py      # Annotation, versions, fingerprint, redteam
│       │       ├── flywheel.py    # Active learning loop
│       │       ├── marketplace.py # Dataset buy/sell
│       │       ├── elicit.py      # Expert knowledge extraction
│       │       ├── augment.py     # Dataset augmentation
│       │       ├── safety.py      # Poison + toxicity detection
│       │       ├── debug.py       # ML error analyzer
│       │       ├── export.py      # JSONL file export
│       │       └── telemetry.py   # Training metrics endpoint
│       │
│       ├── mining/
│       │   ├── crawler/
│       │   │   ├── web.py         # BFS web crawler (trafilatura)
│       │   │   └── sitemap.py     # Sitemap XML parser
│       │   └── parsers/
│       │       ├── dispatcher.py  # Routes files to correct parser
│       │       ├── pdf.py         # PDFPlumber parser
│       │       ├── docx.py        # python-docx parser
│       │       ├── text.py        # Plain text / markdown
│       │       └── tabular.py     # CSV / Excel / Parquet / JSONL
│       │
│       └── scoring/
│           └── judge.py          # 6-axis quality scoring rubric
│
└── web/
    ├── package.json
    ├── vite.config.js
    ├── eslint.config.js
    └── src/
        ├── App.jsx               # Root component: router + sidebar nav
        ├── index.css             # Full design system (CSS custom properties)
        ├── main.jsx              # React DOM entry point
        ├── setupTests.js         # ResizeObserver polyfill for Recharts
        └── pages/
            ├── Dashboard.jsx         # System overview + stats
            ├── AIWizard.jsx          # ⭐ 5-step no-code wizard
            ├── DataMiner.jsx         # Web crawler UI
            ├── ExpertElicitor.jsx    # Expert interview tool
            ├── AnnotationStudio.jsx  # Human labeling interface
            ├── VersionControl.jsx    # Dataset version history
            ├── FineTuneStudio.jsx    # Training + live telemetry
            ├── CostCalculator.jsx    # GPU cost predictor
            ├── SynthFactory.jsx      # ⭐ Synthetic data generator
            ├── ModelArena.jsx        # ⭐ Side-by-side model comparison
            ├── Evaluation.jsx        # Benchmark evaluation
            ├── RedTeam.jsx           # Adversarial testing
            ├── Marketplace.jsx       # Dataset marketplace
            ├── Flywheel.jsx          # Active learning
            ├── AIChat.jsx            # Gemini chat assistant
            └── Settings.jsx          # Configuration
```

---

## Core Data Model

Every piece of data in Hypasia flows through the `HypasiaRow` dataclass:

```python
@dataclass
class HypasiaRow:
    instruction: str      # The user's input / question
    response: str         # The model's expected output
    score: float          # Quality score 0.0–10.0
    tier: str             # "gold" (≥8.0) | "silver" (threshold–8.0) | "discarded"
    source: str           # Where the data came from (URL, file path, etc.)
    source_type: str      # "web" | "file" | "hf" | "synthetic" | "expert"
    title: str            # Human-readable title
    raw_text: str         # Original unformatted text (for debugging)
    date_extracted: str   # ISO 8601 timestamp
```

---

## Request Flow — Data Mining

```
Browser: POST /api/mine/run { source: "https://..." }
    │
    ▼
mine.py:run_mining_pipeline()
    │
    ├── URL detection → crawler/web.py:crawl_source()
    │       └── trafilatura.fetch_url() → extract_text()
    │           └── _make_row() → HypasiaRow[]
    │
    ├── File upload → parsers/dispatcher.py:parse_file()
    │       └── pdf.py / docx.py / tabular.py → HypasiaRow[]
    │
    └── Scoring → scoring/judge.py:score_rows()
            ├── judge="heuristic" → regex + length heuristics
            ├── judge="ollama"    → Ollama REST API → score + tier
            └── judge="gemini"    → google-genai → score + tier
                    │
                    ▼
            Filter: score >= threshold
                    │
                    ▼
            Return kept rows to frontend
```

---

## Request Flow — Synthetic Data Factory

```
Browser: POST /api/synth/generate { topic, domain, difficulty, count: 500 }
    │
    ▼
synth.py:synth_generate()
    │
    ├── Split into batches (50 pairs per Gemini call)
    │
    └── For each batch:
            ├── Build structured prompt with difficulty + diversity instructions
            ├── google-genai: models.generate_content()
            ├── Parse JSONL lines from response
            └── yield JSON line → StreamingResponse (NDJSON)
                    │
                    ▼
            Browser receives streaming pairs in real-time
            └── Renders in live preview table
```

---

## Request Flow — Model Arena

```
Browser: POST /api/arena/query × N (one per loaded model, in parallel)
    │
    ▼
arena.py:arena_query()
    │
    ├── Parse model_id: "provider:model-name"
    ├── provider="ollama"  → httpx → localhost:11434/api/chat
    ├── provider="gemini"  → google-genai → generate_content()
    └── provider="openai"  → httpx → openai.com/v1/chat/completions
            │
            ▼
    Return { content, latency_ms, prompt_tokens, gen_tokens, elo }

Browser: POST /api/arena/vote { winner_id, loser_id }
    │
    ▼
arena.py:arena_vote()
    │
    ├── Fetch current ELO for winner and loser (default 1000)
    ├── Apply ELO formula: K=32, expected score from current ratings
    └── Update in-memory _elo_scores dict + append to _battle_history
```

---

## Design System

The frontend uses a bespoke CSS design system defined in `index.css`:

```css
:root {
  /* Brand */
  --primary: #ea2804;          /* Hypasia Red */
  --primary-deep: #c01f00;
  --hero-glow: #ff6a3d;

  /* Surfaces */
  --canvas: #f9f7f3;           /* Page background */
  --surface-card: #ffffff;     /* Card background */
  --surface-dark: #202020;     /* Dark panels */

  /* Typography */
  --ink: #202020;              /* Headings */
  --body: #3a3a3a;             /* Body text */
  --charcoal: #575757;         /* Secondary text */
  --mute: #646464;             /* Muted labels */

  /* Semantic */
  --badge-success: #2b9a66;
  --badge-warning: #f59e0b;
  --badge-rejected: #ef4444;
}
```

**Fonts:**
- `Bricolage Grotesque` — Headings (display font)
- `Inter` — Body text
- `JetBrains Mono` — Code blocks

---

## State Management

Hypasia uses **React local state only** — no Redux, Zustand, or Context API.

- Each page manages its own state with `useState` and `useCallback`
- API calls use `axios` or native `fetch`
- Settings are persisted in `localStorage`
- No cookies or server-side sessions

---

## Databases

| Database | File | Contents |
|----------|------|----------|
| Flywheel | `hypasia_flywheel.db` | Active learning queue and cycle history |
| Marketplace | `hypasia_marketplace.db` | Dataset listings and purchase records |
| Versions | `hypasia_versions.db` | Dataset version commits and diffs |

All three are SQLite files stored in the project root. In production, migrate to PostgreSQL.

---

## Security Notes

> [!WARNING]
> Hypasia is designed for **local development use**. Before deploying to production:

1. Set `allow_origins` in `main.py` to your specific frontend domain
2. Move `api_key` to server-side session storage instead of frontend state
3. Enable HTTPS (use nginx + certbot)
4. Rate-limit the `/api/synth/generate` endpoint (it calls Gemini and costs money)
5. Add authentication (JWT or session tokens) to protect all routes
