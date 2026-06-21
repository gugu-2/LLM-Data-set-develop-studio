"""
Hypasia AI — Visual Prompt Engineering Studio Backend
Executes node-based prompt chains securely and robustly.
"""
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

class Node(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]

class Edge(BaseModel):
    id: str
    source: str
    target: str

class PromptGraphRequest(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    sample_vars: Dict[str, str] = Field(default_factory=dict)

class GraphResolver:
    """Robust Topological Sort and Execution Engine for Prompt Graphs"""
    def __init__(self, nodes: List[Node], edges: List[Edge], sample_vars: Dict[str, str]):
        self.nodes = {n.id: n for n in nodes}
        self.edges = edges
        self.sample_vars = sample_vars
        
        # Build adjacency lists
        self.adj = {n.id: [] for n in nodes}
        self.in_degree = {n.id: 0 for n in nodes}
        
        for e in edges:
            if e.source in self.adj and e.target in self.in_degree:
                self.adj[e.source].append(e.target)
                self.in_degree[e.target] += 1
                
    def sort(self) -> List[Node]:
        """Kahn's algorithm for topological sorting."""
        queue = [n_id for n_id, deg in self.in_degree.items() if deg == 0]
        sorted_nodes = []
        visited_count = 0
        
        while queue:
            curr_id = queue.pop(0)
            sorted_nodes.append(self.nodes[curr_id])
            visited_count += 1
            
            for neighbor in self.adj[curr_id]:
                self.in_degree[neighbor] -= 1
                if self.in_degree[neighbor] == 0:
                    queue.append(neighbor)
                    
        if visited_count != len(self.nodes):
            raise ValueError("Cycle detected in prompt graph. Cannot resolve.")
            
        return sorted_nodes

    def execute(self) -> Dict[str, str]:
        """Resolves the prompt text by evaluating nodes in topological order."""
        sorted_nodes = self.sort()
        
        # Store outputs of each node
        node_outputs = {}
        final_prompt_parts = []
        
        for node in sorted_nodes:
            output = ""
            
            if node.type == "systemNode":
                content = node.data.get("content", "")
                output = f"System: {content}\n"
                final_prompt_parts.append(output)
                
            elif node.type == "variableNode":
                var_name = node.data.get("name", "var")
                var_value = self.sample_vars.get(var_name, f"[{var_name}]")
                output = f"<{var_name}>\n{var_value}\n</{var_name}>\n"
                final_prompt_parts.append(output)
                
            elif node.type == "fewShotNode":
                q = node.data.get("question", "")
                a = node.data.get("answer", "")
                output = f"Example Q: {q}\nExample A: {a}\n"
                final_prompt_parts.append(output)
                
            elif node.type == "userQueryNode":
                query = node.data.get("query", "")
                output = f"User: {query}\n"
                final_prompt_parts.append(output)
                
            node_outputs[node.id] = output
            
        compiled_prompt = "\n".join(final_prompt_parts).strip()
        return compiled_prompt


@router.post("/prompt/test")
async def test_prompt_chain(req: PromptGraphRequest):
    """Compiles the prompt graph and runs a simulated LLM test."""
    try:
        resolver = GraphResolver(req.nodes, req.edges, req.sample_vars)
        compiled_prompt = resolver.execute()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph Execution Error: {str(e)}")

    if not compiled_prompt:
        raise HTTPException(status_code=400, detail="Graph resulted in an empty prompt.")

    # Simulate hitting a model with this compiled prompt
    await asyncio.sleep(1.5)
    
    # Generate mock output based on length to feel realistic
    mock_output = f"Simulated Response based on a {len(compiled_prompt)} character prompt. The pipeline executed successfully."
    
    return {
        "status": "ok",
        "compiled_prompt": compiled_prompt,
        "model_output": mock_output,
        "token_count": len(compiled_prompt.split())
    }
