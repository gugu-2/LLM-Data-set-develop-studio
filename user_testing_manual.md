# Hypasia AI: Comprehensive User Testing Manual

This document is a step-by-step guide to manually testing every single feature in the Hypasia AI platform. It includes the expected data sources to use, the exact steps to perform, and the expected outcomes to verify that the platform is working flawlessly.

---

## 🧪 0. Test Data Sources

To properly test the application under realistic load, use these medium-to-large data sources. 

*(Note on Web URLs: The Data Miner uses advanced extraction engines (`trafilatura`), meaning **ANY** website will work—not just Wikipedia. It strips out ads, navbars, and footers, extracting only the core text. Try blogs, news sites, or documentation!)*

1. **Web URL (For Mining):** 
   - *Technical Blog:* `https://lilianweng.github.io/posts/2023-06-23-agent/` (A massive, highly technical post about LLM Agents)
   - *Alternative (News/Essay):* `https://paulgraham.com/greatwork.html` (A very long essay on how to do great work)
2. **Audio/Video URL (For Audio Miner):** 
   - `https://www.youtube.com/watch?v=1bxgxJEB2io` (A 2-hour long Lex Fridman podcast episode for stress-testing audio parsing)
3. **Raw Text (For Knowledge Graph / Synth Factory):** 
   > "The Transformer architecture, introduced in the 2017 paper 'Attention Is All You Need' by Vaswani et al., completely revolutionized natural language processing. Prior to this, Recurrent Neural Networks (RNNs) and Long Short-Term Memory (LSTM) networks were the standard. The defining feature of the Transformer is the 'Self-Attention' mechanism, which allows the model to weigh the importance of different words in a sequence simultaneously, rather than processing them sequentially. This parallelization enables the training of massive language models (LLMs) on massive datasets using distributed GPU clusters. To make these models useful for conversation, they undergo a two-step process: Supervised Fine-Tuning (SFT) on high-quality instruction data, followed by Reinforcement Learning from Human Feedback (RLHF), which aligns the model's behavior with human preferences using a reward model."
4. **Sample System Prompt (For Prompt Studio):** 
   - `You are an elite, highly cynical Senior Staff Software Engineer evaluating a junior developer's code. You must point out architectural flaws, suggest high-performance alternatives (like Rust or Go), and aggressively question their choice of frameworks. Do not be polite.`

---

## 📥 1. Sources (Data Ingestion)

### 1.1 Data Miner (`/mine`)
- **Action:** Enter the Wikipedia URL above, set Depth to `1`, and click "Start Mining".
- **Expected Result:** The system scrapes the URL, parses the text, and displays raw instruction-response pairs on the right side.

### 1.2 Synthetic Generation (`/synth`)
- **Action:** Select the "Gemini 2.5 Pro" model. Enter the topic `Quantum Physics`. Click "Generate Data".
- **Expected Result:** The AI hallucinates high-quality QA pairs about Quantum Physics and streams them into the UI.

### 1.3 Voice & Audio (`/audio`)
- **Action:** Enter the YouTube URL provided in the test sources. Click "Process Audio".
- **Expected Result:** The system downloads the audio, transcribes it, and converts it into Q&A training rows.

### 1.4 Knowledge Graph (`/graph`)
- **Action:** Paste the Raw Text (Test Source 3) into the input box. Click "Extract Graph".
- **Expected Result:** A 2D physics simulation appears showing interconnected nodes (LLMs, Transformers, Deep Learning).

### 1.5 Dataset Converter (`/convert`)
- **Action:** Select a target format (e.g., `ShareGPT` or `Alpaca`). Click "Convert Format".
- **Expected Result:** The JSON on the right updates to reflect the new structure.

### 1.6 Persona Matrix (`/matrix`)
- **Action:** Enter a seed like `A pirate who is also a software engineer`. Click "Simulate Personas".
- **Expected Result:** A conversation thread generates between various simulated AI personalities based on the seed.

---

## 🧠 2. Training (Model Engineering)

