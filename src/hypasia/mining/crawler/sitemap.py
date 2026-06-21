"""
Hypasia AI — Sitemap XML parser.
Extracts <loc> URLs from sitemaps, including sitemap index files.
"""
from __future__ import annotations

import requests
from bs4 import BeautifulSoup

_HEADERS = {"User-Agent": "HypasiaBot/1.0"}


def extract_sitemap_urls(sitemap_url: str, max_urls: int = 5000) -> list[str]:
    """Parse a sitemap or sitemap index and return all page URLs."""
    try:
        resp = requests.get(sitemap_url, headers=_HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"[sitemap] Failed to fetch {sitemap_url}: {e}")
        return []

    soup = BeautifulSoup(resp.content, "xml")
    urls: list[str] = []

    # Sitemap index — recurse
    for sitemap in soup.find_all("sitemap"):
        loc = sitemap.find("loc")
        if loc and len(urls) < max_urls:
            urls.extend(extract_sitemap_urls(loc.text.strip(), max_urls - len(urls)))

    # Regular sitemap
    for url_tag in soup.find_all("url"):
        loc = url_tag.find("loc")
        if loc:
            urls.append(loc.text.strip())
            if len(urls) >= max_urls:
                break

    return urls
