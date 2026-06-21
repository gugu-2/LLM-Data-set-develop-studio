import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Edit3, Download, Clock, Users, BarChart2, Keyboard } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function AnnotationStudio() {
  const [sessionName, setSessionName] = useState(() => 'session_' + Date.now());
  const [inputJsonl, setInputJsonl] = useState('');
  const [session, setSession] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editInstr, setEditInstr] = useState('');
  const [editResp, setEditResp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (!session || editMode) return;
      if (e.key === 'a') decide('approve');
      if (e.key === 'r') decide('reject');
      if (e.key === 'e') startEdit();
      if (e.key === 'ArrowRight' || e.key === 'n') nextRow();
      if (e.key === 'ArrowLeft' || e.key === 'p') setCurrentIdx(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, currentIdx, editMode]);

  const createSession = async () => {
    const rows = [];
    for (const line of inputJsonl.trim().split('\n')) {
      try { rows.push(JSON.parse(line)); } catch { }
    }
    if (!rows.length) return;
    setLoading(true);
    try {
      await axios.post(`${API}/annotate/session`, { rows, session_name: sessionName });
      await refreshSession();
      setCurrentIdx(0);
    } catch (e) { } finally { setLoading(false); }
  };

  const refreshSession = async () => {
    const res = await axios.get(`${API}/annotate/session/${sessionName}`);
    setSession(res.data);
  };

  const decide = async (decision) => {
    if (!session) return;
    await axios.post(`${API}/annotate/decide`, { session_name: sessionName, row_index: currentIdx, decision });
    await refreshSession();
    nextRow();
  };

  const startEdit = () => {
    if (!session) return;
    setEditInstr(session.rows[currentIdx]?.instruction || '');
    setEditResp(session.rows[currentIdx]?.response || '');
    setEditMode(true);
  };

  const saveEdit = async () => {
    await axios.post(`${API}/annotate/decide`, {
      session_name: sessionName, row_index: currentIdx, decision: 'edit',
      edited_instruction: editInstr, edited_response: editResp,
    });
    setEditMode(false);
    await refreshSession();
    nextRow();
  };

  const nextRow = () => setCurrentIdx(i => session ? Math.min(i + 1, session.total - 1) : 0);

  const handleExport = async () => {
    const res = await axios.get(`${API}/annotate/export/${sessionName}`);
    const lines = res.data.rows.map(r => JSON.stringify(r)).join('\n');
    const blob = new Blob([lines], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${sessionName}_approved.jsonl`; a.click();
    URL.revokeObjectURL(url);
  };

  const currentRow = session?.rows?.[currentIdx];
  const currentDecision = session?.decisions?.[String(currentIdx)]?.decision;
  const progress = session ? (session.annotated / session.total) * 100 : 0;

  return (
    <div className="fade-in">
      <h1 className="display-font">Annotation Studio</h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Review, approve, edit, or reject training pairs with keyboard shortcuts. Like Label Studio — natively integrated.
      </p>

      {!session ? (
        <div className="surface-card">
          <h2>Load Dataset into Studio</h2>
          <div className="input-group">
            <label>Session Name</label>
            <input className="input-field" value={sessionName} onChange={e => setSessionName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Paste JSONL dataset (one row per line)</label>
            <textarea className="input-field" rows={12} value={inputJsonl} onChange={e => setInputJsonl(e.target.value)}
              placeholder={'{"instruction": "...", "response": "...", "score": 8.1}'}
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', resize: 'vertical' }} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={createSession} disabled={loading}>
            {loading ? 'Loading...' : 'Start Annotation Session'}
          </button>
        </div>
      ) : (
        <>
          {/* Progress bar + stats */}
          <div className="surface-card mb-4">
            <div className="flex justify-between items-center mb-2">
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>✅ <strong>{session.approved}</strong> approved</span>
                <span style={{ fontSize: '0.875rem' }}>❌ <strong>{session.rejected}</strong> rejected</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--charcoal)' }}>{session.annotated} / {session.total} reviewed</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setShowKeyboard(v => !v)}>
                  <Keyboard size={14} /> Shortcuts
                </button>
                {session.approved > 0 && (
                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={handleExport}>
                    <Download size={14} /> Export {session.approved} Approved
                  </button>
                )}
              </div>
            </div>
            <div style={{ background: 'var(--hairline)', borderRadius: 10, height: 8, overflow: 'hidden' }}>
              <div style={{ background: 'var(--primary)', height: '100%', width: `${progress}%`, borderRadius: 10, transition: 'width 0.3s' }} />
            </div>
            {showKeyboard && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--charcoal)' }}>
                <span><kbd style={{ background: 'var(--surface-bone)', padding: '0 6px', borderRadius: 4, border: '1px solid var(--hairline)' }}>A</kbd> Approve</span>
                <span><kbd style={{ background: 'var(--surface-bone)', padding: '0 6px', borderRadius: 4, border: '1px solid var(--hairline)' }}>R</kbd> Reject</span>
                <span><kbd style={{ background: 'var(--surface-bone)', padding: '0 6px', borderRadius: 4, border: '1px solid var(--hairline)' }}>E</kbd> Edit</span>
                <span><kbd style={{ background: 'var(--surface-bone)', padding: '0 6px', borderRadius: 4, border: '1px solid var(--hairline)' }}>→</kbd> Next</span>
                <span><kbd style={{ background: 'var(--surface-bone)', padding: '0 6px', borderRadius: 4, border: '1px solid var(--hairline)' }}>←</kbd> Prev</span>
              </div>
            )}
          </div>

          {/* Main annotation card */}
          {currentRow && (
            <div className="surface-card" style={{ borderLeft: `4px solid ${currentDecision === 'approve' ? '#2d9d5e' : currentDecision === 'reject' ? 'var(--badge-rejected)' : 'var(--hairline)'}` }}>
              <div className="flex justify-between mb-4">
                <span style={{ color: 'var(--charcoal)', fontSize: '0.875rem' }}>Row {currentIdx + 1} / {session.total}</span>
                {currentDecision && <span style={{ fontWeight: 700, color: currentDecision === 'approve' ? '#2d9d5e' : 'var(--badge-rejected)' }}>{currentDecision === 'approve' ? '✅ APPROVED' : '❌ REJECTED'}</span>}
                {currentRow.score != null && <span className={`badge ${currentRow.tier || 'unscored'}`}>{currentRow.tier} · {Number(currentRow.score).toFixed(1)}</span>}
              </div>

              {editMode ? (
                <>
                  <div className="input-group"><label>Instruction</label>
                    <textarea className="input-field" rows={3} value={editInstr} onChange={e => setEditInstr(e.target.value)} style={{ resize: 'vertical' }} /></div>
                  <div className="input-group"><label>Response</label>
                    <textarea className="input-field" rows={6} value={editResp} onChange={e => setEditResp(e.target.value)} style={{ resize: 'vertical' }} /></div>
                  <div className="flex gap-2">
                    <button className="btn btn-primary" onClick={saveEdit}><CheckCircle size={16} /> Save & Approve</button>
                    <button className="btn btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'var(--surface-bone)', padding: '1rem', borderRadius: 10, marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>INSTRUCTION</p>
                    <p style={{ fontSize: '0.9rem' }}>{currentRow.instruction}</p>
                  </div>
                  <div style={{ background: 'var(--surface-bone)', padding: '1rem', borderRadius: 10, marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>RESPONSE</p>
                    <p style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{currentRow.response}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-primary" style={{ flex: 1, background: '#2d9d5e', borderColor: '#2d9d5e' }} onClick={() => decide('approve')}><CheckCircle size={18} /> Approve (A)</button>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={startEdit}><Edit3 size={18} /> Edit (E)</button>
                    <button className="btn btn-outline" style={{ flex: 1, borderColor: 'var(--badge-rejected)', color: 'var(--badge-rejected)' }} onClick={() => decide('reject')}><XCircle size={18} /> Reject (R)</button>
                  </div>
                  <div className="flex gap-2" style={{ marginTop: '0.75rem' }}>
                    <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}>← Previous</button>
                    <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem' }} onClick={nextRow}>Next →</button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
