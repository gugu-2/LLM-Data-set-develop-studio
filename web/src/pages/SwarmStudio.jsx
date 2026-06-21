import React, { useState } from 'react';
import { Users, Play, Loader, MessagesSquare } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function SwarmStudio() {
  const [topic, setTopic] = useState("Open Source vs Closed Source AGI");
  const [trace, setTrace] = useState([]);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    setTrace([]);
    
    try {
      const response = await fetch(`${API_BASE}/swarm/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, agents: ["The Optimist", "The Skeptic", "The Synthesizer"], rounds: 2 })
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setTrace(prev => [...prev, chunk]);
      }
    } catch (e) {
      setTrace(prev => [...prev, `\nError: ${e.message}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="display-font" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users color="var(--primary)" /> Swarm Studio
      </h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Coordinate multiple AI agents to debate complex topics and reach a consensus.
      </p>

      <div className="grid grid-cols-3 gap-4" style={{ height: '65vh' }}>
        {/* Left: Input */}
        <div className="surface-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2><MessagesSquare size={18} style={{ display: 'inline', marginRight: 8 }}/> Swarm Config</h2>
          
          <div className="mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
            <span style={{ padding: '4px 8px', background: '#3b82f633', color: '#3b82f6', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>🤖 The Optimist</span>
            <span style={{ padding: '4px 8px', background: '#ef444433', color: '#ef4444', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>🤖 The Skeptic</span>
            <span style={{ padding: '4px 8px', background: '#10b98133', color: '#10b981', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>🤖 The Synthesizer</span>
          </div>
          
          <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label>Debate Topic</label>
            <textarea 
              className="input-field" 
              style={{ flex: 1, resize: 'none' }} 
              value={topic} 
              onChange={e => setTopic(e.target.value)} 
            />
          </div>
          
          <button className="btn btn-primary" onClick={handleRun} disabled={running}>
            {running ? <><Loader className="spin" size={18} /> Simulating Debate...</> : <><Play size={18} /> Start Swarm</>}
          </button>
        </div>

        {/* Right: Trace */}
        <div className="surface-card" style={{ gridColumn: 'span 2', background: '#fafafa', color: '#333', border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column' }}>
          <h2>Live Debate Thread</h2>
          <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
            {trace.length === 0 && <span style={{ color: '#999' }}>Awaiting topic...</span>}
            {trace.map((t, i) => {
              if (t.includes('[The Optimist]')) return <span key={i} style={{ color: '#2563eb', fontWeight: t.includes('typing') ? 'normal' : 'bold' }}>{t}</span>;
              if (t.includes('[The Skeptic]')) return <span key={i} style={{ color: '#dc2626', fontWeight: t.includes('typing') ? 'normal' : 'bold' }}>{t}</span>;
              if (t.includes('[The Synthesizer]')) return <span key={i} style={{ color: '#059669', fontWeight: t.includes('typing') ? 'normal' : 'bold' }}>{t}</span>;
              if (t.includes('Consensus')) return <strong key={i} style={{ color: '#7c3aed', background: '#ede9fe', padding: '4px' }}>{t}</strong>;
              return <span key={i} style={{ color: '#666' }}>{t}</span>;
            })}
          </div>
        </div>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
