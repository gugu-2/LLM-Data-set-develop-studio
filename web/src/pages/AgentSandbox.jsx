import React, { useState } from 'react';
import { Globe, Terminal, Play, Loader, Wrench } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function AgentSandbox() {
  const [prompt, setPrompt] = useState("What is the current state of AI agents in 2026?");
  const [trace, setTrace] = useState([]);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    setTrace([]);
    
    try {
      const response = await fetch(`${API_BASE}/sandbox/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tools: ["web_search"] })
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
        <Terminal color="var(--primary)" /> Agent Sandbox
      </h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Test your fine-tuned models on tool-calling. Watch them use external APIs like Web Search to solve queries live.
      </p>

      <div className="grid grid-cols-2 gap-4" style={{ height: '65vh' }}>
        {/* Left: Input */}
        <div className="surface-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2><Wrench size={18} style={{ display: 'inline', marginRight: 8 }}/> Tool Configuration</h2>
          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" defaultChecked /> <Globe size={16} /> Web Search API
            </label>
            <label className="flex items-center gap-2 mb-2" style={{ opacity: 0.5 }}>
              <input type="checkbox" disabled /> Database SQL Executor (Coming Soon)
            </label>
          </div>
          
          <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label>Test Prompt</label>
            <textarea 
              className="input-field" 
              style={{ flex: 1, resize: 'none' }} 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} 
            />
          </div>
          
          <button className="btn btn-primary" onClick={handleRun} disabled={running}>
            {running ? <><Loader className="spin" size={18} /> Executing Agent...</> : <><Play size={18} /> Deploy Agent</>}
          </button>
        </div>

        {/* Right: Trace */}
        <div className="surface-card" style={{ background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: '#fff' }}>Execution Trace</h2>
          <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {trace.length === 0 && <span style={{ color: '#8b949e' }}>Awaiting execution...</span>}
            {trace.map((t, i) => {
              // Syntax highlight tool calls and system intercepts
              if (t.includes('[TOOL_CALL:')) return <span key={i} style={{ color: '#79c0ff' }}>{t}</span>;
              if (t.includes('--- SYSTEM INTERCEPT ---')) return <span key={i} style={{ color: '#ff7b72' }}>{t}</span>;
              if (t.includes('Observation:')) return <span key={i} style={{ color: '#a5d6ff' }}>{t}</span>;
              if (t.includes('[FINAL_ANSWER]')) return <span key={i} style={{ color: '#7ee787', fontWeight: 'bold' }}>{t}</span>;
              return <span key={i}>{t}</span>;
            })}
          </div>
        </div>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
