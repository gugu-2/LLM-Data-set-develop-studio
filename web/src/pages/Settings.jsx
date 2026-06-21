import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Key, Save, Loader, ShieldCheck } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function Settings() {
  const [keys, setKeys] = useState({
    openai_api_key: "",
    anthropic_api_key: "",
    groq_api_key: "",
    gemini_api_key: "",
    aws_access_key_id: "",
    aws_secret_access_key: "",
    gcp_service_account: "",
    azure_client_secret: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings/keys`);
      setKeys(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await axios.post(`${API_BASE}/settings/keys`, keys);
      setMsg("Settings saved successfully.");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      alert("Error saving: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="fade-in">
      <h1 className="display-font" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <SettingsIcon color="var(--primary)" /> Settings & Integrations
      </h1>
      <p className="mb-4" style={{ color: 'var(--charcoal)' }}>
        Manage your universal API keys. Hypasia uses these locally to power Synthetic Generators, Auto-Evaluators, and DeepThink.
      </p>

      <div className="surface-card" style={{ maxWidth: '600px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Key size={20} /> Universal API Key Manager
        </h2>

        <div className="input-group">
          <label>OpenAI API Key (GPT-4o, o1-mini)</label>
          <input 
            type="password" 
            className="input-field" 
            placeholder="sk-proj-..."
            value={keys.openai_api_key}
            onChange={e => setKeys({...keys, openai_api_key: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label>Anthropic API Key (Claude 3.5 Sonnet)</label>
          <input 
            type="password" 
            className="input-field" 
            placeholder="sk-ant-..."
            value={keys.anthropic_api_key}
            onChange={e => setKeys({...keys, anthropic_api_key: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label>Google Gemini API Key (Gemini 2.5 Flash / Pro)</label>
          <input 
            type="password" 
            className="input-field" 
            placeholder="AIzaSy..."
            value={keys.gemini_api_key}
            onChange={e => setKeys({...keys, gemini_api_key: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label>Groq API Key (Llama-3 70B Lightning Fast)</label>
          <input 
            type="password" 
            className="input-field" 
            placeholder="gsk-..."
            value={keys.groq_api_key}
            onChange={e => setKeys({...keys, groq_api_key: e.target.value})}
          />
        </div>

        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', marginTop: '3rem' }}>
          <SettingsIcon size={20} /> Cloud Infrastructure Credentials
        </h2>
        <p className="mb-4" style={{ color: 'var(--charcoal)', fontSize: '0.9rem' }}>
          Add your cloud credentials to enable the <strong>"1-Click Launch to Cloud"</strong> feature in the Fine-Tune Studio.
        </p>

        <div className="input-group">
          <label>AWS Access Key ID</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="AKIA..."
            value={keys.aws_access_key_id}
            onChange={e => setKeys({...keys, aws_access_key_id: e.target.value})}
          />
        </div>
        
        <div className="input-group">
          <label>AWS Secret Access Key</label>
          <input 
            type="password" 
            className="input-field" 
            placeholder="********"
            value={keys.aws_secret_access_key}
            onChange={e => setKeys({...keys, aws_secret_access_key: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label>GCP Service Account JSON</label>
          <input 
            type="password" 
            className="input-field" 
            placeholder="{...}"
            value={keys.gcp_service_account}
            onChange={e => setKeys({...keys, gcp_service_account: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label>Azure Client Secret</label>
          <input 
            type="password" 
            className="input-field" 
            placeholder="********"
            value={keys.azure_client_secret}
            onChange={e => setKeys({...keys, azure_client_secret: e.target.value})}
          />
        </div>

        <div style={{ background: '#f0fdf4', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <ShieldCheck size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.9rem' }}>
            <strong>Local Storage Guarantee:</strong> Your API keys are saved securely to your local <code>.env</code> file. They never leave your machine.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader className="spin" size={18} /> Saving...</> : <><Save size={18} /> Save Configurations</>}
          </button>
          {msg && <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold' }}>{msg}</span>}
        </div>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
