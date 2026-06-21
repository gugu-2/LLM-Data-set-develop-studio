# Data Quality Scoring Rubric — Hypasia AI v2.0

> How Hypasia evaluates and scores every training pair.

---

## Overview

Every instruction/response pair that passes through the Hypasia pipeline is scored on a **6-axis quality rubric**, producing a composite score from **0.0 to 10.0**.

Pairs are then classified into tiers:
| Tier | Score Range | Description |
|------|------------|-------------|
| 🥇 Gold | 8.0 – 10.0 | Premium quality. Always kept. |
| 🥈 Silver | Threshold – 7.9 | Good quality. Kept if above threshold. |
| ❌ Discarded | Below threshold | Poor quality. Filtered out. |

Default threshold: **7.0** (configurable in Settings)

---

## The 6-Axis Rubric

### 1. Specificity (0–10)
Is the content detailed, precise, and substantive?

| Score | Description |
|-------|-------------|
| 9–10 | Highly specific — names, numbers, technical details, exact procedures |
| 7–8 | Moderately specific — clear details without being generic |
| 5–6 | Somewhat generic but still useful |
| 1–4 | Vague statements that apply to anything |
| 0 | Empty or nonsensical |

**Example HIGH (9):** "To install PyTorch 2.0 on Ubuntu 22.04 with CUDA 11.8, run: `pip install torch==2.0.0+cu118 --index-url https://download.pytorch.org/whl/cu118`"

**Example LOW (3):** "PyTorch can be installed using pip."

---

### 2. Clarity (0–10)
Is the content easy to understand? Is it grammatically correct and well-structured?

| Score | Description |
|-------|-------------|
| 9–10 | Crystal clear. A beginner could understand it. Well-structured with paragraphs or lists. |
| 7–8 | Clear with minor ambiguity or occasional jargon |
| 5–6 | Understandable but poorly organized or overly dense |
| 1–4 | Confusing, heavily jargon-laden, or grammatically broken |
| 0 | Incomprehensible |

---

### 3. Completeness (0–10)
Does the response fully answer the instruction? Are there important missing parts?

| Score | Description |
|-------|-------------|
| 9–10 | Comprehensive answer. Covers all aspects of the question. Includes edge cases. |
| 7–8 | Answers the main question but misses minor details |
| 5–6 | Partially answers but leaves major gaps |
| 1–4 | Barely touches the question |
| 0 | Does not answer the instruction at all |

---

### 4. Difficulty (0–10)
Is the instruction appropriately challenging for training? Trivial Q&A trains weak models.

| Score | Description |
|-------|-------------|
| 9–10 | Complex, multi-step reasoning required. Expert-level content. |
| 7–8 | Requires domain knowledge or multiple reasoning steps |
| 5–6 | Moderate — a typical user question |
| 1–4 | Very simple — "What is 2+2?" type questions |
| 0 | Not a real question or instruction |

---

### 5. Uniqueness (0–10)
Is this content novel, or is it a duplicate/near-duplicate of other rows?

| Score | Description |
|-------|-------------|
| 9–10 | Unique content not seen elsewhere in the dataset |
| 7–8 | Mostly unique with minor overlap |
| 5–6 | Similar to existing content but not exact |
| 1–4 | Near-duplicate of another row |
| 0 | Exact duplicate |

*Note: Uniqueness is computed using n-gram Jaccard similarity against previously processed rows.*

---

### 6. Domain Relevance (0–10)
Is the content actually relevant to the target use-case or domain?

| Score | Description |
|-------|-------------|
| 9–10 | Directly and clearly relevant to the specified domain |
| 7–8 | Mostly relevant with minor off-topic content |
| 5–6 | Tangentially relevant |
| 1–4 | Off-topic for the intended use-case |
| 0 | Completely irrelevant |

---

## Composite Score Formula

```
composite_score = (
    specificity × 0.20 +
    clarity      × 0.20 +
    completeness × 0.20 +
    difficulty   × 0.15 +
    uniqueness   × 0.10 +
    domain_relevance × 0.15
)
```

---

## Scoring Judges

| Judge | Method | Accuracy | Speed | Cost |
|-------|--------|----------|-------|------|
| **Heuristic** | Rule-based (length, n-gram, regex) | 70% | Instant | Free |
| **Ollama** | Local LLM prompt evaluation | 85% | 1-3s/row | Free |
| **Gemini Flash** | Gemini 2.0 Flash prompt evaluation | 92% | 0.3s/row | ~$0.001/row |

### Gemini Scoring Prompt

```
You are a data quality judge for LLM fine-tuning datasets.

Rate this instruction/response pair on these 6 axes (0-10 each):
1. Specificity: Is it detailed and precise?
2. Clarity: Is it clear and well-written?
3. Completeness: Does the response fully answer the instruction?
4. Difficulty: Is it appropriately challenging?
5. Uniqueness: Is it novel (not generic boilerplate)?
6. Domain Relevance: Is it relevant to AI/ML training?

Instruction: {instruction}
Response: {response}

Respond ONLY with a JSON object:
{"specificity": 8, "clarity": 9, "completeness": 7, "difficulty": 6, "uniqueness": 8, "domain_relevance": 9}
```

---

## Adjusting the Threshold

In the Settings page, you can set the minimum threshold. Guidelines:

| Threshold | Effect |
|-----------|--------|
| 9.0+ | Extreme filtering — only the very best rows. Very small datasets. |
| 8.0 | High quality — suitable for production fine-tuning. |
| **7.0** | **Default — good balance of quality and quantity.** |
| 6.0 | More permissive — larger datasets but lower quality. |
| 5.0 | Minimal filtering — use only if data is already clean. |

---

## DNA Fingerprinting

Hypasia can embed an invisible watermark into your dataset to prove provenance if it's stolen.

How it works:
1. Each row's response is slightly perturbed using homoglyphs (visually identical Unicode characters)
2. The perturbation pattern encodes your `owner_id` + a hash of the `secret_salt`
3. To verify ownership, run the detector on any dataset — it will identify your fingerprint even if rows are shuffled or partially modified

Enable in **Settings → Dataset DNA Fingerprint**.
