"""
Tests for the Hypasia AI quality scorer.
"""
import pytest
from hypasia.schema import HypasiaRow, ScoreBreakdown
from hypasia.scorer.heuristic import score_heuristic
from hypasia.scorer.composite import compute_composite, score_rows


@pytest.fixture
def good_row():
    return HypasiaRow(
        instruction="Explain the difference between supervised and unsupervised learning in machine learning.",
        response=(
            "Supervised learning uses labeled training data where each example has an input "
            "and a known correct output. The model learns a mapping function from inputs to "
            "outputs. Examples include linear regression (predicting house prices: $350,000 "
            "given 3 beds, 2 baths, 1,500 sq ft) and neural networks for image classification.\n\n"
            "Unsupervised learning works with unlabeled data, finding hidden patterns or "
            "intrinsic structures. Common techniques: K-means clustering (grouping customers "
            "by purchase behavior), PCA (dimensionality reduction), and autoencoders.\n\n"
            "Key difference: supervised requires human-labeled data (expensive, time-consuming) "
            "but achieves higher accuracy on specific tasks. Unsupervised scales better but "
            "results are harder to interpret."
        ),
        source="https://example.com/ml-guide",
    )


@pytest.fixture
def bad_row():
    return HypasiaRow(
        instruction="hi",
        response="ok",
        source="test",
    )


def test_heuristic_scores_good_row(good_row):
    scores = score_heuristic(good_row)
    assert isinstance(scores, ScoreBreakdown)
    assert scores.specificity > 4.0, "Good row should have decent specificity"
    assert scores.completeness > 5.0, "Long response = high completeness"
    assert scores.clarity > 4.0, "Clear instruction keyword 'explain'"


def test_heuristic_scores_bad_row(bad_row):
    scores = score_heuristic(bad_row)
    assert scores.completeness < 5.0, "Very short response = low completeness"


def test_composite_score_range(good_row):
    good_row.scores = score_heuristic(good_row)
    composite = compute_composite(good_row.scores)
    assert 0.0 <= composite <= 10.0


def test_score_rows_heuristic(good_row, bad_row):
    rows = [good_row, bad_row]
    result = score_rows(rows, judge="heuristic", threshold=7.0)
    for row in result:
        assert row.score >= 0.0
        assert row.tier in ("gold", "silver", "rejected")


def test_tier_assignment(good_row):
    good_row.scores = ScoreBreakdown(
        specificity=9.0, clarity=9.0, completeness=9.0,
        difficulty=9.0, uniqueness=9.0, domain_relevance=9.0
    )
    good_row.score = compute_composite(good_row.scores)
    from hypasia.schema import assign_tier
    assert assign_tier(good_row.score) == "gold"
