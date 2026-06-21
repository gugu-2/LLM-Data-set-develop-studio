import { useState } from 'react';
import { Eye, MousePointer2, Play, Image as ImageIcon, Database } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function VLAMiner() {
  const [url, setUrl] = useState("https://example-saas.com/checkout");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleRecord = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/vlam/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (res.ok) {
        const out = await res.json();
        setResults(out.dataset);
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
        <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '12px' }}>
          <Eye size={32} color="#0ea5e9" />
        </div>
        <div>
          <h1 className="display-font" style={{ margin: 0, fontSize: '2.5rem' }}>Spatio-Temporal Action Miner</h1>
          <p style={{ color: 'var(--mute)', margin: '0.25rem 0 0 0', fontSize: '1rem' }}>Mine Multi-Modal VLAM Datasets (Vision-Language Action Models)</p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MousePointer2 size={18} color="var(--primary)" /> RPA & Computer Use Datasets
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--charcoal)', maxWidth: '600px', lineHeight: 1.5 }}>
            Don't just fine-tune chatbots. Build agents that can use computers. Enter a URL, and our headless browser will navigate it, recording the DOM state, taking screenshots, and tracking X/Y coordinates for every semantic action.
          </p>
        </div>
      </div>

      <div className="surface-card" style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Target Application URL:</label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="url"
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--hairline)', fontSize: '1rem' }}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button 
            onClick={handleRecord}
            disabled={loading || !url}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? <span className="spin">⟳</span> : <Play size={18} />} Start Recording Session
          </button>
        </div>
      </div>

      {results && (
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} color="var(--ink)" /> Extracted VLAM Dataset ({results.length} action pairs)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.map((row, i) => (
              <div key={i} className="surface-card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ width: '150px', height: '100px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={row.image_url} alt="Screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase' }}>ACTION: {row.action_type}</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--mute)' }}>X: {row.coordinates.x}, Y: {row.coordinates.y}</div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{row.instruction}</div>
                  <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569', border: '1px solid #e2e8f0' }}>
                    {row.dom_element}
                  </div>
                  {row.typed_value && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                      Payload: "{row.typed_value}"
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
        .spin { display: inline-block; animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
