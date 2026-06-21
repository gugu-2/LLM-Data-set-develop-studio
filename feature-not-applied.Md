Here is a complete inventory of everything we have discussed and conceptualized for Hypasia AI, split into what is already running in your codebase and what remains as future suggestions.

### 🟢 Features Applied (Fully Implemented)

**Data Mining & Extraction**
1. **Intelligent Web Crawler**: Extracts raw text from URLs and XML sitemaps.
2. **Document Parsers**: Extracts structured text from PDFs, DOCX, TXT, CSV, and HTML files.
3. **HuggingFace Connector**: Downloads and converts external datasets from the HuggingFace Hub directly into your pipeline.
4. **Context Chunking**: Automatically slices massive Wikipedia articles and documents into perfect 250-word chunks so they fit nicely into an LLM's context window.

**Data Cleaning & Security**
5. **PII Scrubbing**: Automatically detects and redacts emails, SSNs, phone numbers, and IP addresses.
6. **Fuzzy Deduplication**: Uses MinHash / LSH to detect and delete rows that are slightly reworded duplicates of each other.
7. **Language Normalisation**: Filters out unwanted languages and strips out messy HTML/Unicode artifacts.
8. **Poison & Safety Scanning**: Scans the dataset for hidden adversarial triggers or severe toxicity before training.
9. **Cryptographic Fingerprinting**: Embeds an invisible statistical watermark into your dataset so you can prove ownership of models trained on your data.

**Scoring & Curation**
10. **LLM-as-a-Judge**: Uses the Gemini API to rigorously grade every data row from 0-10 on six axes (clarity, specificity, completeness, uniqueness, difficulty, domain relevance).
11. **Heuristic Fallback Scoring**: A fast, offline regex-based scoring system that takes over if the API limits are hit.
12. **FAISS Diversity Clustering**: Uses Machine Learning embeddings (Sentence Transformers + FAISS) to guarantee your final dataset has maximum topic diversity without redundancy.
13. **Dataset Augmentation**: Auto-translates and rephrases your data rows to artificially multiply the size of your training data.

**Training & Platform Utilities**
14. **Fine-Tune Script Generator**: Automatically generates the exact Python scripts needed to train an SFT model using Unsloth, AWS SageMaker, or GCP Vertex AI.
15. **Evaluation Benchmarking**: Automatically creates a multiple-choice exam out of your dataset to test if your newly fine-tuned model actually learned the material.
16. **Version Control**: A local `git`-style system for dataset snapshots so you can track how your data evolves.
17. **Persistent Marketplace**: An SQLite-powered internal hub where teams can publish, browse, and download datasets.
18. **Expert Elicitor & Annotation Studio**: UIs for humans to manually write and correct AI-generated data rows.
19. **Streaming AI Chat**: A real-time Gemini coding assistant embedded directly in the app to help you debug PyTorch and CUDA errors.
20. **Dashboard Analytics**: Live, interactive Recharts graphs tracking your data velocity and quality distributions.
21. **Command Line Interface (CLI)**: A massive terminal tool (`hypasia run`, `hypasia crawl`, etc.) that allows you to do everything the UI does from a headless server.

---

### 🟡 Features Suggested but NOT Applied Yet

1. **DPO (Direct Preference Optimization) Training Pipeline**
   * *What it is*: Auto-pairing your top-scoring "Gold" rows with your low-scoring "Rejected" rows to create `chosen/rejected` pairs, and generating the `DPOTrainer` scripts. This aligns the model to stop it from hallucinating or being lazy.
2. **RLHF (Reinforcement Learning from Human Feedback)**
   * *What it is*: Adding a reward-modeling pipeline where you train a secondary model to score the data. (DPO is usually preferred over this now as it's much easier).
3. **Playwright / Headless Browser Scraping**
   * *What it is*: Adding full headless Chrome automation to the web crawler so it can scrape heavy JavaScript/React Single-Page Applications that block standard bots.
4. **Vision & Multi-Modal Mining**
   * *What it is*: Expanding the parsers to extract images, charts, and audio snippets to build datasets for Vision-Language Models (VLMs) like LLaVA.
5. **Local Ollama Judge Integration (UI)**
   * *What it is*: While our backend currently supports scoring with local `ollama` models (like Llama-3), the frontend UI Settings panel doesn't have a dedicated toggle for it yet. Fully integrating this would allow you to score datasets 100% offline for free.
6. **Recursive Active Learning Loop**
   * *What it is*: Once you finish training your custom model, you plug it *back* into Hypasia to act as the "Judge" for the next batch of data, creating a self-improving loop without needing Gemini at all.

Would you like to tackle the **DPO pipeline**, the **Playwright crawler**, or any of the other unapplied suggestions next?