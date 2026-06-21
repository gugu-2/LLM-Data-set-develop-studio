import { useState, useCallback, useRef } from 'react';
import {
  Layers, CheckSquare, Square, Download, ChevronDown, ChevronUp,
  Loader, Sparkles, AlertTriangle, RefreshCw, FileText, Database,
  Globe, Type, FileUp, Box
} from 'lucide-react';

const API = 'http://localhost:8000/api';

// ─── Dataset Format Config ────────────────────────────────────────────────────
const FORMAT_META = {
  instruction: {
    label: 'Instruction', icon: '✍️', color: '#4868ff', bg: '#eef1ff',
    description: 'Instruction → Response. Best for task-following models.',
    schema: ['instruction', 'response'],
  },
  chat: {
    label: 'Chat', icon: '💬', color: '#10b981', bg: '#ecfdf5',
    description: 'Multi-turn conversations. Best for chatbots & dialogue.',
    schema: ['messages[]'],
  },
  dpo: {
    label: 'Preference / DPO', icon: '⚖️', color: '#f59e0b', bg: '#fffbeb',
    description: 'Chosen vs Rejected pairs. Best for RLHF alignment.',
    schema: ['prompt', 'chosen', 'rejected'],
  },
  qa: {
    label: 'Question–Answer', icon: '❓', color: '#8b5cf6', bg: '#f5f3ff',
    description: 'Factual Q&A with source context. Best for RAG systems.',
    schema: ['question', 'answer', 'context'],
  },
  completion: {
    label: 'Completion', icon: '📝', color: '#ec4899', bg: '#fdf2f8',
    description: 'Text continuation. Best for base model pretraining.',
    schema: ['text'],
  },
  classification: {
    label: 'Classification', icon: '🏷️', color: '#ea2804', bg: '#fff1f0',
    description: 'Text + label. Best for sentiment, intent, topic detection.',
    schema: ['text', 'label', 'label_id'],
  },
};

const DOMAINS = ['general', 'technology', 'science', 'medical', 'legal', 'finance', 'education', 'retail', 'entertainment'];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FormatCard({ id, meta, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(id)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '0.875rem 1rem', borderRadius: '10px', cursor: 'pointer', width: '100%',
        border: selected ? `2px solid ${meta.color}` : '2px solid var(--hairline)',
        background: selected ? meta.bg : 'var(--surface-card)',
        transition: 'all 0.2s ease', textAlign: 'left',
      }}
    >
      <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>{meta.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: selected ? meta.color : 'var(--ink)', fontSize: '0.9rem' }}>
            {meta.label}
          </div>
          {selected ? <CheckSquare size={16} color={meta.color} /> : <Square size={16} color="var(--charcoal)" />}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--charcoal)', marginTop: '0.2rem', lineHeight: 1.4 }}>
          {meta.description}
        </div>
      </div>
    </button>
  );
}

