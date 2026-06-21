import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, Link as LinkIcon, Loader, FileJson, Activity, Clock, Play } from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';

const API_BASE = "http://localhost:8000/api/mine";

export default function DataMiner() {
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [datasetName, setDatasetName] = useState("hypasia_dataset");
  const [isDragging, setIsDragging] = useState(false);
  const [exportTier, setExportTier] = useState('all'); // 'all', 'gold_silver', 'gold'
  const [usePlaywright, setUsePlaywright] = useState(false);
  const [scrubPii, setScrubPii] = useState(false);
  const [languageFilter, setLanguageFilter] = useState("");
  const fileInputRef = useRef(null);

  const [streams, setStreams] = useState([]);
  const [streamUrl, setStreamUrl] = useState("");
  const [streamCron, setStreamCron] = useState("0 3 * * *");
  const [loadingStreams, setLoadingStreams] = useState(false);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/streams/list");
      setStreams(res.data.streams);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStream = async () => {
    if (!streamUrl) return;
    try {
      setLoadingStreams(true);
      await axios.post("http://localhost:8000/api/streams/add", {
        source_url: streamUrl,
        schedule: streamCron,
        target_dataset: datasetName,
        auto_wash: true
      });
      setStreamUrl("");
      fetchStreams();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStreams(false);
    }
  };

  const handleTriggerStream = async (id) => {
    try {
      const res = await axios.post(`http://localhost:8000/api/streams/trigger/${id}`);
      alert(res.data.message);
      fetchStreams();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRunUrl = async () => {
    if (!source) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await axios.post(`${API_BASE}/run`, {
        source,
        judge: apiKey ? "gemini" : "ollama",
        threshold: 7.0,
        api_key: apiKey || null,
        scrub_pii: scrubPii,
        language_filter: languageFilter,
        use_playwright: usePlaywright
      });
      setResults(res.data.rows);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // Check for images
    const isImage = /\.(png|jpe?g|webp)$/i.test(file.name);
    if (isImage && !apiKey) {
      alert("Please enter your Gemini API key in the Configuration section to process images using Vision AI.");
      return;
    }
    
    setLoading(true);
    setError("");
    setResults(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("judge", apiKey ? "gemini" : "ollama");
    formData.append("threshold", "7.0");
    if (apiKey) formData.append("api_key", apiKey);
    formData.append("scrub_pii", scrubPii);
    if (languageFilter) formData.append("language_filter", languageFilter);
    formData.append("use_playwright", usePlaywright);
    try {
      const res = await axios.post(`${API_BASE}/upload`, formData);
      setResults(res.data.rows);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    handleFileUpload(e.target.files[0]);
    // reset input so the same file can be re-uploaded
    e.target.value = null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleExport = async (format) => {
    if (!results) return;
    try {
      setLoading(true);
      const exportRows = results.filter(r => {
        if (exportTier === 'gold') return r.tier === 'Gold';
        if (exportTier === 'gold_silver') return r.tier === 'Gold' || r.tier === 'Silver';
        return true;
      });

      const res = await axios.post(`http://localhost:8000/api/export/dataset`, {
        rows: exportRows,
        filename: datasetName,
        format: format
      });
      alert(`Saved to ${res.data.path} on server.`);
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportDPO = async () => {
    if (!results) return;
    if (!apiKey) {
      alert("Please enter your Gemini API key in the Configuration section to generate DPO preference pairs.");
      return;
    }
    try {
      setLoading(true);
      // DPO uses Gold rows
      const goldRows = results.filter(r => r.tier === 'Gold');
      if (goldRows.length === 0) {
        setError("No Gold rows available to generate DPO pairs.");
        return;
      }
      
      const res = await axios.post(`${API_BASE}/augment/dpo_pairs`, {
        rows: goldRows,
        api_key: apiKey
      });
      
      const pairs = res.data.pairs;
      const jsonl = pairs.map(p => JSON.stringify(p)).join('\n');
      
      // Trigger download
      const blob = new Blob([jsonl], { type: 'application/jsonl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${datasetName}_dpo.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAnnotate = async () => {
    if (!results) return;
    try {
      setLoading(true);
      const res = await axios.post(`http://localhost:8000/api/annotate/session`, {
        rows: results,
        session_id: datasetName
      });
      alert(`Sent to Annotation Studio as session '${datasetName}'`);
    } catch (err) {
      alert("Failed to send: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitVersion = async () => {
    if (!results) return;
    try {
      setLoading(true);
      const res = await axios.post(`http://localhost:8000/api/versions/commit`, {
        rows: results,
        message: `Imported via DataMiner from ${source || 'file'}`,
        author: "admin"
      });
      alert(`Committed version ${res.data.id.substring(0,8)}`);
    } catch (err) {
      alert("Commit failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="display-font">Data Miner</h1>
      <p className="mb-4" style={{color: 'var(--charcoal)'}}>
        Turn any website, PDF, or HuggingFace repo into a scored, fine-tuning dataset.
      </p>

      <div className="surface-card mb-4 flex items-center gap-4" style={{padding: '1rem 1.5rem', flexWrap: 'wrap'}}>
        <label style={{fontSize: '0.875rem', fontWeight: 600}}>Gemini API Key (Optional)</label>
        <input 
          type="password" 
          placeholder="AIzaSy... (Uses local Ollama if empty)" 
          className="input-field" 
          value={apiKey} 
          onChange={e=>setApiKey(e.target.value)} 
          style={{width: '300px', padding: '0.5rem 1rem'}}
        />
        
        <div className="flex gap-2 items-center ml-auto">
          <label style={{fontSize: '0.875rem'}}><input type="checkbox" checked={scrubPii} onChange={e=>setScrubPii(e.target.checked)}/> Scrub PII</label>
          <input 
            type="text" 
            placeholder="Lang Filter (e.g. en,fr)" 
            className="input-field" 
            value={languageFilter} 
            onChange={e=>setLanguageFilter(e.target.value)}
            style={{width: '150px', padding: '0.5rem 1rem'}}
          />
          <label style={{fontSize: '0.875rem'}}><input type="checkbox" checked={usePlaywright} onChange={e=>setUsePlaywright(e.target.checked)}/> Use Playwright</label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* URL Input Card */}
        <div className="surface-card">
          <h2><LinkIcon size={20} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}}/> Crawl URL <InfoTooltip text="Extracts clean text from websites and automatically structures it into ML-ready instruction/response pairs." /></h2>
          <p className="mb-4" style={{fontSize: '0.875rem', color: 'var(--charcoal)'}}>
            Paste a Wikipedia link, documentation URL, or HuggingFace repo.
          </p>
          <div className="input-group">
            <input 
              type="text" 
              className="input-field" 
              placeholder="https://en.wikipedia.org/..." 
              value={source}
              onChange={e => setSource(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleRunUrl} disabled={loading || !source}>
            {loading ? <><Loader className="spin" size={18}/> Mining...</> : 'Start Mining'}
          </button>
        </div>

        {/* File Drop Card */}
        <div className="surface-card">
          <h2><Upload size={20} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}}/> Upload Document <InfoTooltip text="Parses unstructured files (PDFs, Docs, Images) into structured training data using AI OCR and heuristics." /></h2>
          <p className="mb-4" style={{fontSize: '0.875rem', color: 'var(--charcoal)'}}>
            Supports PDF, DOCX, CSV, TXT, JSONL, Parquet, PNG, JPG, WEBP.
          </p>
          <div 
            className={`drop-zone ${isDragging ? 'active' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <FileJson size={40} color="var(--primary)" style={{margin: '0 auto 1rem'}}/>
            <p>{isDragging ? 'Drop it!' : 'Click to upload or drag and drop'}</p>
            <p style={{fontSize: '0.75rem', color: 'var(--charcoal)', marginTop: '0.5rem'}}>
              Drop a .txt of URLs for Bulk Mining
            </p>
            <input 
              type="file" 
              accept=".pdf,.docx,.txt,.csv,.jsonl,.parquet,.png,.jpg,.jpeg,.webp"
              ref={fileInputRef} 
              style={{display: 'none'}} 
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Autonomous Streams Section */}
      <div className="surface-card mb-4" style={{ border: '1px solid #10b981' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} /> Autonomous Real-Time Streams <InfoTooltip text="Set up a cron job to automatically scrape live feeds (like RSS or Reddit), wash IP, and inject data continuously." />
          </h2>
        </div>
        <p className="mb-4" style={{fontSize: '0.875rem', color: 'var(--charcoal)'}}>
          Configure an autonomous pipeline that wakes up on a schedule (e.g. daily at 3:00 AM), scrapes a live feed like Reddit or an RSS, runs it through the IP Washer, and invisibly injects the new data into your live fine-tuning dataset.
        </p>

        <div className="flex gap-4 mb-6">
          <input 
            type="text" className="input-field" placeholder="Target Source (e.g., https://reddit.com/r/MachineLearning)" 
            value={streamUrl} onChange={e => setStreamUrl(e.target.value)} style={{flex: 2}}
          />
          <input 
            type="text" className="input-field" placeholder="CRON (0 3 * * *)" 
            value={streamCron} onChange={e => setStreamCron(e.target.value)} style={{flex: 1}}
          />
          <button className="btn" style={{ background: '#10b981', color: '#fff', border: 'none' }} onClick={handleAddStream} disabled={loadingStreams || !streamUrl}>
            {loadingStreams ? 'Configuring...' : 'Activate Autonomous Pipeline'}
          </button>
        </div>

        {streams.length > 0 && (
          <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--hairline)', overflow: 'hidden' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead style={{ background: 'var(--surface-bone)' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>Source Feed</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>Schedule</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>Last Run</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {streams.map(s => (
                  <tr key={s.id}>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)', fontWeight: 500 }}>{s.source_url}</td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>{s.schedule}</td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}><span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#10b981'}}/>{s.status}</span></td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)', color: 'var(--mute)' }}>{s.last_run} ({s.last_yield} rows)</td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>
                      <button onClick={() => handleTriggerStream(s.id)} style={{ background: 'none', border: '1px solid var(--hairline)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <Play size={14} /> Simulate Run
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="surface-card mb-4" style={{borderColor: 'var(--badge-rejected)'}}>
          <h3 style={{color: 'var(--badge-rejected)'}}>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="surface-card mb-4 text-center">
          <Loader className="spin" size={32} color="var(--primary)" style={{margin: '0 auto 1rem'}}/>
          <h3>Processing Pipeline...</h3>
          <p style={{color: 'var(--charcoal)'}}>Mining → Cleaning → Deduping → AI Scoring</p>
          <div className="progress-container">
            <div className="progress-bar"><div className="progress-fill" style={{width: '60%', animation: 'pulse 2s infinite'}}></div></div>
          </div>
        </div>
      )}

      {results && (
        <div className="surface-card">
          <div className="flex justify-between items-center mb-4">
            <h2>Results ({results.length} rows kept)</h2>
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                className="input-field" 
                value={datasetName} 
                onChange={e => setDatasetName(e.target.value)} 
                style={{width: '150px', padding: '0.5rem 1rem'}}
              />
              <select 
                className="input-field" 
                value={exportTier} 
                onChange={e => setExportTier(e.target.value)}
                style={{padding: '0.5rem', width: 'auto'}}
              >
                <option value="all">Unfiltered (All Tiers)</option>
                <option value="gold_silver">Gold + Silver Only</option>
                <option value="gold">Gold Only</option>
              </select>
              <button className="btn btn-outline" style={{padding: '0.5rem'}} onClick={() => handleExport('jsonl')}>.JSONL</button>
              <button className="btn btn-outline" style={{padding: '0.5rem'}} onClick={() => handleExport('parquet')}>.Parquet</button>
              <button className="btn btn-outline" style={{padding: '0.5rem', borderColor: 'var(--accent)', color: 'var(--accent)'}} onClick={handleExportDPO}>DPO Pairs</button>
              <button className="btn btn-primary" style={{padding: '0.5rem'}} onClick={handleSendToAnnotate}>Annotate</button>
              <button className="btn btn-primary" style={{padding: '0.5rem'}} onClick={handleCommitVersion}>Commit</button>
            </div>
          </div>
          
          <div style={{maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {results.map((r, i) => (
              <div key={i} style={{background: 'var(--surface-bone)', padding: '1rem', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline)'}}>
                <div className="flex justify-between mb-2">
                  <span className={`badge ${r.tier}`}>{r.tier} • Score: {r.score}</span>
                  <span style={{fontSize: '0.75rem', color: 'var(--charcoal)'}}>{r.tokens} tokens</span>
                </div>
                <div className="mb-2" style={{color: 'var(--ink)'}}><strong>Instruct:</strong> {r.instruction}</div>
                <div style={{color: 'var(--charcoal)'}}><strong>Response:</strong> {r.response.substring(0, 150)}...</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
