import { useState } from 'react';
import { Bot, Play, Loader, AlertTriangle, Download, RefreshCw, Zap, Shield, HelpCircle } from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';

const API = 'http://localhost:8000/api';

const DOMAINS = ['general', 'technology', 'medical', 'legal', 'finance', 'retail', 'education'];
const DIFFICULTIES = [
  { id: 'beginner', label: 'Beginner', desc: 'Simple, direct Q&A' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Detailed, technical answers' },
  { id: 'expert', label: 'Expert', desc: 'Nuanced, complex reasoning' },
  { id: 'adversarial', label: 'Adversarial', desc: 'Tricky edge cases to test safety' },
];
const DIVERSITIES = [
  { id: 'low', label: 'Low', desc: 'Highly focused on one specific sub-topic' },
  { id: 'medium', label: 'Medium', desc: 'Covers typical use cases and variants' },
  { id: 'high', label: 'High', desc: 'Maximum variance in formatting and tone' },
];

export default function SynthFactory() {
  const [topic, setTopic] = useState('');
  const [domain, setDomain] = useState('general');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [diversity, setDiversity] = useState('medium');
  const [count, setCount] = useState(10);
  const [styleExamples, setStyleExamples] = useState('');

  const [previewPairs, setPreviewPairs] = useState(null);
  const [generatedPairs, setGeneratedPairs] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const settings = JSON.parse(localStorage.getItem('hypasia_settings') || '{}');
  const apiKey = settings.gemini_api_key || '';

  const handlePreview = async () => {
    if (!topic.trim()) { setError('Please describe the topic.'); return; }
    if (!apiKey) { setError('Gemini API Key required in Settings.'); return; }

    setError(''); setLoadingPreview(true); setPreviewPairs(null);
    try {
      const res = await fetch(`${API}/synth/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, domain, difficulty, style_examples: styleExamples, api_key: apiKey })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Preview failed');
      }
      const data = await res.json();
      setPreviewPairs(data.pairs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Please describe the topic.'); return; }
    if (!apiKey) { setError('Gemini API Key required in Settings.'); return; }

    setError(''); setGenerating(true); setGeneratedPairs([]); setPreviewPairs(null);

    try {
      const res = await fetch(`${API}/synth/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/x-ndjson' },
        body: JSON.stringify({ topic, domain, difficulty, diversity, count: parseInt(count), style_examples: styleExamples, api_key: apiKey })
      });

      if (!res.ok) {
        let msg = res.statusText;
        try { const errData = await res.json(); msg = errData.detail || msg; } catch (e) {}
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const row = JSON.parse(line);
            if (row.instruction) {
              setGeneratedPairs(prev => [...prev, row]);
            }
          } catch (e) {
            console.error("Parse error chunk:", line);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadJsonl = () => {
    if (!generatedPairs.length) return;
    const lines = generatedPairs.map(r => JSON.stringify(r)).join('\n');
    const blob = new Blob([lines], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `synth_${domain}_${Date.now()}.jsonl`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Bot size={32} color="var(--primary)" />
          <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem' }}>Synthetic Data Factory</h1>
        </div>
        <p style={{ color: 'var(--charcoal)', maxWidth: '700px', lineHeight: 1.6 }}>
          Generate hundreds of unique, high-quality instruction/response training pairs instantly using Gemini. Perfect for bootstrapping a model when you have zero data.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT - Configuration Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Topic */}
          <div className="surface-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Topic Description <InfoTooltip text="Provide a detailed description of the knowledge or scenario you want the AI to generate questions about." /></h3>
            <textarea
              value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Generate customer service interactions for a shoe store regarding returns, sizing issues, and shipping delays."
              style={{ width: '100%', minHeight: 100, padding: '0.875rem', borderRadius: '8px', border: '1px solid var(--hairline)', fontFamily: 'Inter', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="surface-card">
              <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Domain <InfoTooltip text="Guides the overall tone and vocabulary of the generated data." /></h3>
              <select value={domain} onChange={e => setDomain(e.target.value)} style={{ width: '100%', padding: '0.625rem', borderRadius: '6px', border: '1px solid var(--hairline)' }}>
                {DOMAINS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div className="surface-card">
              <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Count</h3>
              <input type="number" value={count} onChange={e => setCount(e.target.value)} min="5" max="5000" style={{ width: '100%', padding: '0.625rem', borderRadius: '6px', border: '1px solid var(--hairline)' }} />
            </div>
          </div>

          <div className="surface-card">
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Difficulty <InfoTooltip text="Adjusts the complexity of the questions (e.g. Expert prompts for deep reasoning, Adversarial for safety testing)." /></h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id} onClick={() => setDifficulty(d.id)}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    background: difficulty === d.id ? 'var(--primary-light)' : 'transparent',
                    border: difficulty === d.id ? '1px solid var(--primary)' : '1px solid var(--hairline)',
                    color: difficulty === d.id ? 'var(--primary)' : 'var(--charcoal)',
                  }}
                >{d.label}</button>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--mute)', marginTop: '0.5rem' }}>
              {DIFFICULTIES.find(d => d.id === difficulty)?.desc}
            </div>
          </div>

          <div className="surface-card">
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Diversity <InfoTooltip text="Controls how different each generated row is from the previous ones." /></h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {DIVERSITIES.map(d => (
                <button
                  key={d.id} onClick={() => setDiversity(d.id)}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    background: diversity === d.id ? 'var(--primary-light)' : 'transparent',
                    border: diversity === d.id ? '1px solid var(--primary)' : '1px solid var(--hairline)',
                    color: diversity === d.id ? 'var(--primary)' : 'var(--charcoal)',
                  }}
                >{d.label}</button>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--mute)', marginTop: '0.5rem' }}>
              {DIVERSITIES.find(d => d.id === diversity)?.desc}
            </div>
          </div>

          <div className="surface-card">
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Style Reference (Optional)</h3>
            <textarea
              value={styleExamples} onChange={e => setStyleExamples(e.target.value)}
              placeholder="Paste a couple of examples here to teach the AI what tone to use (e.g. strict JSON, pirate talk, polite corporate)."
              style={{ width: '100%', minHeight: 80, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--hairline)', fontFamily: 'Inter', fontSize: '0.8rem' }}
            />
          </div>

          {error && (
            <div style={{ background: '#fff1f0', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', color: '#991b1b', display: 'flex', gap: '0.5rem' }}>
              <AlertTriangle size={15} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handlePreview} disabled={loadingPreview || generating}
              style={{
                flex: 1, background: 'var(--surface-bone)', color: 'var(--ink)', border: '1px solid var(--hairline)',
                padding: '0.875rem', borderRadius: '8px', fontWeight: 600, cursor: (loadingPreview||generating) ? 'not-allowed':'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
              }}
            >
              {loadingPreview ? <Loader className="spin" size={16} /> : <Zap size={16} />} Preview 5
            </button>
            <button
              onClick={handleGenerate} disabled={loadingPreview || generating}
              style={{
                flex: 2, background: 'var(--ink)', color: '#fff', border: 'none',
                padding: '0.875rem', borderRadius: '8px', fontWeight: 700, cursor: (loadingPreview||generating) ? 'not-allowed':'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
              }}
            >
              {generating ? <Loader className="spin" size={16} /> : <Play size={16} fill="currentColor" />} Generate {count} Pairs
            </button>
          </div>
        </div>

        {/* RIGHT - Preview/Results */}
        <div>
          {/* Header Bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#1e1e2e', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.5rem', fontFamily: 'Bricolage Grotesque' }}>
                {generating ? generatedPairs.length : (previewPairs ? previewPairs.length : 0)} <span style={{fontSize:'0.8rem', fontWeight:500, color:'var(--mute)'}}>Rows</span>
              </div>
              {generating && <div style={{ color: '#a6e3a1', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><RefreshCw className="spin" size={12}/> Generating...</div>}
            </div>
            <button
              onClick={downloadJsonl} disabled={!generatedPairs.length && !previewPairs?.length}
              style={{
                background: (generatedPairs.length || previewPairs?.length) ? 'var(--primary)' : 'var(--charcoal)', color: '#fff', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                cursor: (generatedPairs.length || previewPairs?.length) ? 'pointer' : 'not-allowed', display: 'flex', gap: '0.4rem', alignItems: 'center'
              }}
            >
              <Download size={14} /> Download JSONL
            </button>
          </div>

          {/* Empty State */}
          {!previewPairs && !generatedPairs.length && !loadingPreview && !generating && (
            <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--hairline)', borderRadius: '12px', color: 'var(--charcoal)' }}>
              <Bot size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No data generated yet</h3>
              <p style={{ fontSize: '0.85rem' }}>Fill out the topic on the left and click Preview or Generate.</p>
            </div>
          )}

          {/* List Pairs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(generating ? generatedPairs : (previewPairs || [])).map((pair, idx) => (
              <div key={idx} className="surface-card fade-in" style={{ padding: '1.25rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -10, left: -10, background: 'var(--primary)', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                  {idx + 1}
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Instruction</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5 }}>{pair.instruction}</div>
                </div>
                <div style={{ background: 'var(--surface-bone)', padding: '0.875rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--charcoal)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Response</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.6 }}>{pair.response}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
