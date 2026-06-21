import { useState, useEffect, useCallback } from 'react';
import { Swords, Send, Loader, Zap, Trophy, Trash2, Cpu, Activity } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const API = 'http://localhost:8000/api';

const DEFAULT_MODELS = [
  { id: 'gemini:gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'ollama:llama3.1', label: 'Llama 3.1 (Local)' },
  { id: 'ollama:qwen2.5:7b', label: 'Qwen 2.5 (Local)' },
  { id: 'openai:gpt-4o-mini', label: 'GPT-4o Mini' }
];

export default function ModelArena() {
  const [tab, setTab] = useState('manual'); // 'manual', 'auto'
  
  const [prompt, setPrompt] = useState('');
  const [activeModels, setActiveModels] = useState([DEFAULT_MODELS[0], DEFAULT_MODELS[1]]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [voted, setVoted] = useState(false);

  const [simModelA, setSimModelA] = useState(DEFAULT_MODELS[0].id);
  const [simModelB, setSimModelB] = useState(DEFAULT_MODELS[1].id);
  const [simLoading, setSimLoading] = useState(false);
  const [radarData, setRadarData] = useState(null);
  const [simWinner, setSimWinner] = useState(null);

  const settings = JSON.parse(localStorage.getItem('hypasia_settings') || '{}');

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${API}/arena/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleFight = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setVoted(false); setResponses({});
    
    const promises = activeModels.map(model => 
      fetch(`${API}/arena/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: model.id,
          model_label: model.label,
          prompt,
          api_key: model.id.startsWith('openai:') ? settings.openai_api_key : undefined
        })
      }).then(r => r.json())
    );

    try {
      const results = await Promise.all(promises);
      const newResponses = {};
      results.forEach(res => {
        newResponses[res.model_id] = res;
      });
      setResponses(newResponses);
    } catch (err) {
      console.error("Fight error:", err);
    } finally {
      setLoading(false);
      fetchLeaderboard();
    }
  };

  const handleVote = async (winnerId, loserId) => {
    try {
      await fetch(`${API}/arena/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_id: winnerId, loser_id: loserId, prompt })
      });
      setVoted(true);
      fetchLeaderboard();
    } catch (e) {
      console.error("Vote failed:", e);
    }
  };

  const addModel = (e) => {
    const val = e.target.value;
    if (!val) return;
    const model = DEFAULT_MODELS.find(m => m.id === val);
    if (model && !activeModels.find(m => m.id === model.id)) {
      if (activeModels.length < 4) {
        setActiveModels([...activeModels, model]);
      }
    }
    e.target.value = "";
  };

  const removeModel = (id) => {
    setActiveModels(activeModels.filter(m => m.id !== id));
  };

  const handleSimulate = async () => {
    if (simModelA === simModelB) {
      alert("Please select two different models.");
      return;
    }
    setSimLoading(true);
    setRadarData(null);
    setSimWinner(null);
    try {
      const res = await fetch(`${API}/arena/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_a_id: simModelA,
          model_b_id: simModelB,
          match_count: 10000
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRadarData(data.radar_data);
        setSimWinner(data.overall_winner);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
      fetchLeaderboard();
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Swords size={32} color="var(--primary)" />
        <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem' }}>Model Arena</h1>
      </div>
      <p style={{ color: 'var(--charcoal)', maxWidth: '700px', lineHeight: 1.6, marginBottom: '2rem' }}>
        Pit multiple models against each other side-by-side or automate millions of cage matches using an AI judge to reveal deep weaknesses on a radar chart.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--hairline)' }}>
        <button 
          onClick={() => setTab('manual')}
          style={{ background: 'none', border: 'none', borderBottom: tab === 'manual' ? '2px solid var(--primary)' : '2px solid transparent', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 600, color: tab === 'manual' ? 'var(--ink)' : 'var(--mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Swords size={18} /> Manual Side-by-Side
        </button>
        <button 
          onClick={() => setTab('auto')}
          style={{ background: 'none', border: 'none', borderBottom: tab === 'auto' ? '2px solid var(--primary)' : '2px solid transparent', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 600, color: tab === 'auto' ? 'var(--ink)' : 'var(--mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Cpu size={18} /> Automated Cage Match
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left: Chat interface or Auto interface */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {tab === 'manual' && (
            <div className="fade-in">
              <div className="surface-card mb-4" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Fighters ({activeModels.length}/4):</span>
                {activeModels.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-bone)', padding: '0.4rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {m.label}
                    {activeModels.length > 2 && (
                      <button onClick={() => removeModel(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: 'var(--mute)' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {activeModels.length < 4 && (
                  <select onChange={addModel} style={{ padding: '0.4rem 0.75rem', borderRadius: '20px', border: '1px dashed var(--charcoal)', background: 'transparent', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <option value="">+ Add Model</option>
                    {DEFAULT_MODELS.filter(m => !activeModels.find(a => a.id === m.id)).map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeModels.length}, 1fr)`, gap: '1rem', marginBottom: '1rem' }}>
                {activeModels.map(model => {
                  const res = responses[model.id];
                  return (
                    <div key={model.id} className="surface-card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hairline)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{model.label}</h3>
                        {res && res.status === 'ok' && (
                          <span style={{ background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Zap size={12}/> {res.latency_ms}ms
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--ink)' }}>
                        {loading ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--mute)' }}>
                            <Loader className="spin" size={24} />
                          </div>
                        ) : res ? (
                          res.status === 'ok' ? res.content : <span style={{ color: '#dc2626' }}>{res.content}</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--charcoal)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            Awaiting prompt...
                          </div>
                        )}
                      </div>

                      {res && res.status === 'ok' && !voted && activeModels.length >= 2 && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              const loser = activeModels.find(m => m.id !== model.id);
                              handleVote(model.id, loser.id);
                            }}
                            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <Trophy size={14} /> Winner
                          </button>
                        </div>
                      )}
                      {voted && res && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--hairline)', textAlign: 'center', color: 'var(--mute)', fontSize: '0.8rem', fontWeight: 600 }}>
                          Vote Recorded
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-card)', padding: '0.5rem', borderRadius: '30px', border: '1px solid var(--hairline)' }}>
                <input
                  type="text"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFight()}
                  placeholder="Enter a prompt to test all models simultaneously..."
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.5rem 1rem', outline: 'none', fontSize: '1rem', fontFamily: 'Inter' }}
                />
                <button
                  onClick={handleFight} disabled={loading}
                  style={{ background: 'var(--ink)', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? <Loader className="spin" size={18} /> : <Send size={18} />}
                </button>
              </div>
            </div>
          )}

          {tab === 'auto' && (
            <div className="fade-in">
              <div className="surface-card mb-4">
                <h3 style={{ margin: '0 0 1rem 0' }}>Automated Judge Simulation</h3>
                <p style={{ color: 'var(--charcoal)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Deploy an AI Judge to pit these two models against each other over 10,000 adversarial prompts to automatically map their competency weaknesses.
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <select className="input-field" value={simModelA} onChange={e => setSimModelA(e.target.value)} style={{ flex: 1 }}>
                    {DEFAULT_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  <span style={{ fontWeight: 800, color: 'var(--mute)' }}>VS</span>
                  <select className="input-field" value={simModelB} onChange={e => setSimModelB(e.target.value)} style={{ flex: 1 }}>
                    {DEFAULT_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  <button className="btn btn-primary" onClick={handleSimulate} disabled={simLoading}>
                    {simLoading ? <><Loader className="spin" size={16} /> Simulating Matches...</> : <><Activity size={16}/> Simulate 10,000 Matches</>}
                  </button>
                </div>
              </div>

              {simLoading && (
                <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--primary)', marginBottom: '1rem' }} />
                  <p className="pulse" style={{ fontWeight: 600, color: 'var(--primary)' }}>Deep Simulation Running...</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--charcoal)' }}>The AI judge is evaluating edge cases across coding, math, empathy, and safety.</p>
                </div>
              )}

              {radarData && !simLoading && (
                <div className="surface-card fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>Weakness Radar</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--charcoal)', marginBottom: '2rem' }}>
                    Winner: <strong style={{ color: 'var(--primary)' }}>{DEFAULT_MODELS.find(m => m.id === simWinner)?.label || simWinner}</strong>
                  </p>
                  
                  <div style={{ width: '100%', height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name={DEFAULT_MODELS.find(m => m.id === simModelA)?.label || simModelA} dataKey={simModelA} stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                        <Radar name={DEFAULT_MODELS.find(m => m.id === simModelB)?.label || simModelB} dataKey={simModelB} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right: Leaderboard */}
        <div className="surface-card" style={{ width: '300px', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={20} color="#f59e0b" /> ELO Leaderboard
          </h2>
          {leaderboard.length === 0 ? (
            <div style={{ color: 'var(--charcoal)', fontSize: '0.85rem' }}>No matches played yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {leaderboard.map((m, i) => (
                <div key={m.model_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: i === 0 ? '#fffbeb' : 'var(--surface-bone)', borderRadius: '8px', border: i === 0 ? '1px solid #fcd34d' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: i === 0 ? '#d97706' : 'var(--mute)', width: '20px' }}>#{i+1}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>{DEFAULT_MODELS.find(d => d.id === m.model_id)?.label || m.model_id}</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ink)' }}>{Math.round(m.elo)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.3s ease forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spinner { border: 3px solid rgba(0,0,0,0.1); border-top-color: #000; border-radius: 50%; animation: spin 1s linear infinite; }
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
