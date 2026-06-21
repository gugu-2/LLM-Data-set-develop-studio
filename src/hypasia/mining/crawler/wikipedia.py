"""
Hypasia AI — Wikipedia Active Learning Crawler.
Searches Wikipedia for failing topics and returns factual summaries as training rows.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from hypasia.schema import HypasiaRow

logger = logging.getLogger("hypasia.flywheel")

def fetch_wikipedia_search(query: str, max_results: int = 1) -> list[HypasiaRow]:
    """
    Searches Wikipedia for the query and returns HypasiaRow objects.
    Extracts the summary to act as the response.
    """
    try:
        import wikipedia
    except ImportError:
        logger.warning("wikipedia package not installed. Skipping Active Learning Loop.")
        return []

    rows = []
    # Strip common question words for better search
    stop_words = ["explain", "what", "is", "the", "how", "why", "who", "when", "where", "tell", "me", "about"]
    tokens = [t for t in query.lower().split() if t not in stop_words]
    search_query = " ".join(tokens) if tokens else query

    if len(search_query) < 3:
        return []

    try:
        search_results = wikipedia.search(search_query, results=max_results)
        for title in search_results:
            try:
                page = wikipedia.page(title, auto_suggest=False)
                summary = page.summary
                if len(summary) > 50:
                    rows.append(HypasiaRow(
                        instruction=f"Explain {title} in detail.",
                        response=summary.strip(),
                        source=page.url,
                        source_type="wikipedia_active_learning",
                        title=title,
                        raw_text=summary,
                        date_extracted=datetime.now(timezone.utc).isoformat(),
                    ))
            except wikipedia.exceptions.DisambiguationError as e:
                # Try the first disambiguation option
                if e.options:
                    try:
                        page = wikipedia.page(e.options[0], auto_suggest=False)
                        rows.append(HypasiaRow(
                            instruction=f"Explain {e.options[0]}.",
                            response=page.summary.strip(),
                            source=page.url,
                            source_type="wikipedia_active_learning",
                            title=e.options[0],
                            raw_text=page.summary,
                            date_extracted=datetime.now(timezone.utc).isoformat(),
                        ))
                    except Exception:
                        pass
            except Exception as inner_e:
                logger.debug(f"Wiki page error for {title}: {inner_e}")
    except Exception as e:
        logger.warning(f"Wikipedia search failed for '{search_query}': {e}")
        
    return rows
