"""
Hypasia AI — PII Scrubber.
Uses Microsoft Presidio (if available) with a regex fallback.
Redacts emails, phone numbers, SSNs, credit cards, names, IPs.
"""
from __future__ import annotations

import re
from hypasia.schema import HypasiaRow


_PATTERNS = {
    "EMAIL":   r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "PHONE":   r'\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b',
    "SSN":     r'\b\d{3}-\d{2}-\d{4}\b',
    "CREDIT_CARD": r'\b(?:\d{4}[\s-]?){3}\d{4}\b',
    "IP":      r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
    "URL":     r'https?://[^\s<>"{}|\\^`\[\]]+',
}


def scrub_pii(text: str, placeholder: str = "[REDACTED]") -> tuple[str, list[str]]:
    """
    Scrub PII from text. Returns (cleaned_text, list_of_entity_types_found).
    Tries Presidio first, falls back to regex patterns.
    """
    found_types: list[str] = []

    # Try Presidio
    try:
        from presidio_analyzer import AnalyzerEngine
        from presidio_anonymizer import AnonymizerEngine
        from presidio_anonymizer.entities import OperatorConfig

        analyzer = AnalyzerEngine()
        anonymizer = AnonymizerEngine()

        results = analyzer.analyze(text=text, language="en")
        found_types = list({r.entity_type for r in results})

        if results:
            anonymized = anonymizer.anonymize(
                text=text,
                analyzer_results=results,
                operators={"DEFAULT": OperatorConfig("replace", {"new_value": placeholder})},
            )
            return anonymized.text, found_types
    except ImportError:
        pass  # Presidio not installed — use regex fallback
    except Exception:
        pass

    # Regex fallback
    cleaned = text
    for entity_type, pattern in _PATTERNS.items():
        matches = re.findall(pattern, cleaned)
        if matches:
            found_types.append(entity_type)
            cleaned = re.sub(pattern, placeholder, cleaned)

    return cleaned, list(set(found_types))


def scrub_rows(
    rows: list[HypasiaRow],
    progress=None,
    task_id=None,
) -> list[HypasiaRow]:
    """Scrub PII from all rows in place. Marks pii_redacted=True if any found."""
    for row in rows:
        instr_clean, instr_types = scrub_pii(row.instruction)
        resp_clean, resp_types = scrub_pii(row.response)
        row.instruction = instr_clean
        row.response = resp_clean
        if instr_types or resp_types:
            row.pii_redacted = True
            row.recompute_id()
        if progress and task_id is not None:
            progress.advance(task_id, 1)
    return rows
