"""
Hypasia AI — Cryptographic IP Washer & Provenance Ledger
"""
import hashlib
import json
from typing import List, Dict

def generate_provenance_hash(instruction: str, response: str, source: str) -> str:
    """Generates a cryptographic SHA-256 hash for a specific piece of data."""
    payload = f"{instruction}|{response}|{source}".encode('utf-8')
    return hashlib.sha256(payload).hexdigest()

def scan_and_wash(rows: List[Dict]) -> Dict:
    """
    Scans rows for 'copyrighted' material (simulated) and washes it by
    rewriting the content to be legally safe but semantically identical.
    """
    washed_rows = []
    flags_found = 0
    
    # Simulate known copyrighted keywords/phrases
    copyright_triggers = ["New York Times", "GPL", "proprietary", "confidential", "all rights reserved"]
    
    for r in rows:
        instruction = r.get("instruction", "")
        response = r.get("response", "")
        source = r.get("source", "unknown")
        
        is_tainted = False
        for trigger in copyright_triggers:
            if trigger.lower() in instruction.lower() or trigger.lower() in response.lower():
                is_tainted = True
                break
                
        row_hash = generate_provenance_hash(instruction, response, source)
        
        if is_tainted:
            flags_found += 1
            # Simulate LLM rewriting the text to be synthetic/clean
            washed_rows.append({
                "hash": row_hash,
                "original_instruction": instruction,
                "original_response": response,
                "instruction": f"[SYNTHESIZED] {instruction.replace('New York Times', 'News Outlet').replace('GPL', 'Open License')}",
                "response": f"[WASHED] The underlying semantic meaning has been extracted and rewritten by Hypasia AI to remove legal IP constraints.",
                "source": "synthetic_washer",
                "status": "washed"
            })
        else:
            washed_rows.append({
                "hash": row_hash,
                "instruction": instruction,
                "response": response,
                "source": source,
                "status": "clean"
            })
            
    return {
        "flags_found": flags_found,
        "total_rows": len(rows),
        "results": washed_rows
    }
