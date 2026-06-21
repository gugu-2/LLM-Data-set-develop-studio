"""
Hypasia AI — Heuristic scorer.
Fast, API-free quality scoring using text analysis.
"""
from __future__ import annotations

import re
from hypasia.schema import HypasiaRow, ScoreBreakdown


def score_heuristic(row: HypasiaRow) -> ScoreBreakdown:
    """
    Score a single row heuristically (no API calls, very fast).
    Returns ScoreBreakdown with values 0–10 per axis.
    """
    instruction = row.instruction
    response = row.response
    combined = instruction + " " + response

    return ScoreBreakdown(
        specificity=_score_specificity(response),
        clarity=_score_clarity(instruction),
        completeness=_score_completeness(instruction, response),
        difficulty=_score_difficulty(combined),
        uniqueness=10.0,  # Will be updated by dedup module
        domain_relevance=5.0,  # Neutral until seed text provided
    )


def _score_specificity(text: str) -> float:
    """
    Specificity = detail density.
    Proxied by: numbers, proper nouns, technical terms, list items.
    """
    if not text:
        return 0.0

    words = text.split()
    if not words:
        return 0.0

    # Count signals
    number_count = len(re.findall(r'\b\d+\.?\d*\b', text))
    capitalized = sum(1 for w in words if w[0].isupper() and len(w) > 2)
    has_list = text.count('\n-') + text.count('\n•') + text.count('\n*')
    has_code = text.count('```') + text.count('`')
    long_words = sum(1 for w in words if len(w) > 7)
    sentence_count = max(len(re.split(r'[.!?]+', text)), 1)

    # Combine signals into 0–10
    density = (
        min(number_count / max(len(words), 1) * 50, 3.0) +
        min(capitalized / max(len(words), 1) * 20, 2.0) +
        min(has_list * 0.5, 2.0) +
        min(has_code * 1.0, 2.0) +
        min(long_words / max(len(words), 1) * 15, 1.0)
    )
    return min(density, 10.0)


def _score_clarity(instruction: str) -> float:
    """
    Clarity = how clearly the instruction specifies a task.
    Signals: question words, imperative verbs, specific keywords.
    """
    if not instruction:
        return 0.0

    text_lower = instruction.lower()
    score = 3.0  # Base

    # Question words
    if any(w in text_lower for w in ["what", "why", "how", "explain", "describe",
                                      "list", "compare", "define", "summarize"]):
        score += 2.5

    # Length check — too short = unclear
    words = instruction.split()
    if len(words) >= 5:
        score += 1.5
    if len(words) >= 10:
        score += 1.0
    if len(words) >= 20:
        score += 0.5

    # Ends with ?
    if instruction.strip().endswith("?"):
        score += 1.0

    # Has context keyword
    if any(w in text_lower for w in ["given", "context", "following", "below", "above"]):
        score += 0.5

    return min(score, 10.0)


def _score_completeness(instruction: str, response: str) -> float:
    """
    Completeness = does the response adequately address the instruction?
    Proxy: length ratio and sentence count.
    """
    if not response:
        return 0.0

    resp_words = len(response.split())
    inst_words = max(len(instruction.split()), 1)
    ratio = resp_words / inst_words

    if resp_words < 10:
        return 1.0
    elif resp_words < 20:
        return 3.0
    elif resp_words < 50:
        return 5.0
    elif resp_words < 100:
        return 6.5
    elif resp_words < 200:
        return 7.5
    elif resp_words < 500:
        return 8.5
    else:
        return min(9.0 + ratio * 0.1, 10.0)


def _score_difficulty(text: str) -> float:
    """
    Difficulty = inverse of Flesch reading ease.
    Higher score = harder / more complex text.
    """
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    words = text.split()
    syllables = sum(_count_syllables(w) for w in words)

    if not sentences or not words:
        return 5.0

    avg_sentence_length = len(words) / len(sentences)
    avg_syllables_per_word = syllables / max(len(words), 1)

    # Flesch Reading Ease (higher = easier)
    fre = 206.835 - 1.015 * avg_sentence_length - 84.6 * avg_syllables_per_word
    fre = max(0.0, min(100.0, fre))

    # Invert: easy text = low difficulty score, hard text = high difficulty score
    difficulty = (100.0 - fre) / 10.0
    return min(max(difficulty, 0.0), 10.0)


def _count_syllables(word: str) -> int:
    word = word.lower().strip(".,!?;:()[]")
    if not word:
        return 0
    vowels = "aeiouy"
    count = 0
    prev_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    if word.endswith("e") and count > 1:
        count -= 1
    return max(count, 1)
