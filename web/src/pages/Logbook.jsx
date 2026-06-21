import { useState, useEffect } from 'react';
import { BookOpen, Activity, Clock, Database, ChevronRight, CheckCircle2, XCircle, AlertCircle, PlayCircle, Loader, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const API = 'http://localhost:8000/api';

export default function Logbook() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    fetch(`${API}/logbook/runs`)
      .then(r => r.json())
      .then(data => {
        setRuns(data.runs || []);
        if (data.runs && data.runs.length > 0) {
          setSelectedRun(data.runs[0]);
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--mute)' }}><Loader className="spin" size={48} /></div>;
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <BookOpen size={28} color="var(--primary)" />
        <h1 className="display-font" style={{ margin: 0, fontSize: '2rem' }}>Training Logbook</h1>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        
        {/* Sidebar List */}
        <div className="surface-card" style={{ width: '300px', overflowY: 'auto', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--charcoal)', textTransform: 'uppercase' }}>Experiment Runs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {runs.map(run => (
              <div 
                key={run.id}
                onClick={() => setSelectedRun(run)}
                style={{ 
                  padding: '1rem', borderRadius: '8px', cursor: 'pointer',
                  background: selectedRun?.id === run.id ? '#f0f4ff' : 'transparent',
                  border: `1px solid ${selectedRun?.id === run.id ? 'var(--primary)' : 'var(--hairline)'}`,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{run.name}</span>
                  {run.status === 'completed' ? <CheckCircle2 size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', fontFamily: 'monospace' }}>{run.id}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--mute)', marginTop: '0.5rem' }}>{new Date(run.date).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Panel */}
        {selectedRun ? (
          <div className="surface-card fade-in" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid var(--hairline)', paddingBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedRun.name}
                  {selectedRun.status === 'completed' 
                    ? <span style={{ background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', verticalAlign: 'middle' }}>Completed</span>
                    : <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', verticalAlign: 'middle' }}>Failed</span>
                  }
                </h2>
                <div style={{ color: 'var(--charcoal)', fontFamily: 'monospace', fontSize: '0.85rem' }}>ID: {selectedRun.id}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--mute)' }}>Started On</div>
                <div style={{ fontWeight: 600 }}>{new Date(selectedRun.date).toLocaleString()}</div>
              </div>
            </div>

            {selectedRun.error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '8px', color: '#991b1b', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }}/>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Run Failed</div>
                  <div style={{ fontSize: '0.9rem' }}>{selectedRun.error}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--hairline)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Database size={14}/> Dataset</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedRun.dataset}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--hairline)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Activity size={14}/> Base Model</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedRun.model}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--hairline)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14}/> Duration</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedRun.duration}</div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BarChart2 size={14}/> Final Loss</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#166534' }}>{selectedRun.metrics?.final_loss?.toFixed(3) ?? 'N/A'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Hyperparameters</h3>
                <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--hairline)', overflow: 'hidden' }}>
                  {selectedRun.params && Object.entries(selectedRun.params).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--hairline)' }}>
                      <span style={{ color: 'var(--charcoal)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{key}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Training Loss Curve</h3>
                <div style={{ height: '300px', background: '#fff', borderRadius: '8px', border: '1px solid var(--hairline)', padding: '1rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedRun.metrics.history} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="step" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [value, 'Loss']}
                        labelFormatter={(label) => `Step: ${label}`}
                      />
                      <Line type="monotone" dataKey="loss" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="surface-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)' }}>
            Select a run from the sidebar to view details.
          </div>
        )}

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
