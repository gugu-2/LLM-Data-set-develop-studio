import { useState } from 'react';
import { ShieldCheck, Fingerprint, RefreshCcw, CheckCircle, AlertTriangle, Play, Database } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function IPWasher() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const loadMockData = () => {
    setData([
      { instruction: "Summarize the latest AI news.", response: "According to a New York Times exclusive, OpenAI released a new model.", source: "web_scrape" },
      { instruction: "Write a function to sort an array.", response: "function sort(arr) { return arr.sort(); }", source: "github" },
      { instruction: "How does this proprietary software work?", response: "The proprietary algorithm uses a confidential matching system.", source: "internal_wiki" }
    ]);
    setResults(null);
  };

  const handleWash = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/washer/scrub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: data })
      });
      if (res.ok) {
        const out = await res.json();
        setResults(out);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px' }}>
          <ShieldCheck size={32} color="#3b82f6" />
        </div>
        <div>
          <h1 className="display-font" style={{ margin: 0, fontSize: '2.5rem' }}>IP Washer & Ledger</h1>
          <p style={{ color: 'var(--mute)', margin: '0.25rem 0 0 0', fontSize: '1rem' }}>Cryptographic Data Provenance & Copyright Scrubbing</p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Fingerprint size={18} color="var(--primary)" /> Cryptographic Ledger
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--charcoal)', maxWidth: '600px', lineHeight: 1.5 }}>
            Every row of data gets a SHA-256 provenance hash. If the system detects copyrighted or proprietary text, the IP Washer autonomously uses an LLM to rewrite the semantic knowledge into legally safe, synthetic data.
          </p>
        </div>
        <button onClick={loadMockData} style={{ background: '#fff', color: 'var(--ink)', border: '1px solid var(--hairline)', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
          Load Sample Dataset
        </button>
      </div>

      {data.length > 0 && !results && (
        <div className="surface-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} /> Raw Dataset ({data.length} rows)
            </h3>
            <button 
              onClick={handleWash} 
              disabled={loading}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? <RefreshCcw size={16} className="spin" /> : <Play size={16} />} Wash IP Constraints
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.map((row, i) => (
              <div key={i} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--hairline)', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600 }}>{row.instruction}</span><br />
                <span style={{ color: 'var(--mute)' }}>{row.response}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Washed Ledger Results</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
             <div className="surface-card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
               <div style={{ color: '#059669', fontWeight: 700, fontSize: '1.5rem' }}>{results.total_rows - results.flags_found}</div>
               <div style={{ color: '#047857', fontSize: '0.9rem' }}>Clean Rows (SHA-256 Verified)</div>
             </div>
             <div className="surface-card" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
               <div style={{ color: '#d97706', fontWeight: 700, fontSize: '1.5rem' }}>{results.flags_found}</div>
               <div style={{ color: '#b45309', fontSize: '0.9rem' }}>IP Violations Synthesized</div>
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.results.map((row, i) => (
              <div key={i} className="surface-card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${row.status === 'washed' ? '#f59e0b' : '#10b981'}` }}>
                <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid var(--hairline)', display: 'flex', gap: '1rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <span style={{ color: 'var(--mute)' }}>SHA-256: {row.hash}</span>
                  {row.status === 'washed' ? (
                    <span style={{ color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={12} /> REWRITTEN</span>
                  ) : (
                    <span style={{ color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={12} /> CLEAN</span>
                  )}
                </div>
                <div style={{ padding: '1rem', fontSize: '0.9rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{row.instruction}</div>
                  <div style={{ color: 'var(--charcoal)' }}>{row.response}</div>
                  {row.status === 'washed' && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '4px', fontSize: '0.8rem', color: '#991b1b' }}>
                      <strong>Original Tainted Data:</strong> &quot;{row.original_response}&quot;
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
