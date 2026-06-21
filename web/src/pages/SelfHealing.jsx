import { useState, useEffect, useCallback } from 'react';
import { Activity, ShieldAlert, CheckCircle, XCircle, Loader, Play, RefreshCw } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function SelfHealing() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API}/healing/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueue();
  }, [fetchQueue]);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/healing/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setQueue(queue.filter(q => q.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API}/healing/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setQueue(queue.filter(q => q.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const simulateFailure = async () => {
    setSimulating(true);
    try {
      // Simulate a deployed API hitting an edge case
      await fetch(`${API}/healing/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: "How do I configure a reverse proxy in Nginx for a Next.js app on port 3000?",
          confidence: 0.25
        })
      });
      await fetchQueue();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '12px' }}>
          <RefreshCw size={32} color="#10b981" />
        </div>
        <div>
          <h1 className="display-font" style={{ margin: 0, fontSize: '2.5rem' }}>Self-Healing Loop</h1>
          <p style={{ color: 'var(--mute)', margin: '0.25rem 0 0 0', fontSize: '1rem' }}>Autonomous Continuous Learning for Deployed Models</p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--primary)" /> Live Production Monitoring
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--charcoal)', maxWidth: '600px', lineHeight: 1.5 }}>
            When your deployed model encounters a query with high entropy (low confidence), it routes the failure back here. The Autonomous Agent synthesizes the correct answer by mining the web overnight and queues it for approval.
          </p>
        </div>
        <button 
          onClick={simulateFailure} 
          disabled={simulating}
          style={{ 
            background: 'var(--ink)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', 
            borderRadius: '8px', fontWeight: 600, cursor: simulating ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          {simulating ? <Loader size={18} className="spin" /> : <Play size={18} />}
          Simulate API Failure
        </button>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldAlert size={20} color="#f59e0b" /> Pending Auto-Healed Fixes ({queue.length})
      </h2>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--mute)' }}><Loader size={32} className="spin" /></div>
      ) : queue.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--mute)' }}>
          <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)' }}>All clear!</h3>
          <p style={{ margin: 0 }}>Your deployed model hasn't reported any low-confidence failures.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {queue.map(item => (
            <div key={item.id} className="surface-card" style={{ padding: 0, overflow: 'hidden', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ padding: '1rem 1.5rem', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#b45309', marginBottom: '0.25rem', display: 'flex', gap: '1rem' }}>
                    <span>ID: {item.id}</span>
                    <span>Confidence: {(item.production_confidence * 100).toFixed(1)}%</span>
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#92400e' }}>
                    "{item.original_query}"
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Agent Synthesized Fix</div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--hairline)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                    {item.synthesized_response}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '200px' }}>
                  <button 
                    onClick={() => handleApprove(item.id)}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <CheckCircle size={18} /> Approve & Merge
                  </button>
                  <button 
                    onClick={() => handleReject(item.id)}
                    style={{ background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <XCircle size={18} /> Reject Synthesis
                  </button>
                </div>
              </div>
            </div>
          ))}
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
