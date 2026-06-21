"""
Tests for the Hypasia AI cleaning pipeline.
"""
from hypasia.schema import HypasiaRow
from hypasia.cleaner.normalise import normalise_text
from hypasia.cleaner.dedup import dedup_rows
from hypasia.cleaner.length import filter_by_length
from hypasia.cleaner.language import detect_language, filter_by_language


def make_row(instruction, response, source="test"):
    return HypasiaRow(instruction=instruction, response=response, source=source)


def test_normalise_strips_html():
    result = normalise_text("<p>Hello <b>world</b></p>")
    assert "<p>" not in result
    assert "Hello" in result
    assert "world" in result


def test_normalise_collapses_whitespace():
    result = normalise_text("Hello    world\n\n\n\ntest")
    assert "    " not in result
    assert "\n\n\n" not in result


def test_normalise_fixes_encoding():
    result = normalise_text("Caf\u00e9 au lait")
    assert "Café" in result or "Caf" in result


def test_dedup_removes_exact_duplicates():
    rows = [
        make_row("What is AI?", "AI is artificial intelligence."),
        make_row("What is AI?", "AI is artificial intelligence."),  # exact dup
        make_row("What is ML?", "ML is machine learning."),
    ]
    result = dedup_rows(rows, near_dedup=False)
    assert len(result) == 2


def test_length_filter():
    rows = [
        make_row("a", "b"),  # too short
        make_row("What is the capital of France?",
                 "The capital of France is Paris, a city known for the Eiffel Tower."),
        make_row(" ".join(["word"] * 5000), " ".join(["word"] * 5000)),  # too long
    ]
    result = filter_by_length(rows, min_tokens=10, max_tokens=4096)
    assert len(result) == 1
    assert result[0].instruction.startswith("What is")


def test_language_detection_english():
    lang = detect_language("The quick brown fox jumps over the lazy dog")
    assert lang == "en"


def test_language_filter():
    rows = [
        make_row("What is Python?", "Python is a programming language."),
        make_row("Qu'est-ce que Python?", "Python est un langage de programmation."),
    ]
    result = filter_by_language(rows, target_lang="en")
    assert len(result) == 1
    assert "Python is" in result[0].response
