"""
Tests for the Hypasia AI exporter.
"""
import json

import pytest

from hypasia.schema import HypasiaRow, ScoreBreakdown
from hypasia.exporter.jsonl import export_jsonl, load_jsonl
from hypasia.exporter.parquet import export_parquet, load_parquet


@pytest.fixture
def sample_rows():
    rows = []
    for i in range(5):
        row = HypasiaRow(
            instruction=f"What is concept {i}?",
            response=f"Concept {i} is about topic {i} with details.",
            source=f"https://example.com/{i}",
            source_type="web",
            language="en",
            score=7.0 + i * 0.3,
            tier="silver",
            scores=ScoreBreakdown(
                specificity=7.0, clarity=8.0, completeness=7.5,
                difficulty=6.0, uniqueness=9.0, domain_relevance=6.5,
            ),
        )
        rows.append(row)
    return rows


def test_export_and_reload_jsonl(sample_rows, tmp_path):
    out = tmp_path / "test.jsonl"
    export_jsonl(sample_rows, out)
    assert out.exists()
    loaded = load_jsonl(out)
    assert len(loaded) == len(sample_rows)
    assert loaded[0].instruction == sample_rows[0].instruction
    assert loaded[0].response == sample_rows[0].response


def test_jsonl_scores_preserved(sample_rows, tmp_path):
    out = tmp_path / "test.jsonl"
    export_jsonl(sample_rows, out)
    loaded = load_jsonl(out)
    assert abs(loaded[0].scores.specificity - 7.0) < 0.01


def test_export_and_reload_parquet(sample_rows, tmp_path):
    out = tmp_path / "test.parquet"
    export_parquet(sample_rows, out)
    assert out.exists()
    loaded = load_parquet(out)
    assert len(loaded) == len(sample_rows)


def test_alpaca_format(sample_rows, tmp_path):
    out = tmp_path / "alpaca.jsonl"
    export_jsonl(sample_rows, out, alpaca_format=True)
    with open(out) as f:
        first_line = json.loads(f.readline())
    assert "instruction" in first_line
    assert "output" in first_line
    assert "input" in first_line
    assert "score" not in first_line
