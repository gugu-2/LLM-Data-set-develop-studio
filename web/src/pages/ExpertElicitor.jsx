import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, FileText, CheckCircle, XCircle, Edit, Loader, Download } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/elicit';

export default function ExpertElicitor() {
  const [tab, setTab] = useState('transcript'); // 'audio' | 'transcript'
  const [apiKey, setApiKey] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [editResponse, setEditResponse] = useState('');
  const [approvals, setApprovals] = useState({});
  
  // Marketplace states
  const [showPublish, setShowPublish] = useState(false);
  const [publishForm, setPublishForm] = useState({ title: '', expert_name: '', domain: '', price: 50 });
  const [publishing, setPublishing] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleSubmit = async (file = null) => {
    setLoading(true);
    setError('');
    setPairs([]);
    setApprovals({});
    
    if (!apiKey) {
      if (!window.confirm("No Gemini API key provided. The elicitor will attempt to use local Ollama which may be slower or less accurate. Continue?")) {
        setLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('mode', tab);
    if (apiKey) formData.append('api_key', apiKey);
    if (tab === 'audio' && file) {
      formData.append('file', file);
    } else if (tab === 'transcript') {
      formData.append('text', transcriptText);
    }
    try {
      const res = await axios.post(`${API_BASE}/upload`, formData);
      setPairs(res.data.pairs || []);
      const init = {};
      (res.data.pairs || []).forEach((_, i) => { init[i] = 'pending'; });
      setApprovals(init);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleSubmit(file);
  };

  const handleAudioInput = (e) => {
    const file = e.target.files[0];
    if (file) handleSubmit(file);
  };

  const approve = (i) => setApprovals(a => ({ ...a, [i]: 'approved' }));
  const reject = (i) => setApprovals(a => ({ ...a, [i]: 'rejected' }));
  const startEdit = (i) => {
    setEditingIdx(i);
    setEditInstruction(pairs[i].instruction);
    setEditResponse(pairs[i].response);
  };
  const saveEdit = (i) => {
    const updated = [...pairs];
    updated[i] = { ...updated[i], instruction: editInstruction, response: editResponse };
    setPairs(updated);
    setApprovals(a => ({ ...a, [i]: 'approved' }));
    setEditingIdx(null);
  };

  const approvedPairs = pairs.filter((_, i) => approvals[i] === 'approved');

  const handleExport = () => {
    const lines = approvedPairs.map(p => JSON.stringify({ instruction: p.instruction, response: p.response })).join('\n');
    const blob = new Blob([lines], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expert_knowledge.jsonl';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    if (!publishForm.title || !publishForm.expert_name || !publishForm.domain) {
      alert("Please fill out all fields.");
      return;
    }
    setPublishing(true);
    try {
      await axios.post('http://localhost:8000/api/marketplace/publish', {
        ...publishForm,
        rows: approvedPairs
      });
      alert("Successfully published to the Marketplace!");
      setShowPublish(false);
    } catch (err) {
      alert("Publish failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="display-font">Expert Knowledge Elicitor</h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Record a domain expert. Auto-generate 500+ training pairs from their knowledge using AI pattern extraction.
      </p>

      {/* Step indicators */}
      <div className="flex gap-4 mb-4">
        {['Upload Audio / Transcript', 'Auto-Generate Pairs', 'Review & Export'].map((step, i) => (
          <div key={i} className="surface-card" style={{ flex: 1, textAlign: 'center', padding: '0.75rem', opacity: i === 0 || (i === 1 && loading) || (i === 2 && pairs.length > 0) ? 1 : 0.4 }}>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>{i + 1}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--charcoal)' }}>{step}</div>
          </div>
        ))}
      </div>

      <div className="surface-card mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>API Configuration</h3>
        <input 
          type="password" 
          placeholder="Gemini API Key (AIzaSy...)" 
          className="input-field" 
          value={apiKey} 
          onChange={e=>setApiKey(e.target.value)} 
          style={{width: '300px', padding: '0.5rem 1rem'}}
        />
      </div>

      {/* Upload Panel */}
      <div className="surface-card mb-4">
        <div className="flex gap-2 mb-4">
          <button className={`btn ${tab === 'transcript' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('transcript')}>
            <FileText size={16} /> Text Transcript
          </button>
          <button className={`btn ${tab === 'audio' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('audio')}>
            <Mic size={16} /> Audio File
          </button>
        </div>

        {tab === 'transcript' ? (
          <>
            <div className="input-group">
              <label>Paste your interview, lecture, or Q&A transcript here</label>
              <textarea
                className="input-field"
                placeholder="Interviewer: How do you typically diagnose this condition?&#10;Expert: Well, the first thing I look for is..."
                rows={10}
                value={transcriptText}
                onChange={e => setTranscriptText(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}
              />
            </div>
            <button className="btn btn-primary" onClick={() => handleSubmit()} disabled={loading || !transcriptText.trim()} style={{ width: '100%' }}>
              {loading ? <><Loader className="spin" size={18} /> Extracting knowledge patterns...</> : 'Extract Training Pairs'}
            </button>
          </>
        ) : (
          <>
            <div
              className="drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleAudioDrop}
            >
              <Mic size={40} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
              <p>Drop .mp3, .wav, or .m4a audio file</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--charcoal)', marginTop: '0.5rem' }}>
                Uses OpenAI Whisper for transcription (requires: pip install openai-whisper)
              </p>
              <input ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a,.ogg" style={{ display: 'none' }} onChange={handleAudioInput} />
            </div>
            {loading && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--charcoal)' }}>
                <Loader className="spin" size={24} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                <p>Transcribing audio and extracting knowledge patterns...</p>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="surface-card mb-4" style={{ borderColor: 'var(--badge-rejected)' }}>
          <h3 style={{ color: 'var(--badge-rejected)' }}>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {pairs.length > 0 && (
        <div className="surface-card">
          <div className="flex justify-between items-center mb-4">
            <h2>
              {pairs.length} pairs extracted
              <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: 'var(--charcoal)' }}>
                ✅ {approvedPairs.length} approved
              </span>
            </h2>
            <div className="flex gap-2">
              {approvedPairs.length > 0 && (
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={handleExport}>
                  <Download size={14} /> Export {approvedPairs.length} Approved
                </button>
              )}
              {approvedPairs.length > 0 && (
                <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => setShowPublish(!showPublish)}>
                  Publish to Marketplace
                </button>
              )}
            </div>
          </div>
          
          {showPublish && (
            <div className="surface-card mb-4" style={{ background: 'var(--surface-bone)' }}>
              <h3 className="mb-4">Publish Expert Dataset</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="input-group">
                  <label>Dataset Title</label>
                  <input className="input-field" value={publishForm.title} onChange={e => setPublishForm({...publishForm, title: e.target.value})} placeholder="e.g. Advanced Cardiology Q&A" />
                </div>
                <div className="input-group">
                  <label>Expert Name / Credentials</label>
                  <input className="input-field" value={publishForm.expert_name} onChange={e => setPublishForm({...publishForm, expert_name: e.target.value})} placeholder="e.g. Dr. Sarah Jenkins, MD" />
                </div>
                <div className="input-group">
                  <label>Domain</label>
                  <input className="input-field" value={publishForm.domain} onChange={e => setPublishForm({...publishForm, domain: e.target.value})} placeholder="e.g. Medical" />
                </div>
                <div className="input-group">
                  <label>Price ($)</label>
                  <input type="number" className="input-field" value={publishForm.price} onChange={e => setPublishForm({...publishForm, price: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--accent)', color: 'black' }} onClick={handlePublish} disabled={publishing}>
                {publishing ? <><Loader className="spin" size={16}/> Publishing...</> : 'Confirm & Publish'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
            {pairs.map((pair, i) => {
              const state = approvals[i];
              const borderColor = state === 'approved' ? '#2d9d5e' : state === 'rejected' ? 'var(--badge-rejected)' : 'var(--hairline)';
              return (
                <div key={i} style={{ background: 'var(--surface-bone)', padding: '1rem', borderRadius: 10, border: `1px solid ${borderColor}` }}>
                  {editingIdx === i ? (
                    <>
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem' }}>Instruction</label>
                        <textarea className="input-field" rows={2} value={editInstruction} onChange={e => setEditInstruction(e.target.value)} style={{ resize: 'none' }} />
                      </div>
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem' }}>Response</label>
                        <textarea className="input-field" rows={4} value={editResponse} onChange={e => setEditResponse(e.target.value)} style={{ resize: 'none' }} />
                      </div>
                      <button className="btn btn-primary" onClick={() => saveEdit(i)} style={{ padding: '0.4rem 1rem' }}>Save & Approve</button>
                    </>
                  ) : (
                    <>
                      <div className="mb-2" style={{ fontSize: '0.875rem' }}><strong>Instruction:</strong> {pair.instruction}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--charcoal)' }}><strong>Response:</strong> {pair.response.substring(0, 200)}{pair.response.length > 200 ? '...' : ''}</div>
                      <div className="flex gap-2" style={{ marginTop: '0.75rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderColor: '#2d9d5e', color: '#2d9d5e' }} onClick={() => approve(i)}><CheckCircle size={14} /> Approve</button>
                        <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => startEdit(i)}><Edit size={14} /> Edit</button>
                        <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--badge-rejected)', color: 'var(--badge-rejected)' }} onClick={() => reject(i)}><XCircle size={14} /> Reject</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
