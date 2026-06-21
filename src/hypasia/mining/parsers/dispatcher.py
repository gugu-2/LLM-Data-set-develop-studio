"""
Hypasia AI — File parser dispatcher.
Routes any file to the correct parser based on extension.
"""
from __future__ import annotations

from pathlib import Path

from hypasia.schema import HypasiaRow

_EXTENSION_MAP = {
    ".pdf":     "pdf",
    ".docx":    "docx",
    ".doc":     "docx",
    ".txt":     "text",
    ".md":      "text",
    ".html":    "text",
    ".htm":     "text",
    ".epub":    "text",
    ".csv":     "tabular",
    ".tsv":     "tabular",
    ".xlsx":    "tabular",
    ".xls":     "tabular",
    ".json":    "tabular",
    ".jsonl":   "tabular",
    ".parquet": "tabular",
    ".png":     "image",
    ".jpg":     "image",
    ".jpeg":    "image",
    ".webp":    "image",
}


def parse_file(path: Path, api_key: str = None) -> list[HypasiaRow]:
    """
    Auto-detect file type and parse into HypasiaRow list.
    Supports: PDF, DOCX, TXT, MD, HTML, EPUB, CSV, Excel, JSON, JSONL, Parquet, Images.
    """
    ext = path.suffix.lower()
    parser_type = _EXTENSION_MAP.get(ext)

    if parser_type is None:
        raise ValueError(
            f"Unsupported file type: {ext}. "
            f"Supported: {', '.join(_EXTENSION_MAP.keys())}"
        )

    if parser_type == "pdf":
        from hypasia.mining.parsers.pdf import parse_pdf
        return parse_pdf(path)
    elif parser_type == "docx":
        from hypasia.mining.parsers.docx import parse_docx
        return parse_docx(path)
    elif parser_type == "text":
        from hypasia.mining.parsers.text import parse_text
        return parse_text(path)
    elif parser_type == "tabular":
        from hypasia.mining.parsers.tabular import parse_tabular
        return parse_tabular(path)
    elif parser_type == "image":
        from hypasia.mining.parsers.image import parse_image
        return parse_image(path, api_key=api_key)
    else:
        raise ValueError(f"Unknown parser type: {parser_type}")
