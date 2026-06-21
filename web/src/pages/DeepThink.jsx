import React, { useState } from 'react';
import axios from 'axios';
import { Brain, Settings, Database, Code, CheckCircle, Loader, Wand2, ArrowRight } from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';

const API_BASE = 'http://localhost:8000/api';

export default function DeepThink() {
  const [instruction, setInstruction] = useState("Explain how quantum entanglement works.");
  const [response, setResponse] = useState("Quantum entanglement is a physical phenomenon that occurs when a group of particles are generated, interact, or share spatial proximity in a way such that the quantum state of each particle of the group cannot be described independently of the state of the others, including when the particles are separated by a large distance.");
  const [thought, setThought] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleGenerate = async () => {
    setLoading(true);
    setThought("");
    try {
      const res = await axios.post(`${API_BASE}/deepthink/synthesize`, {
        instruction,
        response
      });
      setThought(res.data.thought);
    } catch (e) {
      alert("Error generating thought: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="display-font" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Brain color="var(--primary)" /> DeepThink Studio
      </h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Synthesize reasoning traces (Chain-of-Thought) for your dataset. Fine-tune models that "think" before they answer.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Col: Setup */}
        <div className="surface-card">
          <h2><Settings size={18} style={{ display: 'inline', marginRight: 8 }}/> Configuration</h2>
          
          <h2 style={{ marginTop: '1.5rem' }}>Sample QA Pair <InfoTooltip text="Provide an instruction and answer. Hypasia will use a large model to reverse-engineer the 'thinking' required to arrive at that answer." /></h2>
          <div className="input-group">
            <label>Instruction</label>
            <textarea className="input-field" rows={3} value={instruction} onChange={e => setInstruction(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Target Response</label>
            <textarea className="input-field" rows={5} value={response} onChange={e => setResponse(e.target.value)} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader className="spin" size={18} /> Generating Thought...</> : <><Wand2 size={18} /> Synthesize Reasoning Trace</>}
          </button>
        </div>

        {/* Right Col: Output */}
        <div className="surface-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2><Code size={18} style={{ display: 'inline', marginRight: 8 }}/> Generated Training Row</h2>
          <div style={{ flex: 1, background: '#1e1e1e', borderRadius: '8px', padding: '1rem', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '0.85rem', overflowY: 'auto', whiteSpace: 'pre-wrap', border: '1px solid var(--hairline)' }}>
            <span style={{ color: '#569cd6' }}>{'{\n'}</span>
            <span style={{ color: '#9cdcfe' }}>  "instruction": </span>
            <span style={{ color: '#ce9178' }}>"{instruction}"</span><span style={{ color: '#d4d4d4' }}>,\n</span>
            <span style={{ color: '#9cdcfe' }}>  "response": </span>
            <span style={{ color: '#ce9178' }}>"</span>
            {thought && (
              <span style={{ color: '#c586c0' }}>{'<think>\\n'}{thought.replace(/\n/g, '\\n')}{'\\n</think>\\n\\n'}</span>
            )}
            <span style={{ color: '#ce9178' }}>{response.replace(/\n/g, '\\n')}"</span>
            <span style={{ color: '#d4d4d4' }}>{'\n'}</span>
            <span style={{ color: '#569cd6' }}>{'}'}</span>
          </div>

          {thought && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-bone)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--charcoal)', borderLeft: '4px solid var(--primary)' }}>
              <strong>What just happened?</strong> We used a larger model to bridge the gap between the instruction and the answer. By formatting this as <code>{'<think>'}</code> blocks and fine-tuning your model on it, your model will learn to reason step-by-step.
            </div>
          )}
        </div>
      </div>
      
      {/* Batch Processing */}
      <div className="surface-card mt-4">
        <h2><Database size={18} style={{ display: 'inline', marginRight: 8 }}/> Batch Process Dataset <InfoTooltip text="Applies the Chain-of-Thought reasoning synthesis to every row in your dataset, dramatically improving your model's logic." /></h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', marginBottom: '1rem' }}>
          Apply this synthesis pipeline to your entire dataset. This will dramatically increase the intelligence of models trained on it.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select className="input-field" style={{ maxWidth: '300px' }}>
            <option>hypasia_raw_dataset.jsonl (15,000 rows)</option>
          </select>
          <ArrowRight size={20} color="var(--charcoal)" />
          <input className="input-field" value="hypasia_deepthink_dataset.jsonl" disabled style={{ maxWidth: '300px' }} />
          <button className="btn btn-outline">Start Batch Job</button>
        </div>
      </div>

      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
