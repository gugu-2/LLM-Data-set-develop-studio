"""
Hypasia AI — Web Crawler.
Uses trafilatura for fast, boilerplate-free text extraction.
Optional Playwright support for JS-rendered pages.
"""
from __future__ import annotations

import time
from collections import deque
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from hypasia.schema import HypasiaRow
from hypasia.mining.crawler.sitemap import extract_sitemap_urls

try:
    import trafilatura
    from trafilatura.settings import use_config
    HAS_TRAFILATURA = True
except ImportError:
    HAS_TRAFILATURA = False


_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; HypasiaBot/1.0; "
        "+https://hypasia.ai/bot)"
    )
}


def fetch_page_text(url: str, use_playwright: bool = False) -> Optional[dict]:
    """
    Fetch a single page and extract clean text.
    Returns dict with {url, text, title} or None on failure.
    """
    if use_playwright:
        return _fetch_with_playwright(url)
    return _fetch_with_trafilatura(url)


def _fetch_with_trafilatura(url: str) -> Optional[dict]:
    if not HAS_TRAFILATURA:
        raise ImportError("trafilatura not installed: pip install trafilatura")
    try:
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return None
        text = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=True,
            no_fallback=False,
            favor_precision=True,
        )
        if not text or len(text.strip()) < 50:
            return None
        metadata = trafilatura.extract_metadata(downloaded)
        title = metadata.title if metadata and metadata.title else url
        return {"url": url, "text": text.strip(), "title": title}
    except Exception:
        return None


def _fetch_with_playwright(url: str) -> Optional[dict]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise ImportError(
            "Playwright not installed. Run: pip install hypasia-ai[js] "
            "then: playwright install chromium"
        )
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=30000, wait_until="networkidle")
        html = page.content()
        browser.close()

    if HAS_TRAFILATURA:
        text = trafilatura.extract(html, favor_precision=True)
    else:
        soup = BeautifulSoup(html, "lxml")
        text = soup.get_text(separator="\n")

    if not text or len(text.strip()) < 50:
        return None
    soup2 = BeautifulSoup(html, "lxml")
    title = soup2.title.string if soup2.title else url
    return {"url": url, "text": text.strip(), "title": title}


def _get_links(html: str, base_url: str) -> list[str]:
    """Extract same-domain links from a page."""
    base_domain = urlparse(base_url).netloc
    soup = BeautifulSoup(html, "lxml")
    links = []
    for a in soup.find_all("a", href=True):
        href = urljoin(base_url, a["href"])
        parsed = urlparse(href)
        if parsed.netloc == base_domain and parsed.scheme in ("http", "https"):
            # Strip fragments
            clean = href.split("#")[0]
            if clean not in links:
                links.append(clean)
    return links


def crawl_source(
    url: str,
    depth: int = 2,
    use_playwright: bool = False,
    delay: float = 0.5,
) -> list[HypasiaRow]:
    """
    Entry point: given a URL, decide whether to crawl, sitemap-mine, or single fetch.
    Returns list of HypasiaRow objects.
    """
    if "sitemap" in url.lower() or url.endswith(".xml"):
        return crawl_sitemap(url, use_playwright=use_playwright)
    elif depth > 1:
        return crawl_bfs(url, depth=depth, use_playwright=use_playwright, delay=delay)
    else:
        result = fetch_page_text(url, use_playwright=use_playwright)
        if result:
            return _make_rows(result)
        return []


def crawl_bfs(
    start_url: str,
    depth: int = 2,
    use_playwright: bool = False,
    max_pages: int = 200,
    delay: float = 0.5,
) -> list[HypasiaRow]:
    """BFS crawler — follows links up to `depth` levels."""
    visited: set[str] = set()
    queue: deque[tuple[str, int]] = deque([(start_url, 0)])
    rows: list[HypasiaRow] = []

    while queue and len(visited) < max_pages:
        url, level = queue.popleft()
        if url in visited:
            continue
        visited.add(url)

        try:
            # Fetch raw HTML for link extraction
            resp = requests.get(url, headers=_HEADERS, timeout=15)
            html = resp.text
        except Exception:
            continue

        result = fetch_page_text(url, use_playwright=use_playwright)
        if result:
            rows.extend(_make_rows(result))

        if level < depth:
            for link in _get_links(html, url):
                if link not in visited:
                    queue.append((link, level + 1))

        time.sleep(delay)

    return rows


def crawl_sitemap(sitemap_url: str, use_playwright: bool = False) -> list[HypasiaRow]:
    """Mine all URLs listed in a sitemap.xml."""
    urls = extract_sitemap_urls(sitemap_url)
    rows: list[HypasiaRow] = []
    for url in urls:
        result = fetch_page_text(url, use_playwright=use_playwright)
        if result:
            rows.extend(_make_rows(result))
        time.sleep(0.3)
    return rows


_CHUNK_WORDS = 250   # Target words per training row
_CHUNK_MIN   = 60    # Discard chunks smaller than this


def _make_rows(page: dict) -> list[HypasiaRow]:
    """
    Convert a fetched page into one or more HypasiaRow objects.
    Long pages are chunked into ~250-word instruction-response pairs
    so each row fits comfortably in a model's context window.
    """
    text = page["text"]
    url = page["url"]
    title = page.get("title", url)
    date = datetime.now(timezone.utc).isoformat()

    # Split into paragraphs — trafilatura sometimes uses \n, sometimes \n\n
    raw_paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    if not raw_paragraphs:
        raw_paragraphs = [text]

    # If a "paragraph" is itself huge, split it into word chunks
    paragraphs: list[str] = []
    for para in raw_paragraphs:
        words = para.split()
        if len(words) <= _CHUNK_WORDS * 2:
            paragraphs.append(para)
        else:
            # Word-level chunk the giant paragraph
            for i in range(0, len(words), _CHUNK_WORDS):
                sub = " ".join(words[i: i + _CHUNK_WORDS])
                if sub:
                    paragraphs.append(sub)

    # Accumulate paragraphs into chunks of ~_CHUNK_WORDS words
    chunks: list[str] = []
    current: list[str] = []
    current_words = 0

    for para in paragraphs:
        para_words = len(para.split())
        if current_words + para_words > _CHUNK_WORDS and current:
            chunks.append(" ".join(current))
            current = [para]
            current_words = para_words
        else:
            current.append(para)
            current_words += para_words

    if current:
        chunks.append(" ".join(current))

    rows: list[HypasiaRow] = []
    for i, chunk in enumerate(chunks):
        if len(chunk.split()) < _CHUNK_MIN:
            continue

        # Build instruction from first sentence of chunk
        sentences = [s.strip() for s in chunk.split(".") if len(s.strip()) > 15]
        if len(sentences) >= 2:
            instruction = sentences[0].strip() + "."
            response = ". ".join(sentences[1:]).strip()
        else:
            instruction = f"Explain the following excerpt from '{title}':"
            response = chunk

        if not response.strip():
            continue

        rows.append(HypasiaRow(
            instruction=instruction,
            response=response,
            source=url + (f"#chunk-{i}" if len(chunks) > 1 else ""),
            source_type="web",
            title=title,
            raw_text=chunk,
            date_extracted=date,
        ))

    return rows if rows else []


# Keep backward-compatible single-row function for callers that need it
def _make_row(page: dict) -> HypasiaRow:
    rows = _make_rows(page)
    return rows[0] if rows else HypasiaRow(
        instruction=f"Summarize: {page.get('title', page['url'])}",
        response=page["text"],
        source=page["url"],
        source_type="web",
    )
