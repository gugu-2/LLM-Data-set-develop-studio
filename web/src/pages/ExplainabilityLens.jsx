import { useState } from 'react';
import { Search, Eye, Activity, Database, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api';

export default function ExplainabilityLens() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("Hypasia AI's new multimodal capabilities represent a significant breakthrough in generative training algorithms, allowing for fully autonomous synthesis.");
  const [selectedToken, setSelectedToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attributions, setAttributions] = useState([]);

  const handleTokenClick = async (word) => {
    const cleanWord = word.replace(/[.,!?()[\]{}";:]/g, '');
    if (cleanWord.length < 2) return;
    
    setSelectedToken(cleanWord);
    setLoading(true);
    setAttributions([]);
    
    try {
      const res = await fetch(`${API}/lens/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanWord, context: inputText })
      });
      if (res.ok) {
        const data = await res.json();
        setAttributions(data.attributions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderText = () => {
    return inputText.split(' ').map((word, i) => {
      const clean = word.replace(/[.,!?()[\]{}";:]/g, '');
      const isSelected = selectedToken === clean;
      return (
        <span 
          key={i} 
          onClick={() => handleTokenClick(word)}
          style={{ 
            cursor: 'pointer', 
            padding: '2px 4px', 
            margin: '0 2px',
            borderRadius: '4px',
            background: isSelected ? '#8b5cf6' : 'transparent',
            color: isSelected ? '#fff' : 'inherit',
            transition: 'all 0.2s',
            display: 'inline-block'
          }}
          className={!isSelected ? 'hover-highlight' : ''}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem' }}>
      
      {/* Left Column: Input and Lens */}
      <div style={{ flex: '1', minWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#fdf4ff', padding: '1rem', borderRadius: '12px' }}>
            <Eye size={32} color="#d946ef" />
          </div>
          <div>
            <h1 className="display-font" style={{ margin: 0, fontSize: '2rem' }}>Explainability Lens</h1>
            <p style={{ color: 'var(--mute)', margin: '0.25rem 0 0 0' }}>White-Box Dataset Attribution</p>
          </div>
        </div>

        <div className="surface-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Model Generation Output</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertCircle size={14} /> Click any word to scan
            </span>
          </div>
          <textarea 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--hairline)', minHeight: '100px', marginBottom: '1rem', fontFamily: 'inherit', fontSize: '0.95rem' }}
          />
          <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', lineHeight: '1.8', fontSize: '1.1rem' }}>
            {renderText()}
          </div>
        </div>
      </div>

      {/* Right Column: Neural Weights & Dataset Attribution */}
      <div style={{ flex: '1', background: '#fff', border: '1px solid var(--hairline)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--hairline)', background: '#faf5ff', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Activity size={18} color="#d946ef" /> Neural Attribution Scanner
        </div>

        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {!selectedToken && !loading && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)', minHeight: '300px' }}>
              <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Select a generated token to reverse-search its origins.</p>
            </div>
          )}

          {loading && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#d946ef', minHeight: '300px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: '#d946ef', marginBottom: '1rem' }} />
              <p className="pulse" style={{ fontWeight: 600 }}>Tracing attention weights for "{selectedToken}"...</p>
            </div>
          )}

          {!loading && selectedToken && attributions.length > 0 && (
            <div className="fade-in">
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={18} /> Found {attributions.length} Highly Influential Rows
                </h3>
                <p style={{ color: 'var(--mute)', margin: 0, fontSize: '0.9rem' }}>The model generated <strong>"{selectedToken}"</strong> primarily because of these exact training pairs:</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {attributions.map((attr, i) => (
                  <div key={i} style={{ border: '1px solid var(--hairline)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hairline)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--mute)' }}>{attr.id}</span>
                      <span style={{ color: attr.influence > 0.5 ? '#10b981' : '#f59e0b' }}>
                        Influence: {(attr.influence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ padding: '1rem', fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#8b5cf6', marginRight: '0.5rem' }}>User:</span> 
                        {attr.instruction}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: '#10b981', marginRight: '0.5rem' }}>Assistant:</span> 
                        {attr.response}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!loading && selectedToken && attributions.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--mute)', marginTop: '4rem' }}>
              <p>No direct dataset attribution found for "{selectedToken}".</p>
              <p style={{ fontSize: '0.85rem' }}>This token may have been derived from pre-training base weights rather than fine-tuning.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        .hover-highlight:hover { background: #f3f4f6 !important; }
      `}</style>
    </div>
  );
}
