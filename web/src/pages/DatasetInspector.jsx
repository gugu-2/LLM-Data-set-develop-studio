import { useState, useRef } from 'react';
import { Activity, UploadCloud, Loader, AlertTriangle, FileText, CheckCircle2, AlertCircle, Info, ThumbsUp, BarChart } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function DatasetInspector() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const handleAnalyze = async () => {
    if (!file) { setError('Please upload a dataset file (.json or .jsonl).'); return; }
    
    setError('');
    setLoading(true);
    setReport(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/inspector/analyze`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Analysis failed');
      }
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade === 'A') return '#059669'; // green
    if (grade === 'B') return '#10b981'; // light green
    if (grade === 'C') return '#f59e0b'; // amber
    if (grade === 'D') return '#d97706'; // orange
    return '#dc2626'; // red
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Activity size={32} color="var(--primary)" />
          <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem' }}>Dataset Health Inspector</h1>
        </div>
        <p style={{ color: 'var(--charcoal)', maxWidth: '700px', lineHeight: 1.6 }}>
          An MRI for your training data. Upload your `.json` or `.jsonl` dataset to automatically detect duplicates, length anomalies, and formatting errors before you waste money on fine-tuning.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left: Uploader */}
        <div className="surface-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Scan Dataset</h2>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--hairline)', borderRadius: '12px', padding: '3rem 1.5rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', background: file ? '#f0f4ff' : 'transparent', borderColor: file ? 'var(--primary)' : 'var(--hairline)',
              transition: 'all 0.2s', marginBottom: '1.5rem', textAlign: 'center'
            }}
          >
            <input 
              type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json,.jsonl"
              onChange={e => { if(e.target.files?.[0]) setFile(e.target.files[0]) }}
            />
            {file ? (
              <>
                <FileText size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>{file.name}</div>
                <div style={{ color: 'var(--charcoal)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '1rem' }}>Click to change file</div>
              </>
            ) : (
              <>
                <UploadCloud size={48} color="var(--mute)" style={{ marginBottom: '1rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>Click to upload dataset</div>
                <div style={{ color: 'var(--mute)', fontSize: '0.85rem' }}>Supports .json and .jsonl files</div>
              </>
            )}
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '8px', color: '#991b1b', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }}/>
              <span style={{ fontSize: '0.85rem' }}>{error}</span>
            </div>
          )}

          <button
            onClick={handleAnalyze} disabled={!file || loading}
            style={{
              width: '100%', padding: '1rem', background: (!file || loading) ? 'var(--surface-bone)' : 'var(--ink)',
              color: (!file || loading) ? 'var(--mute)' : '#fff', border: 'none', borderRadius: '8px',
              fontWeight: 700, fontSize: '1rem', cursor: (!file || loading) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            {loading ? <Loader className="spin" size={18} /> : <Activity size={18} />}
            {loading ? 'Analyzing Dataset...' : 'Run MRI Scan'}
          </button>
        </div>

        {/* Right: Report */}
        <div>
          {loading && (
            <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)' }}>
              <Activity className="spin" size={48} style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Scanning {file?.name}...</div>
              <div style={{ fontSize: '0.85rem' }}>Hashing rows and calculating distributions</div>
            </div>
          )}

          {!loading && !report && (
            <div style={{ height: '400px', border: '2px dashed var(--hairline)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)', padding: '2rem', textAlign: 'center' }}>
              <BarChart size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <h3 style={{ margin: 0, color: 'var(--charcoal)' }}>No report generated yet</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '300px' }}>Upload a dataset on the left to see the health report here.</p>
            </div>
          )}

          {!loading && report && (
            <div className="fade-in">
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="surface-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', border: `2px solid ${getGradeColor(report.grade)}` }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Health Grade</div>
                  <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, color: getGradeColor(report.grade), fontFamily: 'Bricolage Grotesque' }}>{report.grade}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginTop: '0.5rem' }}>{report.overall_score} / 100</div>
                </div>
                
                <div style={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="surface-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ color: 'var(--charcoal)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Rows</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink)' }}>{report.total_rows.toLocaleString()}</div>
                  </div>
                  <div className="surface-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ color: 'var(--charcoal)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Exact Duplicates</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: report.duplicates.percentage > 5 ? '#dc2626' : 'var(--ink)' }}>
                      {report.duplicates.count.toLocaleString()}
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--mute)', marginLeft: '0.5rem' }}>({report.duplicates.percentage}%)</span>
                    </div>
                  </div>
                  <div className="surface-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ color: 'var(--charcoal)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Missing Fields</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: report.formatting.missing_fields > 0 ? '#dc2626' : 'var(--ink)' }}>
                      {report.formatting.missing_fields.toLocaleString()}
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--mute)', marginLeft: '0.5rem' }}>({report.formatting.percentage}%)</span>
                    </div>
                  </div>
                  <div className="surface-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ color: 'var(--charcoal)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Avg Resp. Length</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink)' }}>
                      {report.lengths.avg_response_words} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--mute)' }}>words</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="surface-card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1rem' }}>
                  <Info size={18} color="var(--primary)"/> Diagnostic Recommendations
                </h3>
                {report.recommendations.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {report.recommendations.map((rec, i) => {
                      const isGood = rec.includes("healthy");
                      return (
                        <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: isGood ? '#ecfdf5' : '#fffbeb', borderLeft: `4px solid ${isGood ? '#10b981' : '#f59e0b'}`, borderRadius: '0 8px 8px 0' }}>
                          {isGood ? <ThumbsUp size={18} color="#059669" style={{ flexShrink: 0 }} /> : <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0 }} />}
                          <span style={{ color: isGood ? '#065f46' : '#92400e', fontSize: '0.95rem', lineHeight: 1.5 }}>{rec}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ color: 'var(--charcoal)', fontSize: '0.9rem' }}>No issues found!</div>
                )}
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
