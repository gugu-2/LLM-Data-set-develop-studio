import { useState, useEffect } from 'react';
import { Heart, X, ThumbsUp, Database, Code, Play } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function RLHFTinder() {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const fetchDataset = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/rlhf/dataset`);
      if (res.ok) {
        const data = await res.json();
        setDataset(data.dataset);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const simulateSwipe = async (winner) => {
    setSimulating(true);
    try {
      await fetch(`${API}/rlhf/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: "Explain quantum computing to a 5 year old.",
          model_a_response: "It's like having a magic coin that is both heads and tails at the same time until you look at it.",
          model_b_response: "Quantum computing utilizes superposition and entanglement to perform complex parallel calculations.",
          winner: winner
        })
      });
      await fetchDataset();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fdf2f8', padding: '1rem', borderRadius: '12px' }}>
          <ThumbsUp size={32} color="#ec4899" />
        </div>
        <div>
          <h1 className="display-font" style={{ margin: 0, fontSize: '2.5rem' }}>Tinder for RLHF</h1>
          <p style={{ color: 'var(--mute)', margin: '0.25rem 0 0 0', fontSize: '1rem' }}>Crowdsourced Human Preference (DPO) via Micro-Interactions</p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code size={18} color="var(--primary)" /> Embed Widget
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--charcoal)', lineHeight: 1.5, marginBottom: '1rem' }}>
            Drop this 1-line script into your application. We will silently A/B test two LoRA models against your live users, record their implicit preferences, and stream it back into a Direct Preference Optimization (DPO) dataset.
          </p>
          <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', overflowX: 'auto' }}>
            {`<script src="https://api.hypasia.ai/rlhf-widget.js?token=YOUR_API_KEY"></script>`}
          </pre>
        </div>

        <div style={{ flex: 1, background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem' }}>Widget Simulator</div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>"Explain quantum computing to a 5 year old."</div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div 
              style={{ flex: 1, padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => simulateSwipe('A')}
            >
              <div style={{ fontSize: '0.85rem' }}>It's like having a magic coin that is both heads and tails at the same time until you look at it.</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <Heart size={16} color="#ec4899" />
              </div>
            </div>
            <div 
              style={{ flex: 1, padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => simulateSwipe('B')}
            >
              <div style={{ fontSize: '0.85rem' }}>Quantum computing utilizes superposition and entanglement to perform complex parallel calculations.</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <X size={16} color="#64748b" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={20} color="var(--primary)" /> Compiled DPO Dataset ({dataset.length})
        </h2>
        
        {dataset.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mute)' }}>
            No preferences recorded yet. Simulate a swipe above!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {dataset.map((row, i) => (
              <div key={i} style={{ border: '1px solid var(--hairline)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--hairline)' }}>
                  {row.instruction}
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1, padding: '1rem', borderRight: '1px solid var(--hairline)', background: '#ecfdf5' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Chosen (User Preferred)</div>
                    <div style={{ fontSize: '0.9rem', color: '#064e3b' }}>{row.chosen}</div>
                  </div>
                  <div style={{ flex: 1, padding: '1rem', background: '#fef2f2' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Rejected</div>
                    <div style={{ fontSize: '0.9rem', color: '#7f1d1d' }}>{row.rejected}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