### 2.1 Fine-Tune Studio (`/finetune`)
- **Action:** Select a base model (e.g., Llama-3-8B). Set epochs to `3`. Click "Start Fine-Tuning".
- **Expected Result:** A live terminal output appears showing the training loop, loss metrics dropping, and a success message upon completion.

### 2.2 Prompt Studio (`/prompt`)
- **Action:** Enter the Sample System Prompt (Test Source 4). Ask a user message like "What is gravity?". Click "Test Prompt".
- **Expected Result:** The model responds in the voice of someone talking to a 5-year-old.

### 2.3 DeepThink Studio (`/deepthink`)
- **Action:** Ensure your Gemini API key is configured. Leave the default instruction. Click "Synthesize Reasoning Trace".
- **Expected Result:** The system generates a `<think>` block detailing the step-by-step logic to arrive at the answer.

### 2.4 Model Arena (`/arena`)
- **Action:** Select two models to fight. Enter a prompt like "Write a python script for a snake game". Click "Run Automated Fight".
- **Expected Result:** Both models stream their answers side-by-side, followed by an automated judge declaring a winner.

### 2.5 Agent Sandbox (`/sandbox`)
- **Action:** Enter a prompt that requires internet access (e.g., "What is the latest AI news in 2026?"). Click "Deploy Agent".
- **Expected Result:** The agent outputs a `[TOOL_CALL: web_search]`, the system injects a mock observation, and the agent outputs a final answer based on the search.

### 2.6 Automated Evaluator (`/evaluator`)
- **Action:** Click "Run Automated Suite".
- **Expected Result:** The system runs a batch of prompts against the model, grading them on logic, coherence, and safety, resulting in a spider-web chart.

### 2.7 Swarm Studio (`/swarm`)
- **Action:** Enter a topic like "Open Source vs Closed Source". Click "Start Swarm".
- **Expected Result:** The Optimist, The Skeptic, and The Synthesizer debate in a live thread until consensus is reached.

---

## ⚙️ 3. Management (Data Ops)

### 3.1 Dataset Inspector (`/inspector`)
- **Action:** View the visualizer.
- **Expected Result:** You see charts showing sequence lengths, token distributions, and duplicate counts.

### 3.2 Version Control (`/versions`)
- **Action:** Click on two different commit hashes.
- **Expected Result:** A unified diff view shows exactly what rows were added or removed between dataset versions.

### 3.3 IP Washer (`/washer`)
- **Action:** Type "Contact John at john@apple.com regarding project Titan". Click "Scrub".
- **Expected Result:** The output scrubs the PII, replacing it with `[EMAIL]` and `[COMPANY]`.

### 3.4 Red Teaming (`/redteam`)
- **Action:** Click "Generate Adversarial Prompts".
- **Expected Result:** The system generates jailbreak attempts and evaluates if the model is safe.

---

## 🚀 4. Production (Deployment & Ops)

### 4.1 Deployment (`/deploy`)
- **Action:** Select a trained model from the dropdown. Choose "Kubernetes". Click "Deploy".
- **Expected Result:** A mock deployment completes, generating a REST endpoint and an API Bearer token for consumption.

### 4.2 RLHF Tinder (`/rlhf`)
- **Action:** Look at the two answers. Click the "Green Check" on the better one, or the "X" if they both fail.
- **Expected Result:** The UI swipes right/left (Tinder style) and records a DPO preference pair in the database.

### 4.3 Data Flywheel (`/flywheel`)
- **Action:** Look at the automation metrics.
- **Expected Result:** The dashboard shows logs of data continuously streaming from production back into the training pipeline.

### 4.4 Self Healing (`/healing`)
- **Action:** Click "Run Diagnostics".
- **Expected Result:** It detects failing API routes or bad dataset schemas and automatically "heals" them in the mock report.

---

> [!TIP]
> **API Testing:** If you are a developer, you can also test the raw backend directly. Go to the bottom left of the sidebar and click **API Docs** (or go to `http://localhost:8000/docs`). This opens the interactive Swagger UI where you can test every single REST endpoint manually without the React frontend.
