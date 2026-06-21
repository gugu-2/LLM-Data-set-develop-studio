import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Network, Loader, Play } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function KnowledgeGraph() {
  const [text, setText] = useState("Hypasia Studio automates Fine-Tuning. Fine-Tuning requires LLMs and is optimized by LoRA. LLMs are powered by Transformers, which evolved from Neural Networks used in Deep Learning (a subset of AI). Knowledge Graphs enhance AI and are extracted by Hypasia Studio.");
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const canvasRef = useRef(null);

  const handleExtract = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/graph/extract`, { text });
      setGraphData(res.data);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Simple 2D physics simulation for graph rendering (avoids WebGL dependencies)
  useEffect(() => {
    if (!graphData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    // Initialize node positions randomly
    const nodes = graphData.nodes.map(n => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
      vx: 0, vy: 0
    }));
    
    const edges = graphData.edges.map(e => ({
      source: nodes.find(n => n.id === e.source),
      target: nodes.find(n => n.id === e.target),
      label: e.label
    }));

    let animationFrameId;

    const render = () => {
      // Very basic force-directed layout
      const center = { x: width/2, y: height/2 };
      
      nodes.forEach(n => {
        // Gravity towards center
        n.vx += (center.x - n.x) * 0.001;
        n.vy += (center.y - n.y) * 0.001;
        
        // Repulsion
        nodes.forEach(n2 => {
          if (n !== n2) {
            const dx = n.x - n2.x;
            const dy = n.y - n2.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 150 && dist > 0) {
              const force = (150 - dist) * 0.002;
              n.vx += (dx / dist) * force;
              n.vy += (dy / dist) * force;
            }
          }
        });
      });
      
      // Attraction along edges
      edges.forEach(e => {
        if (!e.source || !e.target) return;
        const dx = e.target.x - e.source.x;
        const dy = e.target.y - e.source.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const force = (dist - 100) * 0.005;
        e.source.vx += (dx / dist) * force;
        e.source.vy += (dy / dist) * force;
        e.target.vx -= (dx / dist) * force;
        e.target.vy -= (dy / dist) * force;
      });
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw edges
      edges.forEach(e => {
        if (!e.source || !e.target) return;
        ctx.beginPath();
        ctx.moveTo(e.source.x, e.source.y);
        ctx.lineTo(e.target.x, e.target.y);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label
        const mx = (e.source.x + e.target.x) / 2;
        const my = (e.source.y + e.target.y) / 2;
        ctx.fillStyle = 'var(--charcoal)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(e.label, mx, my - 5);
      });
      
      // Update pos and draw nodes
      nodes.forEach(n => {
        n.vx *= 0.9; // friction
        n.vy *= 0.9;
        n.x += n.vx;
        n.y += n.vy;
        
        ctx.beginPath();
        ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = n.group === 1 ? '#ea2804' : n.group === 2 ? '#3b82f6' : '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'var(--ink)';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(n.id, n.x, n.y + 20);
      });
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [graphData]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h1 className="display-font" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Network color="var(--primary)" /> GraphRAG Extractor
      </h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Extract entities and relationships from unstructured text to build Knowledge Graphs.
      </p>

      <div className="grid grid-cols-3 gap-4" style={{ flex: 1, minHeight: 0 }}>
        {/* Left: Input */}
        <div className="surface-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Raw Text Source</h2>
          <textarea 
            className="input-field" 
            style={{ flex: 1, resize: 'none', marginBottom: '1rem' }} 
            value={text} 
            onChange={e => setText(e.target.value)} 
          />
          <button className="btn btn-primary" onClick={handleExtract} disabled={loading}>
            {loading ? <><Loader className="spin" size={18} /> Extracting Entities...</> : <><Play size={18} /> Extract Graph</>}
          </button>
        </div>

        {/* Right: Visualization */}
        <div className="surface-card" style={{ gridColumn: 'span 2', position: 'relative', overflow: 'hidden', padding: 0 }}>
          {!graphData && !loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)' }}>
              Run extraction to visualize graph.
            </div>
          )}
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', background: 'rgba(255,255,255,0.8)', zIndex: 10 }}>
              <Loader className="spin" size={32} />
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', display: graphData ? 'block' : 'none' }} 
          />
        </div>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
