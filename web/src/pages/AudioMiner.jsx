import { useState } from 'react';
import { Headphones, PlayCircle as Youtube, Upload, FileAudio, Loader, CheckCircle2, AlertTriangle, Download, PlayCircle } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function AudioMiner() {
  const [activeTab, setActiveTab] = useState('youtube');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [sourceData, setSourceData] = useState(null);

  const handleExtractYouTube = async () => {
    if (!url.trim()) { setError('Please enter a YouTube URL'); return; }
    setError(''); setResults([]); setLoading(true); setSourceData(null);
    try {
      const res = await fetch(`${API}/mine/audio/youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, language: 'en' })
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to extract audio');
      const data = await res.json();
      setResults(data.results);
      setSourceData({ type: 'youtube', url: data.source });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractUpload = async () => {
    if (!file) { setError('Please select an audio file'); return; }
    setError(''); setResults([]); setLoading(true); setSourceData(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', 'en');

    try {
      const res = await fetch(`${API}/mine/audio/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to process file');
      const data = await res.json();
      setResults(data.results);
      setSourceData({ type: 'file', filename: data.source });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadJSONL = () => {
    if (!results.length) return;
    const jsonl = results.map(r => JSON.stringify({ instruction: r.instruction, response: r.response, source: sourceData.url || sourceData.filename, timestamp: r.timestamp })).join('\n');
    const blob = new Blob([jsonl], { type: 'application/jsonl' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u; a.download = 'audio_dataset.jsonl'; a.click();
    URL.revokeObjectURL(u);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Headphones size={32} color="var(--primary)" />
        <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem' }}>Voice & Audio Miner</h1>
      </div>
      <p style={{ color: 'var(--charcoal)', maxWidth: '700px', lineHeight: 1.6, marginBottom: '2rem' }}>
        Extract high-quality fine-tuning pairs directly from spoken knowledge. Paste a YouTube URL or upload a podcast MP3, and our Whisper engine will transcribe and chunk it into instruction/response pairs.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left column: Input */}
        <div className="surface-card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--hairline)', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setActiveTab('youtube')}
              style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'youtube' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'youtube' ? 'var(--ink)' : 'var(--mute)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Youtube size={18} /> YouTube URL
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'upload' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'upload' ? 'var(--ink)' : 'var(--mute)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Upload size={18} /> Upload MP3/WAV
            </button>
          </div>

          {activeTab === 'youtube' ? (
            <div className="fade-in">
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.5rem' }}>YouTube Video URL</label>
              <input 
                type="text" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--hairline)', marginBottom: '1.5rem' }}
              />
              <button 
                onClick={handleExtractYouTube} disabled={loading || !url.trim()}
                style={{ width: '100%', padding: '1rem', background: loading || !url.trim() ? 'var(--surface-bone)' : 'var(--ink)', color: loading || !url.trim() ? 'var(--mute)' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: loading || !url.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? <Loader className="spin" size={18} /> : <Headphones size={18} />}
                {loading ? 'Transcribing with Whisper...' : 'Extract Knowledge'}
              </button>
            </div>
          ) : (
            <div className="fade-in">
              <div 
                style={{ border: '2px dashed var(--hairline)', borderRadius: '12px', padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem', background: file ? '#f0f4ff' : 'transparent', borderColor: file ? 'var(--primary)' : 'var(--hairline)' }}
              >
                <input type="file" id="audio-upload" style={{ display: 'none' }} accept=".mp3,.wav,.m4a" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                <label htmlFor="audio-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <FileAudio size={40} color={file ? "var(--primary)" : "var(--mute)"} style={{ marginBottom: '1rem' }} />
                  {file ? (
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{file.name} ({(file.size/1024/1024).toFixed(2)} MB)</span>
                  ) : (
                    <>
                      <span style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.25rem' }}>Click to upload audio file</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--mute)' }}>Supports .mp3, .wav, .m4a</span>
                    </>
                  )}
                </label>
              </div>
              <button 
                onClick={handleExtractUpload} disabled={loading || !file}
                style={{ width: '100%', padding: '1rem', background: loading || !file ? 'var(--surface-bone)' : 'var(--ink)', color: loading || !file ? 'var(--mute)' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: loading || !file ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? <Loader className="spin" size={18} /> : <Headphones size={18} />}
                {loading ? 'Transcribing with Whisper...' : 'Extract Knowledge'}
              </button>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '8px', color: '#991b1b', marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }}/>
              <span style={{ fontSize: '0.85rem' }}>{error}</span>
            </div>
          )}
        </div>

        {/* Right column: Results */}
        <div>
          {loading && (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)' }}>
              <Headphones className="spin" size={48} style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Running Whisper Model...</div>
              <div style={{ fontSize: '0.85rem' }}>Chunking audio and detecting speakers</div>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div style={{ height: '300px', border: '2px dashed var(--hairline)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)', padding: '2rem', textAlign: 'center' }}>
              <PlayCircle size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <h3 style={{ margin: 0, color: 'var(--charcoal)' }}>No audio extracted yet</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '300px' }}>Extracted pairs will appear here.</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Extracted Knowledge ({results.length})</h2>
                <button 
                  onClick={downloadJSONL}
                  style={{ background: 'var(--surface-bone)', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink)' }}
                >
                  <Download size={14} /> Download .jsonl
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {results.map((r, i) => (
                  <div key={i} className="surface-card" style={{ padding: '1.25rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', fontSize: '0.7rem', fontWeight: 700, background: '#fef08a', color: '#854d0e', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{r.timestamp}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.5rem', paddingRight: '3rem' }}>Q: {r.instruction}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--charcoal)', lineHeight: 1.5 }}>A: {r.response}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
