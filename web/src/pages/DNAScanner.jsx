import { useState, useRef } from 'react';
import { Fingerprint, UploadCloud, FileJson, AlertCircle, Loader, Search, ShieldCheck, ShieldAlert, BarChart3 } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function DNAScanner() {
  const [file, setFile] = useState(null);
  const [marketplaceId, setMarketplaceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleScan = async () => {
    if (!file) { setError('Please upload your local dataset.'); return; }
    if (!marketplaceId.trim()) { setError('Please enter a Marketplace ID to compare against.'); return; }
    
    setError('');
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('marketplace_id', marketplaceId);

    try {
      const res = await fetch(`${API}/dna/compare`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to analyze DNA');
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <Fingerprint size={32} color="var(--primary)" />
        <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem', textAlign: 'center' }}>Dataset DNA Checker</h1>
      </div>
      <p style={{ color: 'var(--charcoal)', textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
        Don't buy data you already own! Compare your local dataset against items on the Marketplace. We compute a cryptographic DNA similarity score to detect hidden overlaps.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left: Input */}
        <div className="surface-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>1. Upload Your Local Dataset</h2>
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--hairline)', borderRadius: '12px', padding: '2rem 1.5rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', background: file ? '#f0f4ff' : 'transparent', borderColor: file ? 'var(--primary)' : 'var(--hairline)',
              transition: 'all 0.2s', marginBottom: '2rem', textAlign: 'center'
            }}
          >
            <input 
              type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json,.jsonl"
              onChange={e => { if(e.target.files?.[0]) setFile(e.target.files[0]) }}
            />
            {file ? (
              <>
                <FileJson size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>{file.name}</div>
                <div style={{ color: 'var(--charcoal)', fontSize: '0.85rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </>
            ) : (
              <>
                <UploadCloud size={40} color="var(--mute)" style={{ marginBottom: '1rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.25rem' }}>Click to select JSON/JSONL</div>
              </>
            )}
          </div>

          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>2. Enter Target Marketplace ID</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-bone)', padding: '0.75rem 1rem', borderRadius: '8px', flex: 1, border: '1px solid var(--hairline)' }}>
              <Search size={16} color="var(--mute)" style={{ marginRight: '0.5rem' }} />
              <input 
                type="text" value={marketplaceId} onChange={e => setMarketplaceId(e.target.value)}
                placeholder="e.g. data-corp/medical-qa-v2"
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'Inter', fontSize: '0.95rem' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '8px', color: '#991b1b', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }}/>
              <span style={{ fontSize: '0.85rem' }}>{error}</span>
            </div>
          )}

          <button
            onClick={handleScan} disabled={!file || !marketplaceId.trim() || loading}
            style={{
              width: '100%', padding: '1rem', background: (!file || !marketplaceId.trim() || loading) ? 'var(--surface-bone)' : 'var(--ink)',
              color: (!file || !marketplaceId.trim() || loading) ? 'var(--mute)' : '#fff', border: 'none', borderRadius: '8px',
              fontWeight: 700, fontSize: '1rem', cursor: (!file || !marketplaceId.trim() || loading) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            {loading ? <Loader className="spin" size={18} /> : <Fingerprint size={18} />}
            {loading ? 'Computing Overlap...' : 'Run DNA Comparison'}
          </button>
        </div>

        {/* Right: Results */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div className="surface-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)' }}>
              <Loader className="spin" size={48} style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Analyzing Embeddings...</div>
              <div style={{ fontSize: '0.85rem' }}>Calculating Jaccard similarity across {file?.name}</div>
            </div>
          ) : result ? (
            <div className="surface-card fade-in" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--hairline)', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Analysis Results</h3>
                <span style={{ background: 'var(--surface-bone)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'monospace' }}>
                  {result.marketplace_id}
                </span>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: `12px solid ${result.color === 'green' ? '#10b981' : result.color === 'red' ? '#ef4444' : '#f59e0b'}`, marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'Bricolage Grotesque', color: 'var(--ink)' }}>
                    {result.similarity_score}%
                  </div>
                  <div style={{ position: 'absolute', bottom: '30px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase' }}>Overlap</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '30px', background: result.color === 'green' ? '#ecfdf5' : result.color === 'red' ? '#fef2f2' : '#fffbeb', color: result.color === 'green' ? '#059669' : result.color === 'red' ? '#dc2626' : '#d97706', fontWeight: 700, marginBottom: '1rem' }}>
                  {result.color === 'green' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                  {result.risk_level}
                </div>
                <p style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '1rem', margin: 0 }}>{result.message}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--hairline)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', fontWeight: 600, textTransform: 'uppercase' }}>Local Rows</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)' }}>{result.stats.user_rows.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', fontWeight: 600, textTransform: 'uppercase' }}>Overlapping Tokens</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)' }}>{result.stats.overlapping_tokens.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="surface-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)' }}>
              <BarChart3 size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <h3 style={{ margin: 0, color: 'var(--charcoal)' }}>Ready to Scan</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '300px', textAlign: 'center' }}>Provide inputs and click "Run DNA Comparison" to see results.</p>
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
