import { useState } from 'react';
import axios from 'axios';
import { Shield, Loader, Download, AlertTriangle } from 'lucide-react';

const API = 'http://localhost:8000/api';

const ATTACK_COLORS = {
  jailbreak: '#ea2804',
  edge_case: '#e07b00',
  contradiction: '#7b5ea7',
  injection: '#c0392b',
  ambiguous: '#2980b9',
};

export default function RedTeam() {
  const [inputText, setInputText] = useState('');
  const [nVariants, setNVariants] = useState(3);
  const [judge, setJudge] = useState('ollama');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const parseInput = () => {
    const rows = [];
    const lines = inputText.trim().split('\n');
    for (const line of lines) {
      try { rows.push(JSON.parse(line)); } catch { /* skip */ }
    }
    return rows;
  };

  const handleGenerate = async () => {
    const rows = parseInput();
    if (!rows.length) { setError('Paste at least one JSONL row with instruction + response.'); return; }
    setLoading(true); setError(''); setResults(null);
    try {
      const res = await axios.post(`${API}/redteam/generate`, {
        rows, n_variants: nVariants, judge,
        api_key: apiKey || undefined,
      });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally { setLoading(false); }
  };

  const handleExport = () => {
    if (!results?.rows) return;
    const lines = results.rows.map(r => JSON.stringify(r)).join('\n');
    const blob = new Blob([lines], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'redteam_adversarial.jsonl'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <h1 className="display-font">Adversarial Red-Team Generator</h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Auto-generate domain-specific adversarial test cases: jailbreaks, edge cases, contradictions, prompt injections. Currently a $50k manual consulting service — automated here.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="surface-card">
          <h2><Shield size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Configuration</h2>

          <div className="input-group">
            <label>Input Dataset (JSONL — one row per line)</label>
            <textarea className="input-field" rows={8} value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={'{"instruction": "What is Python?", "response": "A programming language."}\n{"instruction": "How do I sort a list?", "response": "Use list.sort()"}'}
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', resize: 'vertical' }} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="input-group">
              <label>Variants per row: {nVariants}</label>
              <input type="range" min={1} max={5} step={1} value={nVariants}
                onChange={e => setNVariants(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div className="input-group">
              <label>LLM Judge</label>
              <select className="input-field" value={judge} onChange={e => setJudge(e.target.value)}>
                <option value="ollama">Ollama (local)</option>
                <option value="gemini">Gemini (cloud)</option>
              </select>
            </div>
          </div>

          {judge === 'gemini' && (
            <div className="input-group">
              <label>Gemini API Key</label>
              <input type="password" className="input-field" value={apiKey}
                onChange={e => setApiKey(e.target.value)} placeholder="AIzaSy..." />
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader className="spin" size={18} /> Generating adversarial variants...</>
              : <><AlertTriangle size={18} /> Generate Red-Team Cases</>}
          </button>
          {error && <p style={{ color: 'var(--badge-rejected)', marginTop: '0.75rem', fontSize: '0.875rem' }}>{error}</p>}
        </div>

        <div className="surface-dark" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center mb-4">
            <h2>Results {results ? `(${results.generated} generated)` : ''}</h2>
            {results?.rows?.length > 0 && (
              <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={handleExport}>
                <Download size={14} /> Export JSONL
              </button>
            )}
          </div>
          {!results && !loading && (
            <div style={{ textAlign: 'center', color: 'var(--on-dark-mute)', padding: '3rem 1rem' }}>
              <Shield size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>Adversarial cases will appear here.</p>
            </div>
          )}
          {results?.rows?.length > 0 && (
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.rows.map((row, i) => {
                const attackType = row.source?.match(/redteam:([^\]]+)/)?.[1] || 'adversarial';
                return (
                  <div key={i} style={{ background: 'var(--surface-deep)', padding: '0.875rem', borderRadius: 10, border: `1px solid ${ATTACK_COLORS[attackType] || 'var(--hairline)'}` }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ATTACK_COLORS[attackType] || 'var(--on-dark-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {attackType.replace('_', ' ')}
                    </span>
                    <p style={{ color: 'var(--on-dark)', fontSize: '0.875rem', marginTop: '0.4rem' }}><strong>Attack:</strong> {row.instruction}</p>
                    <p style={{ color: 'var(--on-dark-mute)', fontSize: '0.8rem', marginTop: '0.25rem' }}><strong>Safe Response:</strong> {row.response?.substring(0, 120)}...</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="surface-card" style={{ borderLeft: '4px solid var(--primary)' }}>
        <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Attack Type Legend</h3>
        <div className="grid grid-cols-2 gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {Object.entries(ATTACK_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
              {type.replace('_', ' ')}
            </div>
          ))}
        </div>
      </div>

      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
