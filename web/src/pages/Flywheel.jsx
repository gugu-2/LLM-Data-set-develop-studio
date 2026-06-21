import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, Loader, Zap, Database, Clock, TrendingUp } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/flywheel';

export default function Flywheel() {
  const [status, setStatus] = useState({ queue_depth: 0, avg_score: 0, last_retrain: 'Never' });
  const [queue, setQueue] = useState([]);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);
  const [threshold, setThreshold] = useState(7.0);
  const [triggerCount, setTriggerCount] = useState(50);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/status`);
      setStatus(res.data);
    } catch { /* silent */ }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/queue?limit=30`);
      setQueue(res.data.rows || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchQueue();
  }, [fetchStatus, fetchQueue]);

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await axios.post(`${API_BASE}/trigger`, { threshold, trigger_count: triggerCount });
      setTriggerResult(res.data);
      fetchStatus();
      fetchQueue();
    } catch (err) {
      setTriggerResult({ status: 'error', message: err.response?.data?.detail || err.message });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="display-font">Data Flywheel</h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Every production failure automatically becomes tomorrow's training data. Deploy → Capture → Improve.
      </p>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="surface-card" style={{ textAlign: 'center' }}>
          <Database size={28} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {status.queue_depth}
          </div>
          <div style={{ color: 'var(--charcoal)', fontSize: '0.875rem' }}>Queue Depth</div>
        </div>
        <div className="surface-card" style={{ textAlign: 'center' }}>
          <TrendingUp size={28} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {status.avg_score}
          </div>
          <div style={{ color: 'var(--charcoal)', fontSize: '0.875rem' }}>Avg Score</div>
        </div>
        <div className="surface-card" style={{ textAlign: 'center' }}>
          <Clock size={28} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Bricolage Grotesque, sans-serif', marginTop: '0.5rem' }}>
            {status.last_retrain === 'Never' ? 'Never' : new Date(status.last_retrain).toLocaleDateString()}
          </div>
          <div style={{ color: 'var(--charcoal)', fontSize: '0.875rem' }}>Last Retrain</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* SDK Quickstart */}
        <div className="surface-card">
          <h2><Zap size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />SDK Quickstart</h2>
          <p className="mb-4" style={{ fontSize: '0.875rem', color: 'var(--charcoal)' }}>
            Install the SDK and wrap your inference endpoint. Every corrected interaction is auto-scored and queued.
          </p>
          <div className="code-block" style={{ marginBottom: '1rem' }}>
            <pre><code>pip install hypasia-ai</code></pre>
          </div>
          <div className="code-block">
            <pre><code>{`from hypasia.flywheel import FlywheelCollector

collector = FlywheelCollector(
    endpoint="http://localhost:8000/api/flywheel/ingest"
)

# In your inference handler:
response = your_model.generate(prompt)

# Capture with optional user correction:
collector.capture(
    prompt=prompt,
    response=response,
    correction=user_correction,  # optional
    thumbs_up=True               # optional
)`}</code></pre>
          </div>
        </div>

        {/* Trigger Panel */}
        <div className="surface-card">
          <h2><RefreshCw size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Retrain Trigger</h2>
          <p className="mb-4" style={{ fontSize: '0.875rem', color: 'var(--charcoal)' }}>
            Manually trigger a retrain cycle, or set it to fire automatically when the queue hits the target.
          </p>
          <div className="input-group">
            <label>Quality Threshold: {threshold}</label>
            <input type="range" min="5" max="9.5" step="0.5" value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div className="input-group">
            <label>Auto-Trigger at Queue Size: {triggerCount} rows</label>
            <input type="range" min="10" max="500" step="10" value={triggerCount}
              onChange={e => setTriggerCount(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleTrigger} disabled={triggering}>
            {triggering
              ? <><Loader className="spin" size={18} /> Running Retrain Pipeline...</>
              : <><RefreshCw size={18} /> Trigger Retrain Now</>}
          </button>
          {triggerResult && (
            <div className="mt-4" style={{
              padding: '1rem', borderRadius: 10,
              background: triggerResult.status === 'triggered' ? 'var(--badge-gold-bg)' : 'var(--surface-bone)',
              border: '1px solid var(--hairline)', marginTop: '1rem'
            }}>
              <strong style={{ fontSize: '0.875rem' }}>{triggerResult.status?.toUpperCase()}</strong>
              <p style={{ color: 'var(--charcoal)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{triggerResult.message}</p>
              {triggerResult.approved > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--charcoal)' }}>
                    ✅ {triggerResult.approved} total rows approved → saved to {triggerResult.output_path}
                  </p>
                  {triggerResult.active_learning_triggered > 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--badge-gold)', fontWeight: 'bold' }}>
                      ⚡ Active Learning triggered for {triggerResult.active_learning_triggered} failures, mining {triggerResult.mined_facts_added} new facts from Wikipedia!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Queue Preview */}
      <div className="surface-card">
        <div className="flex justify-between items-center mb-4">
          <h2>Captured Failures Queue ({queue.length} pending)</h2>
          <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={() => { fetchStatus(); fetchQueue(); }}>
            Refresh
          </button>
        </div>
        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--charcoal)' }}>
            <Database size={40} color="var(--hairline)" style={{ margin: '0 auto 1rem' }} />
            <p>No captured interactions yet. Install the SDK and start capturing.</p>
          </div>
        ) : (
          <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {queue.map((row, i) => (
              <div key={i} style={{ background: 'var(--surface-bone)', padding: '0.875rem 1rem', borderRadius: 10, border: '1px solid var(--hairline)' }}>
                <div className="flex justify-between mb-2">
                  <span className={`badge ${row.tier || 'unscored'}`}>{row.tier || 'unscored'} • {row.score}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--charcoal)' }}>{row.source}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>{row.instruction?.substring(0, 100)}...</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .mt-4 { margin-top: 1rem; }
      `}</style>
    </div>
  );
}
