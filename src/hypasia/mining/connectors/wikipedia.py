"""
Hypasia AI — Wikipedia Connector.
Fetches Wikipedia article text and converts to training pairs.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from hypasia.schema import HypasiaRow


def fetch_wikipedia(
    title: str,
    lang: str = "en",
    section_as_pairs: bool = True,
) -> list[HypasiaRow]:
    """
    Fetch a Wikipedia article and convert sections to training pairs.
    Uses the Wikipedia REST API — no auth needed.
    """
    try:
        import requests
    except ImportError:
        raise ImportError("requests not installed")

    # Fetch article via Wikipedia API
    url = f"https://{lang}.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "titles": title,
        "prop": "extracts",
        "explaintext": True,
        "exsectionformat": "plain",
        "format": "json",
    }
    resp = requests.get(url, params=params, timeout=15,
                        headers={"User-Agent": "HypasiaBot/1.0"})
    resp.raise_for_status()
    data = resp.json()

    pages = data.get("query", {}).get("pages", {})
    if not pages:
        return []

    page = next(iter(pages.values()))
    extract = page.get("extract", "")
    article_title = page.get("title", title)
    source = f"https://{lang}.wikipedia.org/wiki/{article_title.replace(' ', '_')}"

    if not extract:
        return []

    return _extract_pairs(extract, article_title, source)


def fetch_wikipedia_search(
    query: str,
    lang: str = "en",
    max_articles: int = 5,
) -> list[HypasiaRow]:
    """Search Wikipedia and fetch the top N results."""
    try:
        import requests
    except ImportError:
        raise ImportError("requests not installed")

    search_url = f"https://{lang}.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": max_articles,
        "format": "json",
    }
    resp = requests.get(search_url, params=params, timeout=15,
                        headers={"User-Agent": "HypasiaBot/1.0"})
    results = resp.json().get("query", {}).get("search", [])

    rows = []
    for result in results:
        try:
            rows.extend(fetch_wikipedia(result["title"], lang=lang))
        except Exception:
            continue
    return rows


def _extract_pairs(text: str, title: str, source: str) -> list[HypasiaRow]:
    """Split Wikipedia text into section-based instruction-response pairs."""
    rows = []
    sections = text.split("\n\n")
    current_heading = title

    for chunk in sections:
        chunk = chunk.strip()
        if not chunk or len(chunk) < 50:
            continue

        # Detect section headings (all-caps or "== Heading ==" style)
        lines = chunk.splitlines()
        if len(lines) == 1 and len(chunk) < 80:
            current_heading = chunk.strip("= ").strip()
            continue

        body = chunk
        instruction = f"Explain '{current_heading}' from the Wikipedia article on '{title}'."
        response = body

        rows.append(HypasiaRow(
            instruction=instruction,
            response=response,
            source=source,
            source_type="web",
            title=f"{title} — {current_heading}",
            raw_text=body,
            date_extracted=datetime.now(timezone.utc).isoformat(),
        ))

    return rows
