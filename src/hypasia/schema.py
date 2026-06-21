"""
Hypasia AI — Data schema definitions.
Every row flowing through the pipeline conforms to HypasiaRow.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone


@dataclass
class ScoreBreakdown:
    """Per-axis quality scores, each 0–10."""
    specificity: float = 0.0       # Detail density / named entity richness
    clarity: float = 0.0           # Instruction clarity
    completeness: float = 0.0      # Response completeness relative to instruction
    difficulty: float = 0.0        # Complexity / reading level
    uniqueness: float = 0.0        # Deduplication score (10 = unique)
    domain_relevance: float = 0.0  # Cosine sim to seed text (if provided)


@dataclass
class HypasiaRow:
    """
    Standard data row for the Hypasia AI pipeline.
    All miners, scorers, cleaners, and exporters use this schema.
    """
    # Core content
    instruction: str = ""
    response: str = ""

    # Provenance
    source: str = ""
    source_type: str = "unknown"   # web | file | hf | youtube | expert
    language: str = "unknown"

    # Quality
    score: float = 0.0
    tier: str = "unscored"         # gold | silver | rejected | unscored
    scores: ScoreBreakdown = field(default_factory=ScoreBreakdown)

    # Metadata
    title: str = ""
    tokens: int = 0
    date_extracted: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    pii_redacted: bool = False
    id: str = ""                   # SHA-256 of instruction+response

    # Raw text (optional, stripped at export)
    raw_text: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = self._compute_id()

    def _compute_id(self) -> str:
        content = (self.instruction + self.response).encode("utf-8")
        return hashlib.sha256(content).hexdigest()[:16]

    def recompute_id(self):
        self.id = self._compute_id()

    def to_dict(self, include_raw: bool = False) -> dict:
        d = asdict(self)
        if not include_raw:
            d.pop("raw_text", None)
        return d

    def to_export_dict(self) -> dict:
        """Clean dict ready for JSONL/Parquet export."""
        d = self.to_dict(include_raw=False)
        # Flatten scores
        d["score_specificity"] = d["scores"]["specificity"]
        d["score_clarity"] = d["scores"]["clarity"]
        d["score_completeness"] = d["scores"]["completeness"]
        d["score_difficulty"] = d["scores"]["difficulty"]
        d["score_uniqueness"] = d["scores"]["uniqueness"]
        d["score_domain_relevance"] = d["scores"]["domain_relevance"]
        d.pop("scores", None)
        return d

    @classmethod
    def from_dict(cls, d: dict) -> "HypasiaRow":
        scores_data = d.pop("scores", {})
        if isinstance(scores_data, dict):
            scores = ScoreBreakdown(**{
                k: v for k, v in scores_data.items()
                if k in ScoreBreakdown.__dataclass_fields__
            })
        else:
            scores = ScoreBreakdown()
        return cls(scores=scores, **{
            k: v for k, v in d.items()
            if k in cls.__dataclass_fields__ and k != "scores"
        })

    @classmethod
    def from_jsonl_line(cls, line: str) -> "HypasiaRow":
        return cls.from_dict(json.loads(line))

    def word_count(self) -> int:
        return len((self.instruction + " " + self.response).split())

    def char_count(self) -> int:
        return len(self.instruction) + len(self.response)

    def is_valid(self) -> bool:
        """Basic sanity check — must have at least an instruction."""
        return bool(self.instruction.strip())


# Tier thresholds
GOLD_THRESHOLD = 8.5
SILVER_THRESHOLD = 7.0   # Default — user configurable


def assign_tier(score: float, threshold: float = SILVER_THRESHOLD) -> str:
    if score >= GOLD_THRESHOLD:
        return "gold"
    elif score >= threshold:
        return "silver"
    else:
        return "rejected"
