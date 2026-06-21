import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { GitBranch, Clock, Diff, Trash2, Plus, Loader, Download } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function VersionControl() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [diffA, setDiffA] = useState('');
  const [diffB, setDiffB] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [commitData, setCommitData] = useState({ name: '', message: '', jsonl: '' });
  const [committing, setCommitting] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [tab, setTab] = useState('history');

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/versions/list`);
      if (res.ok) setVersions((await res.json()).versions);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  const handleCommit = async () => {
    const rows = [];
    for (const line of commitData.jsonl.trim().split('\n')) {
      try { rows.push(JSON.parse(line)); } catch { }
    }
    if (!rows.length || !commitData.name) return;
    setCommitting(true);
    try {
      const r = await axios.post(`${API}/versions/commit`, { rows, name: commitData.name, message: commitData.message });
      setCommitMsg(`✅ Committed as ${r.data.version_id}`);
      setCommitData({ name: '', message: '', jsonl: '' });
      fetchVersions();
    } catch (e) { setCommitMsg('Error: ' + (e.response?.data?.detail || e.message)); }
    finally { setCommitting(false); }
  };

  const handleDiff = async () => {
    if (!diffA || !diffB) return;
    try {
      const r = await axios.post(`${API}/versions/diff`, { version_a: diffA, version_b: diffB });
      setDiffResult(r.data);
    } catch (e) {
      alert('Diff failed: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleRollback = async (vid, name) => {
    const r = await axios.get(`${API}/versions/${vid}/rows`);
    const lines = r.data.rows.map(row => JSON.stringify(row)).join('\n');
    const blob = new Blob([lines], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${name}_rollback.jsonl`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (vid) => {
    if (!window.confirm('Delete this version?')) return;
    await axios.delete(`${API}/versions/${vid}`);
    fetchVersions();
  };

  return (
    <div className="fade-in">
      <h1 className="display-font">Dataset Version Control</h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Git-like snapshots for every pipeline run. Diff, rollback, and branch datasets for experiments.
      </p>

      <div className="flex gap-2 mb-4">
        {['history', 'commit', 'diff'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t === 'history' ? <><Clock size={16} /> History</> : t === 'commit' ? <><Plus size={16} /> Commit</> : <><Diff size={16} /> Diff</>}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        <div className="surface-card">
          <div className="flex justify-between items-center mb-4">
            <h2>{versions.length} versions</h2>
            <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={fetchVersions}>Refresh</button>
          </div>
          {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><Loader className="spin" size={28} color="var(--primary)" /></div>}
          {!loading && versions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--charcoal)' }}>
              <GitBranch size={48} color="var(--hairline)" style={{ margin: '0 auto 1rem' }} />
              <p>No versions yet. Commit your first dataset snapshot.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setTab('commit')}>Create First Commit</button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {versions.map((v, i) => (
              <div key={v.version_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: 'var(--surface-bone)', borderRadius: 10, border: '1px solid var(--hairline)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? 'var(--primary)' : 'var(--charcoal)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <strong>{v.name}</strong>
                    <code style={{ fontSize: '0.75rem', color: 'var(--charcoal)', background: 'var(--hairline)', padding: '1px 6px', borderRadius: 4 }}>{v.version_id}</code>
                    {i === 0 && <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: '#fff', padding: '1px 8px', borderRadius: 4, fontWeight: 700 }}>LATEST</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--charcoal)', marginTop: '0.2rem' }}>
                    {v.message && <span>{v.message} · </span>}
                    <span>{v.row_count?.toLocaleString()} rows · avg {v.avg_score} · {new Date(v.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleRollback(v.version_id, v.name)}>
                    <Download size={13} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--badge-rejected)', color: 'var(--badge-rejected)' }} onClick={() => handleDelete(v.version_id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'commit' && (
        <div className="surface-card">
          <h2><Plus size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Commit a Snapshot</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="input-group"><label>Version Name</label>
                <input className="input-field" value={commitData.name} onChange={e => setCommitData(d => ({ ...d, name: e.target.value }))} placeholder="v1.0 — initial dataset" /></div>
              <div className="input-group"><label>Commit Message (optional)</label>
                <input className="input-field" value={commitData.message} onChange={e => setCommitData(d => ({ ...d, message: e.target.value }))} placeholder="Filtered to gold tier only" /></div>
              {commitMsg && <p style={{ color: commitMsg.startsWith('✅') ? '#2d9d5e' : 'var(--badge-rejected)', fontSize: '0.875rem' }}>{commitMsg}</p>}
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCommit} disabled={committing}>
                {committing ? <><Loader className="spin" size={18} /> Committing...</> : <><GitBranch size={18} /> Commit Version</>}
              </button>
            </div>
            <div className="input-group">
              <label>Dataset JSONL</label>
              <textarea className="input-field" rows={12} value={commitData.jsonl} onChange={e => setCommitData(d => ({ ...d, jsonl: e.target.value }))}
                placeholder={'{"instruction": "...", "response": "...", "score": 8.1}'}
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', resize: 'none', height: '90%' }} />
            </div>
          </div>
        </div>
      )}

      {tab === 'diff' && (
        <div className="surface-card">
          <h2><Diff size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Compare Two Versions</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="input-group"><label>Version A</label>
              <select className="input-field" value={diffA} onChange={e => setDiffA(e.target.value)}>
                <option value="">Select version...</option>
                {versions.map(v => <option key={v.version_id} value={v.version_id}>{v.name} ({v.version_id})</option>)}
              </select></div>
            <div className="input-group"><label>Version B</label>
              <select className="input-field" value={diffB} onChange={e => setDiffB(e.target.value)}>
                <option value="">Select version...</option>
                {versions.map(v => <option key={v.version_id} value={v.version_id}>{v.name} ({v.version_id})</option>)}
              </select></div>
          </div>
          <button className="btn btn-primary" onClick={handleDiff} disabled={!diffA || !diffB}>Compare Versions</button>
          {diffResult && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
                {[['Added', diffResult.added, '#2d9d5e'], ['Removed', diffResult.removed, 'var(--badge-rejected)'], ['Changed', diffResult.changed, '#e07b00'], ['Unchanged', diffResult.unchanged, 'var(--charcoal)']].map(([label, val, color]) => (
                  <div key={label} style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-bone)', borderRadius: 10 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color, fontFamily: 'Bricolage Grotesque' }}>{val}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--charcoal)' }}>{label}</div>
                  </div>
                ))}
              </div>
              {diffResult.sample_added?.length > 0 && (
                <div><h4 style={{ color: '#2d9d5e', marginBottom: '0.5rem' }}>Sample Added Rows</h4>
                  {diffResult.sample_added.map((r, i) => <div key={i} style={{ background: '#e6f7ee', padding: '0.5rem 0.75rem', borderRadius: 8, marginBottom: '0.4rem', fontSize: '0.8rem' }}>{r.instruction?.substring(0, 80)}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
