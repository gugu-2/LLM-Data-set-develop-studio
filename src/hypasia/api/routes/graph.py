"""
Hypasia AI — Knowledge Graph Extractor
Extracts nodes (entities) and edges (relations) from raw text datasets.
"""
import asyncio
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class GraphRequest(BaseModel):
    text: str

@router.post("/graph/extract")
async def extract_graph(req: GraphRequest):
    """
    Simulates using an LLM to extract a knowledge graph from text.
    Returns a list of nodes and edges.
    """
    await asyncio.sleep(2) # Simulate LLM processing time
    
    # In a real scenario, we'd prompt Gemini to output JSON with entities and relations.
    # For now, we return a highly connected mock graph for visualization.
    
    nodes = [
        {"id": "AI", "group": 1},
        {"id": "Deep Learning", "group": 1},
        {"id": "Neural Networks", "group": 1},
        {"id": "LLMs", "group": 2},
        {"id": "Transformers", "group": 2},
        {"id": "Attention Mechanism", "group": 2},
        {"id": "Fine-Tuning", "group": 3},
        {"id": "LoRA", "group": 3},
        {"id": "RLHF", "group": 3},
        {"id": "Hypasia Studio", "group": 4},
        {"id": "Knowledge Graphs", "group": 4}
    ]
    
    edges = [
        {"source": "AI", "target": "Deep Learning", "label": "includes"},
        {"source": "Deep Learning", "target": "Neural Networks", "label": "uses"},
        {"source": "Neural Networks", "target": "Transformers", "label": "evolved into"},
        {"source": "Transformers", "target": "LLMs", "label": "powers"},
        {"source": "Transformers", "target": "Attention Mechanism", "label": "relies on"},
        {"source": "LLMs", "target": "Fine-Tuning", "label": "requires"},
        {"source": "Fine-Tuning", "target": "LoRA", "label": "optimized by"},
        {"source": "Fine-Tuning", "target": "RLHF", "label": "aligned by"},
        {"source": "Hypasia Studio", "target": "Fine-Tuning", "label": "automates"},
        {"source": "Hypasia Studio", "target": "Knowledge Graphs", "label": "extracts"},
        {"source": "Knowledge Graphs", "target": "AI", "label": "enhances"}
    ]
    
    return {"status": "success", "nodes": nodes, "edges": edges}