function ResultSection({ formatId, rows, meta }) {
  const [expanded, setExpanded] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (i) => setExpandedRows(p => ({ ...p, [i]: !p[i] }));

  const downloadFormat = () => {
    const lines = rows.map(r => JSON.stringify(r)).join('\n');
    const blob = new Blob([lines], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `hypasia_${formatId}_dataset.jsonl`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ border: `2px solid ${meta.color}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.25rem', background: meta.bg, cursor: 'pointer',
      }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span>{meta.icon}</span>
          <span style={{ fontWeight: 700, color: meta.color }}>{meta.label}</span>
          <span style={{ background: meta.color, color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
            {rows.length} rows
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={e => { e.stopPropagation(); downloadFormat(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.3rem 0.75rem', borderRadius: '6px', border: `1px solid ${meta.color}`,
              background: 'white', color: meta.color, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Download size={13} /> Download
          </button>
          {expanded ? <ChevronUp size={18} color={meta.color} /> : <ChevronDown size={18} color={meta.color} />}
        </div>
      </div>

      {expanded && (
        <div style={{ background: 'var(--surface-card)' }}>
          {rows.map((row, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--hairline)' }}>
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 1.25rem', cursor: 'pointer',
                  background: expandedRows[i] ? 'var(--surface-bone)' : 'transparent',
                }}
                onClick={() => toggleRow(i)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getRowPreview(formatId, row)}
                  </span>
                  {row.source && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--mute)' }}>Source: {row.source}</span>
                  )}
                </div>
                {expandedRows[i] ? <ChevronUp size={14} style={{flexShrink:0}}/> : <ChevronDown size={14} style={{flexShrink:0}}/>}
              </div>
              {expandedRows[i] && (
                <div style={{ padding: '0 1.25rem 1rem' }}>
                  <pre style={{
                    background: '#1e1e2e', color: '#cdd6f4', padding: '0.875rem',
                    borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto',
                    fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {JSON.stringify(row, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getRowPreview(formatId, row) {
  switch (formatId) {
    case 'instruction': return `"${(row.instruction || '').slice(0, 60)}..."`;
    case 'chat': return `${row.messages?.length || 0} messages`;
    case 'dpo': return `"${(row.prompt || '').slice(0, 55)}..."`;
    case 'qa': return `"${(row.question || '').slice(0, 60)}..."`;
    case 'completion': return `"${(row.text || '').slice(0, 60)}..."`;
    case 'classification': return `label: "${row.label}" — "${(row.text || '').slice(0, 45)}..."`;
    default: return JSON.stringify(row).slice(0, 70);
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DatasetConverter() {
  const [selectedFormats, setSelectedFormats] = useState(['instruction', 'qa']);
  const [sourceType, setSourceType] = useState('text'); // text, url, file, hf
  
  // Inputs
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [inputFile, setInputFile] = useState(null);
  const [inputHF, setInputHF] = useState('');
  const fileInputRef = useRef(null);

  const [domain, setDomain] = useState('general');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');

  const settings = JSON.parse(localStorage.getItem('hypasia_settings') || '{}');
  const apiKey = settings.gemini_api_key || '';

  const toggleFormat = useCallback((id) => {
    setSelectedFormats(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  const selectAll = () => setSelectedFormats(Object.keys(FORMAT_META));
  const selectNone = () => setSelectedFormats([]);

  const handleExtract = async () => {
    if (!selectedFormats.length) { setError('Select at least one output format.'); return; }
    if (!apiKey) { setError('Add your Gemini API key in Settings first.'); return; }
    
    setError(''); 
    setLoading(true); 
    setResults({ instruction: [], chat: [], dpo: [], qa: [], completion: [], classification: [] });
    setProgressMsg('Initializing extraction...');

    try {
      let endpoint = '';
      let options = {
        method: 'POST',
        headers: { 'Accept': 'application/x-ndjson' }
      };

      if (sourceType === 'text') {
        if (!inputText.trim()) throw new Error('Please paste some text.');
        endpoint = '/extract/from-text';
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({ text: inputText, formats: selectedFormats, domain, api_key: apiKey });
      } else if (sourceType === 'url') {
        if (!inputUrl.trim()) throw new Error('Please enter a URL.');
        endpoint = '/extract/from-url';
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({ url: inputUrl, formats: selectedFormats, domain, api_key: apiKey });
      } else if (sourceType === 'file') {
        if (!inputFile) throw new Error('Please upload a file.');
        endpoint = '/extract/from-file';
        const formData = new FormData();
        formData.append('file', inputFile);
        formData.append('formats', selectedFormats.join(','));
        formData.append('domain', domain);
        formData.append('api_key', apiKey);
        options.body = formData;
        // don't set Content-Type, browser will set multipart with boundary
      } else if (sourceType === 'hf') {
        if (!inputHF.trim()) throw new Error('Please enter a HuggingFace dataset ID.');
        endpoint = '/extract/from-huggingface';
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({ dataset: inputHF, formats: selectedFormats, domain, api_key: apiKey });
      }

      const res = await fetch(`${API}${endpoint}`, options);
      
      if (!res.ok) {
        let msg = res.statusText;
        try { const errData = await res.json(); msg = errData.detail || msg; } catch (e) { /* ignore */ }
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep last partial line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.event === 'progress') {
              setProgressMsg(`Processing chunk ${data.chunk} of ${data.total} (${data.source})...`);
            } else if (data.event === 'row') {
              const fmt = data.format;
              if (fmt) {
                setResults(prev => {
                  const updated = { ...prev };
                  if (!updated[fmt]) updated[fmt] = [];
                  const { event, format, ...rowContent } = data;
                  updated[fmt] = [...updated[fmt], rowContent];
                  return updated;
                });
              }
            } else if (data.event === 'error') {
              console.warn("Extraction error chunk:", data.message);
            }
          } catch (e) {
            console.error("Failed to parse NDJSON line:", line, e);
          }
        }
      }
      setProgressMsg('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalRows = results ? Object.values(results).reduce((sum, rows) => sum + rows.length, 0) : 0;
  const hasResults = totalRows > 0 || (results && !loading);

  const downloadAll = () => {
    if (!results) return;
    const allLines = [];
    for (const [fmt, rows] of Object.entries(results)) {
      for (const row of rows) {
        allLines.push(JSON.stringify({ dataset_type: fmt, ...row }));
      }
    }
    const blob = new Blob([allLines.join('\n')], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'hypasia_universal_dataset.jsonl'; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'text', label: 'Raw Text', icon: <Type size={16}/> },
    { id: 'url', label: 'URL / Web', icon: <Globe size={16}/> },
    { id: 'file', label: 'File Upload', icon: <FileUp size={16}/> },
    { id: 'hf', label: 'HuggingFace', icon: <Box size={16}/> },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Layers size={32} color="var(--primary)" />
          <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem' }}>Universal Extractor</h1>
        </div>
        <p style={{ color: 'var(--charcoal)', maxWidth: '720px', lineHeight: 1.6 }}>
          Transform <strong>ANY</strong> source — Wikipedia, PDFs, HuggingFace datasets, YouTube URLs — into{' '}
          6 different training dataset formats simultaneously. One source → many datasets.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT — Input Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Source Selector */}
          <div className="surface-card" style={{ padding: '0' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--hairline)' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSourceType(tab.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    padding: '0.875rem 0', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    background: 'transparent', border: 'none',
                    borderBottom: sourceType === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                    color: sourceType === tab.id ? 'var(--primary)' : 'var(--charcoal)',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '1.25rem' }}>
              {sourceType === 'text' && (
                <textarea
                  value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Paste any raw text here..."
                  style={{ width: '100%', minHeight: 120, resize: 'vertical', border: '1px solid var(--hairline)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', fontFamily: 'Inter', color: 'var(--ink)' }}
                />
              )}
              {sourceType === 'url' && (
                <div>
                  <input
                    type="url" value={inputUrl} onChange={e => setInputUrl(e.target.value)}
                    placeholder="https://en.wikipedia.org/wiki/Artificial_intelligence"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--hairline)', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--mute)', marginTop: '0.5rem' }}>Supports: Web pages, Wikipedia, YouTube video links</div>
                </div>
              )}
              {sourceType === 'file' && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    border: '2px dashed var(--hairline)', borderRadius: '8px', padding: '2rem 1rem', 
                    textAlign: 'center', cursor: 'pointer', background: 'var(--canvas)' 
                  }}
                >
                  <FileUp size={24} color="var(--charcoal)" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{inputFile ? inputFile.name : 'Click to select a file'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--mute)' }}>Supports PDF, DOCX, CSV, TXT, or .txt list of URLs</div>
                  <input type="file" ref={fileInputRef} onChange={e => setInputFile(e.target.files[0])} style={{ display: 'none' }} />
                </div>
              )}
              {sourceType === 'hf' && (
                <div>
                  <input
                    type="text" value={inputHF} onChange={e => setInputHF(e.target.value)}
                    placeholder="e.g., tatsu-lab/alpaca or squad"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--hairline)', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--mute)', marginTop: '0.5rem' }}>Will fetch rows and re-extract them into your selected formats</div>
                </div>
              )}
            </div>
          </div>

          {/* Settings: Domain & Formats */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="surface-card" style={{ flex: 1 }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Domain</h3>
              <select value={domain} onChange={e => setDomain(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--hairline)', borderRadius: '6px', fontSize: '0.85rem' }}>
                {DOMAINS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <h3 style={{ fontSize: '0.9rem', margin: 0 }}>Target Formats</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={selectAll} style={{ fontSize: '0.7rem', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>All</button>
                <span style={{ color: 'var(--mute)' }}>·</span>
                <button onClick={selectNone} style={{ fontSize: '0.7rem', color: 'var(--charcoal)', border: 'none', background: 'none', cursor: 'pointer' }}>None</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(FORMAT_META).map(([id, meta]) => (
                <FormatCard key={id} id={id} meta={meta} selected={selectedFormats.includes(id)} onToggle={toggleFormat} />
              ))}
            </div>
          </div>

          {/* Action */}
          {error && (
            <div style={{ background: '#fff1f0', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', color: '#991b1b', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <button
            onClick={handleExtract}
            disabled={loading || !selectedFormats.length}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
              padding: '1rem', borderRadius: '10px', background: loading ? 'var(--charcoal)' : 'var(--primary)',
              color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'Bricolage Grotesque, sans-serif',
            }}
          >
            {loading
              ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Extracting...</>
              : <><Sparkles size={18} /> Run Universal Extraction</>
            }
          </button>
        </div>

        {/* RIGHT — Results Panel */}
        <div>
          {!hasResults && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--charcoal)', background: 'var(--surface-bone)', borderRadius: '12px', border: '2px dashed var(--hairline)' }}>
              <Layers size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>No Extraction Yet</div>
              <div style={{ fontSize: '0.85rem', maxWidth: '300px', textAlign: 'center', marginTop: '0.5rem' }}>
                Select a source on the left, pick your target formats, and click Run.
              </div>
            </div>
          )}

          {(loading || hasResults) && (
            <div>
              {/* Summary bar */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#1e1e2e', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Rows</div>
                    <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Bricolage Grotesque' }}>
                      {loading && totalRows === 0 ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : totalRows}
                    </div>
                  </div>
                  {progressMsg && (
                    <div style={{ color: '#a6e3a1', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={12} style={{ animation: 'spin 2s linear infinite' }}/>
                      {progressMsg}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <button
                    onClick={() => { setResults(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.875rem', borderRadius: '7px',
                      border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', cursor: 'pointer',
                    }}
                  ><RefreshCw size={13} /> Clear</button>
                  <button
                    onClick={downloadAll} disabled={totalRows === 0}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.875rem', borderRadius: '7px',
                      border: 'none', background: totalRows > 0 ? 'var(--primary)' : 'var(--charcoal)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: totalRows > 0 ? 'pointer' : 'not-allowed',
                    }}
                  ><Download size={13} /> Download All</button>
                </div>
              </div>

              {/* Result sections per format */}
              {results && Object.entries(results).map(([fmt, rows]) =>
                rows.length > 0 ? <ResultSection key={fmt} formatId={fmt} rows={rows} meta={FORMAT_META[fmt]} /> : null
              )}

              {!loading && totalRows === 0 && results && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--charcoal)', background: 'var(--surface-bone)', borderRadius: '10px' }}>
                  <FileText size={36} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                  <div style={{ fontWeight: 600 }}>No rows generated</div>
                  <div style={{ fontSize: '0.85rem' }}>Try a different source or format.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
