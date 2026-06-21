"""
Hypasia AI — Translation Augmentation.
Translates training pairs to other languages for multilingual fine-tuning.
Uses deep-translator (free, no API key needed) or googletrans as fallback.
"""
from __future__ import annotations

from typing import Optional

from hypasia.schema import HypasiaRow

_SUPPORTED_LANGS = {
    "es": "Spanish", "fr": "French", "de": "German",
    "zh-CN": "Chinese (Simplified)", "ar": "Arabic",
    "pt": "Portuguese", "ja": "Japanese", "ko": "Korean",
    "hi": "Hindi", "ru": "Russian",
}


def translate_rows(
    rows: list[HypasiaRow],
    target_langs: list[str] = ("es", "fr"),
    source_lang: str = "en",
) -> list[HypasiaRow]:
    """
    Translate rows into target languages.
    Returns new translated rows (originals not included).
    Each language doubles the dataset size.
    """
    translated = []
    translator = _get_translator()

    for lang in target_langs:
        lang_name = _SUPPORTED_LANGS.get(lang, lang)
        for row in rows:
            try:
                t_instr = translator(row.instruction, source_lang, lang)
                t_resp = translator(row.response[:1000], source_lang, lang)
                if not t_instr or not t_resp:
                    continue
                translated.append(HypasiaRow(
                    instruction=t_instr,
                    response=t_resp,
                    source=row.source + f"[translated:{lang}]",
                    source_type=row.source_type,
                    title=row.title,
                    language=lang,
                ))
            except Exception as e:
                print(f"[translate] {lang}: {e}")
                continue

    return translated


def _get_translator():
    """Returns a translate(text, src, dest) callable."""
    # Try deep-translator first
    try:
        from deep_translator import GoogleTranslator

        def _deep(text: str, src: str, dest: str) -> str:
            return GoogleTranslator(source=src, target=dest).translate(text)

        return _deep
    except ImportError:
        pass

    # Try googletrans
    try:
        from googletrans import Translator
        _gt = Translator()

        def _googletrans(text: str, src: str, dest: str) -> str:
            result = _gt.translate(text, src=src, dest=dest)
            return result.text

        return _googletrans
    except ImportError:
        pass

    # Raise informative error
    raise ImportError(
        "No translation library found. Install one:\n"
        "  pip install deep-translator\n"
        "  pip install googletrans==4.0.0-rc1"
    )
