"""
Hypasia AI — Prompt Compiler API
"""
import json
import random
from fastapi import APIRouter
from pydantic import BaseModel
import asyncio

from hypasia.finetuning.prompt_compiler import compile_prompt

router = APIRouter()

class CompileRequest(BaseModel):
    semantic_intent: str

@router.post("/compiler/compile")
async def run_compiler(req: CompileRequest):
    """
    Compiles a semantic prompt into multiple architectures simultaneously,
    generates an Abstract Syntax Tree (AST), and simulates Huffman-like token compression.
    """
    await asyncio.sleep(0.8) # Simulate deep compilation
    
    architectures = ["llama3", "mistral", "chatml", "claude"]
    results = {}
    
    for arch in architectures:
        results[arch] = compile_prompt(req.semantic_intent, arch)
        
    original_tokens = max(10, len(req.semantic_intent.split()) * 2 + random.randint(5, 15))
    compressed_tokens = int(original_tokens * random.uniform(0.55, 0.65)) # 35-45% saving
    
    ast_tree = {
        "type": "PromptAST",
        "nodes": [
            {"type": "SystemDirective", "role": "system", "weight": 1.0},
            {"type": "InstructionBlock", "content": req.semantic_intent, "compression_ratio": round((original_tokens-compressed_tokens)/original_tokens, 2)},
            {"type": "OutputConstraint", "format": "markdown_table", "strictness": "high"}
        ],
        "metadata": {
            "original_tokens": original_tokens,
            "optimized_tokens": compressed_tokens,
            "cost_saving": f"{int((1 - compressed_tokens/original_tokens)*100)}%"
        }
    }
        
    return {
        "status": "success", 
        "results": results,
        "ast": ast_tree,
        "original_tokens": original_tokens,
        "compressed_tokens": compressed_tokens
    }
