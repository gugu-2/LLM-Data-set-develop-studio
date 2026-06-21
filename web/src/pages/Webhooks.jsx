import { useState, useEffect, useCallback } from 'react';
import { Webhook, Trash2, Plus, BellRing, Loader, ShieldAlert, Send } from 'lucide-react';

const API = 'http://localhost:8000/api';

const EVENTS = [
  { id: 'training_complete', label: 'Training Complete' },
  { id: 'dataset_published', label: 'Dataset Published' },
  { id: 'red_team_alert', label: 'Red Team Vulnerability Detected' },
  { id: 'marketplace_sale', label: 'Marketplace Sale' },
];

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New webhook form
  const [url, setUrl] = useState('');
  const [channel, setChannel] = useState('slack');
  const [selectedEvents, setSelectedEvents] = useState(['training_complete']);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/webhooks/list`);
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (e) {
      console.error("Failed to fetch webhooks", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleAdd = async () => {
    if (!url.trim().startsWith('http')) {
      setError('Please enter a valid HTTP/HTTPS webhook URL');
      return;
    }
    if (selectedEvents.length === 0) {
      setError('Select at least one event type');
      return;
    }

    setError('');
    setAdding(true);
    try {
      const res = await fetch(`${API}/webhooks/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, channel, events: selectedEvents })
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to add webhook');
      
      setUrl('');
      setSelectedEvents(['training_complete']);
      fetchWebhooks();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (targetUrl) => {
    try {
      await fetch(`${API}/webhooks/delete?url=${encodeURIComponent(targetUrl)}`, { method: 'POST' });
      fetchWebhooks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTest = async (targetUrl, targetChannel) => {
    try {
      const res = await fetch(`${API}/webhooks/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, channel: targetChannel })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Test failed: ${data.detail}`);
      } else {
        alert("Test notification sent successfully!");
      }
    } catch {
      alert("Error sending test notification");
    }
  };

  const toggleEvent = (eId) => {
    if (selectedEvents.includes(eId)) setSelectedEvents(selectedEvents.filter(x => x !== eId));
    else setSelectedEvents([...selectedEvents, eId]);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <Webhook size={32} color="var(--primary)" />
        <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem', textAlign: 'center' }}>Team Integrations</h1>
      </div>
      <p style={{ color: 'var(--charcoal)', textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
        Connect your workspace to Slack or Discord. Receive instant alerts when models finish training, new datasets are published, or Red Team detects critical poison.
      </p>

      <div className="surface-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} color="var(--primary)" /> Add New Webhook
        </h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>Webhook URL</label>
            <input 
              type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--hairline)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem' }}
            />
          </div>
          <div style={{ width: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>Channel Type</label>
            <select 
              value={channel} onChange={e => setChannel(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--hairline)', background: '#fff', fontSize: '0.9rem' }}
            >
              <option value="slack">Slack</option>
              <option value="discord">Discord</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.75rem' }}>Triggers</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {EVENTS.map(ev => (
              <label key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: selectedEvents.includes(ev.id) ? '#f0f4ff' : 'var(--surface-bone)', border: `1px solid ${selectedEvents.includes(ev.id) ? 'var(--primary)' : 'transparent'}`, borderRadius: '8px' }}>
                <input type="checkbox" checked={selectedEvents.includes(ev.id)} onChange={() => toggleEvent(ev.id)} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 500 }}>{ev.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '8px', color: '#991b1b', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }}/>
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        <button
          onClick={handleAdd} disabled={adding || !url.trim()}
          style={{ padding: '0.75rem 1.5rem', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: adding || !url.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {adding ? <Loader className="spin" size={16} /> : <Plus size={16} />} Add Integration
        </button>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BellRing size={20} color="var(--charcoal)" /> Active Integrations
      </h2>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--mute)' }}><Loader className="spin" size={32} /></div>
      ) : webhooks.length === 0 ? (
        <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--mute)' }}>
          <Webhook size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <div>No webhooks configured yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {webhooks.map((w, i) => (
            <div key={i} className="surface-card fade-in" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ background: w.channel === 'slack' ? '#4A154B' : '#5865F2', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>{w.channel}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: 'var(--ink)' }}>{w.url.substring(0, 40)}...</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {w.events.map(e => {
                    const evt = EVENTS.find(x => x.id === e);
                    return <span key={e} style={{ background: 'var(--surface-bone)', color: 'var(--charcoal)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{evt ? evt.label : e}</span>
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleTest(w.url, w.channel)}
                  style={{ background: '#f0f4ff', color: 'var(--primary)', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                  title="Send Test Ping"
                ><Send size={18} /></button>
                <button 
                  onClick={() => handleDelete(w.url)}
                  style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                  title="Delete Webhook"
                ><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
