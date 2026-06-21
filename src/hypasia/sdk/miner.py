import json
from hypasia.mining.crawler.web import fetch_page_text, crawl_source
from hypasia.schema import HypasiaRow

class Miner:
    """
    Hypasia SDK Miner.
    Extracts high-quality training datasets from the web or local documents programmatically.
    """
    @staticmethod
    def extract_web(url: str, depth: int = 1) -> list[HypasiaRow]:
        """
        Extracts content from a URL, stripping navbars and ads, 
        and converts it into instruction-response pairs.
        """
        print(f"⛏️ Mining {url} (Depth: {depth})...")
        rows = crawl_source(url, depth=depth)
        print(f"✅ Successfully extracted {len(rows)} high-quality training rows.")
        return rows
        
    @staticmethod
    def save_dataset(rows: list[HypasiaRow], filename: str = "dataset.jsonl"):
        """Saves the extracted rows to a JSONL format ready for fine-tuning."""
        with open(filename, 'w', encoding='utf-8') as f:
            for r in rows:
                f.write(r.model_dump_json() + "\\n")
        print(f"💾 Dataset saved to {filename}.")
