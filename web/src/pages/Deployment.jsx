import { useState } from 'react';
import { Rocket, UploadCloud, Code, Loader, AlertTriangle, CheckCircle, ExternalLink, Download } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function Deployment() {
  const [hfToken, setHfToken] = useState('');
  const [repoId, setRepoId] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  
  const [deploying, setDeploying] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [hfUrl, setHfUrl] = useState('');
  const [script, setScript] = useState('');

  const settings = JSON.parse(localStorage.getItem('hypasia_settings') || '{}');
  
  const handleDeploy = async () => {
    if (!hfToken.trim()) { setError('Please enter your HuggingFace token.'); return; }
    if (!repoId.trim() || !repoId.includes('/')) { setError('Enter a valid repo ID like "username/my-model".'); return; }
    
    setError('');
    setSuccessMsg('');
    setDeploying(true);
    setScript('');
    setHfUrl('');

    try {
      // 1. Push to hub
      const pushRes = await fetch(`${API}/deploy/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hf_token: hfToken, repo_id: repoId, is_private: isPrivate })
      });
      if (!pushRes.ok) throw new Error((await pushRes.json()).detail || 'Failed to push to Hub');
      const pushData = await pushRes.json();
      setHfUrl(pushData.url);

      // 2. Generate API script
      const scriptRes = await fetch(`${API}/deploy/generate-api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hf_token: hfToken, repo_id: repoId })
      });
      if (!scriptRes.ok) throw new Error((await scriptRes.json()).detail || 'Failed to generate API script');
      const scriptData = await scriptRes.json();
      
      setScript(scriptData.script);
      setSuccessMsg('Model successfully deployed to HuggingFace Hub and API script generated!');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeploying(false);
    }
  };

  const downloadScript = () => {
    const blob = new Blob([script], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'app.py'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <Rocket size={32} color="var(--primary)" />
        <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem', textAlign: 'center' }}>One-Click Deploy</h1>
      </div>
      <p style={{ color: 'var(--charcoal)', textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
        Push your fine-tuned models directly to the HuggingFace Hub and instantly generate a production-ready FastAPI server to run inference.
      </p>

      <div className="surface-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadCloud size={20} color="var(--primary)" /> Push to HuggingFace Hub
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>HuggingFace Write Token (hf_...)</label>
            <input 
              type="password" value={hfToken} onChange={e => setHfToken(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxx"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--hairline)', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>Target Repository ID</label>
            <input 
              type="text" value={repoId} onChange={e => setRepoId(e.target.value)}
              placeholder="e.g. jdoe/my-awesome-llama-3"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--hairline)', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="private" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} style={{ width: '16px', height: '16px' }} />
            <label htmlFor="private" style={{ fontSize: '0.9rem', color: 'var(--ink)', cursor: 'pointer' }}>Make repository Private</label>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '8px', color: '#991b1b', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }}/>
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}
        
        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', padding: '1rem', borderRadius: '8px', color: '#065f46', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }}/>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        <button
          onClick={handleDeploy} disabled={deploying}
          style={{
            width: '100%', padding: '1rem', background: deploying ? 'var(--surface-bone)' : 'var(--ink)',
            color: deploying ? 'var(--mute)' : '#fff', border: 'none', borderRadius: '8px',
            fontWeight: 700, fontSize: '1rem', cursor: deploying ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s'
          }}
        >
          {deploying ? <Loader className="spin" size={18} /> : <Rocket size={18} />}
          {deploying ? 'Pushing to Hub...' : 'Deploy Model'}
        </button>

        {hfUrl && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href={hfUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', textDecoration: 'none' }}>
              View on HuggingFace <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>

      {script && (
        <div className="surface-card fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code size={20} color="#8b5cf6" /> FastAPI Inference Server
            </h2>
            <button
              onClick={downloadScript}
              style={{
                background: '#8b5cf6', color: '#fff', border: 'none', padding: '0.5rem 1rem',
                borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <Download size={14} /> Download `app.py`
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)', marginBottom: '1rem' }}>
            Run this script on any machine with a GPU to start serving your model immediately:
            <code style={{ background: 'var(--surface-bone)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>pip install fastapi uvicorn transformers torch && python app.py</code>
          </p>
          <pre style={{
            background: '#1e1e2e', color: '#cdd6f4', padding: '1.25rem',
            borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto',
            fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5,
          }}>
            {script}
          </pre>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
