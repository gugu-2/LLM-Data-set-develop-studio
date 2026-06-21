import React, { useState } from 'react';
import axios from 'axios';
import { BarChart2, Loader, TrendingUp, TrendingDown } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/safety';

export default function Evaluation() {
  const [finetunedModel, setFinetunedModel] = useState('lora_model');
  const [baseModel, setBaseModel] = useState('unsloth/llama-3-8b-Instruct-bnb-4bit');
  const [datasetPath, setDatasetPath] = useState('hypasia_dataset.jsonl');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleRun = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axios.post(`${API_BASE}/eval`, {
        finetuned_model: finetunedModel,
        base_model: baseModel,
        dataset_path: datasetPath,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const improvement = result ? result.improvement : 0;

  return (
    <div className="fade-in">
      <h1 className="display-font">Auto-Eval Benchmark</h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Automatically score your fine-tuned model against the base model using a held-out evaluation set.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Config */}
        <div className="surface-card">
          <h2>Benchmark Configuration</h2>
          <div className="input-group">
            <label>Fine-tuned Model Path</label>
            <input type="text" className="input-field" value={finetunedModel}
              onChange={e => setFinetunedModel(e.target.value)} placeholder="lora_model/" />
          </div>
          <div className="input-group">
            <label>Base Model (for comparison)</label>
            <select className="input-field" value={baseModel} onChange={e => setBaseModel(e.target.value)}>
              <option value="unsloth/llama-3-8b-Instruct-bnb-4bit">Llama 3 8B (4-bit)</option>
              <option value="unsloth/Qwen2.5-3B-Instruct-bnb-4bit">Qwen 2.5 3B (4-bit)</option>
              <option value="unsloth/Mistral-7B-Instruct-v0.3-bnb-4bit">Mistral 7B (4-bit)</option>
            </select>
          </div>
          <div className="input-group">
            <label>Dataset for Evaluation</label>
            <input type="text" className="input-field" value={datasetPath}
              onChange={e => setDatasetPath(e.target.value)} placeholder="hypasia_dataset.jsonl" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleRun} disabled={loading}>
            {loading
              ? <><Loader className="spin" size={18} /> Running evaluation...</>
              : <><BarChart2 size={18} /> Run Benchmark</>}
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--charcoal)', marginTop: '0.75rem' }}>
            ⚠️ Requires Ollama running with both models loaded locally.
          </p>
        </div>

        {/* Results */}
        <div className="surface-card">
          <h2>Results</h2>
          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--charcoal)' }}>
              <BarChart2 size={48} color="var(--hairline)" style={{ margin: '0 auto 1rem' }} />
              <p>Run a benchmark to see results here.</p>
            </div>
          )}
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--charcoal)' }}>
              <Loader className="spin" size={36} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
              <p>Running evaluation... this may take a few minutes.</p>
            </div>
          )}
          {error && <div style={{ color: 'var(--badge-rejected)', padding: '1rem' }}>{error}</div>}
          {result && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-bone)', borderRadius: 10 }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Bricolage Grotesque' }}>
                    {result.finetuned_avg_score}
                  </div>
                  <div style={{ color: 'var(--charcoal)', fontSize: '0.875rem' }}>Fine-Tuned Score</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-bone)', borderRadius: 10 }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Bricolage Grotesque' }}>
                    {result.base_avg_score}
                  </div>
                  <div style={{ color: 'var(--charcoal)', fontSize: '0.875rem' }}>Base Model Score</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.25rem',
                  borderRadius: 10, fontWeight: 700, fontSize: '1.1rem',
                  background: improvement >= 0 ? '#e6f7ee' : '#ffeaea',
                  color: improvement >= 0 ? '#2d9d5e' : 'var(--badge-rejected)',
                }}>
                  {improvement >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {improvement >= 0 ? '+' : ''}{improvement} improvement
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--charcoal)', textAlign: 'center' }}>
                Fine-tuned won <strong>{result.finetuned_wins}</strong> / {result.finetuned_wins + result.base_wins} comparisons
              </div>
            </>
          )}
        </div>
      </div>

      {/* Comparisons Table */}
      {result?.comparisons?.length > 0 && (
        <div className="surface-card">
          <h2>Sample Comparisons</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--hairline)' }}>
                  {['Instruction', 'Fine-Tuned Response', 'Base Response', 'Winner'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--charcoal)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.comparisons.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', maxWidth: 180 }}>{row.instruction}</td>
                    <td style={{ padding: '0.6rem 0.75rem', maxWidth: 200, color: 'var(--charcoal)' }}>{row.finetuned_response}</td>
                    <td style={{ padding: '0.6rem 0.75rem', maxWidth: 200, color: 'var(--charcoal)' }}>{row.base_response}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{ color: row.winner === 'finetuned' ? '#2d9d5e' : 'var(--badge-rejected)', fontWeight: 700 }}>
                        {row.winner === 'finetuned' ? '✅ Fine-Tuned' : '⚠️ Base'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
