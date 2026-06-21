import { useState } from 'react';
import { Users, Plus, Play, Database, Download, MessageSquare, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InfoTooltip from '../components/InfoTooltip';

const API = 'http://localhost:8000/api';

export default function PersonaMatrix() {
  const { t } = useTranslation();
  const [scenario, setScenario] = useState('The ethical implications of AGI in healthcare');
  const [turns, setTurns] = useState(5);
  const [personas, setPersonas] = useState([
    { id: '1', name: 'Optimistic Tech Bro', system_prompt: 'You are an enthusiastic silicon valley founder who thinks technology solves everything.', avatar: '🧑‍💻' },
    { id: '2', name: 'Skeptical Bioethicist', system_prompt: 'You are a cautious medical ethicist who worries about data privacy and algorithmic bias.', avatar: '🩺' }
  ]);
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState(null);

  const handleAddPersona = () => {
    const newId = Date.now().toString();
    setPersonas([...personas, { id: newId, name: 'New Persona', system_prompt: 'You are a...', avatar: '👤' }]);
  };

  const handleUpdatePersona = (id, field, value) => {
    setPersonas(personas.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleRemovePersona = (id) => {
    setPersonas(personas.filter(p => p.id !== id));
  };

  const handleSimulate = async () => {
    setLoading(true);
    setSimulation(null);
    try {
      const res = await fetch(`${API}/matrix/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, personas, turns })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulation(data);
      } else {
        const err = await res.json();
        alert(err.detail);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem' }}>
      
      {/* Left Column: Configuration */}
      <div style={{ flex: '1', minWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: '12px' }}>
            <Users size={32} color="#8b5cf6" />
          </div>
          <div>
            <h1 className="display-font" style={{ margin: 0, fontSize: '2rem' }}>Persona Matrix</h1>
            <p style={{ color: 'var(--mute)', margin: '0.25rem 0 0 0' }}>Multi-Agent Synthetic Data Generation</p>
          </div>
        </div>

        <div className="surface-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Simulation Parameters <InfoTooltip text="Define the topic and length of the multi-agent debate." /></h3>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Global Scenario</label>
          <input 
            type="text" 
            value={scenario}
            onChange={e => setScenario(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--hairline)', marginBottom: '1rem' }}
          />
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Dialogue Turns</label>
          <input 
            type="number" 
            value={turns}
            onChange={e => setTurns(parseInt(e.target.value))}
            min={2} max={20}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--hairline)' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Agent Personas ({personas.length}) <InfoTooltip text="Create unique personalities. The LLMs will roleplay as these personas to generate synthetic conversational data." /></h3>
          <button onClick={handleAddPersona} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#8b5cf6', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={16} /> Add Persona
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {personas.map((p, i) => (
            <div key={p.id} className="surface-card" style={{ padding: '1rem', position: 'relative', borderLeft: `4px solid hsl(${i * 45}, 70%, 60%)` }}>
              <button 
                onClick={() => handleRemovePersona(p.id)}
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: personas.length > 2 ? 1 : 0.3 }}
                disabled={personas.length <= 2}
              >
                <Trash2 size={16} />
              </button>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input 
                  type="text" value={p.avatar} onChange={e => handleUpdatePersona(p.id, 'avatar', e.target.value)}
                  style={{ width: '40px', textAlign: 'center', borderRadius: '6px', border: '1px solid var(--hairline)' }}
                  maxLength={2}
                />
                <input 
                  type="text" value={p.name} onChange={e => handleUpdatePersona(p.id, 'name', e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--hairline)', fontWeight: 600 }}
                  placeholder="Persona Name"
                />
              </div>
              <textarea 
                value={p.system_prompt} onChange={e => handleUpdatePersona(p.id, 'system_prompt', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--hairline)', minHeight: '60px', fontSize: '0.85rem' }}
                placeholder="System prompt behavior..."
              />
            </div>
          ))}
        </div>

        <button 
          onClick={handleSimulate}
          disabled={loading || personas.length < 2}
          style={{ width: '100%', background: '#8b5cf6', color: '#fff', border: 'none', padding: '1rem', borderRadius: '8px', fontWeight: 700, fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
        >
          {loading ? <div className="spinner" /> : <Play size={20} />} Run Matrix Simulation
        </button>
      </div>

      {/* Right Column: Visualizer */}
      <div style={{ flex: '2', background: '#f8fafc', border: '1px solid var(--hairline)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--hairline)', background: '#fff', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <MessageSquare size={18} color="var(--primary)" /> Live Simulation
          </div>
          {simulation && (
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
              <Download size={14} /> Export to Dataset ({simulation.dataset_preview.length} pairs)
            </button>
          )}
        </div>

        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', minHeight: '500px' }}>
          {!simulation && !loading && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)' }}>
              <Database size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Configure personas and run the simulation to see organic dataset generation.</p>
            </div>
          )}

          {loading && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: '#8b5cf6', marginBottom: '1rem' }} />
              <p className="pulse">Simulating {personas.length}-agent conversation...</p>
            </div>
          )}

          {simulation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {simulation.dialogue.map((msg, i) => {
                const isEven = i % 2 === 0;
                return (
                  <div key={i} className="fade-in" style={{ display: 'flex', gap: '1rem', flexDirection: isEven ? 'row' : 'row-reverse', animationDelay: `${i * 0.1}s` }}>
                    <div style={{ fontSize: '2rem' }}>{msg.avatar}</div>
                    <div style={{ maxWidth: '70%', background: isEven ? '#fff' : '#8b5cf6', color: isEven ? 'var(--ink)' : '#fff', padding: '1rem', borderRadius: '12px', border: isEven ? '1px solid var(--hairline)' : 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', opacity: 0.8 }}>{msg.persona_name}</div>
                      <div style={{ lineHeight: 1.5, fontSize: '0.95rem' }}>{msg.message}</div>
                    </div>
                  </div>
                );
              })}
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
      `}</style>
    </div>
  );
}
