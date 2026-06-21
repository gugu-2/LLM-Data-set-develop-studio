import React from 'react';
import { NavLink } from 'react-router-dom';
import { Database, Cpu, Settings as SettingsIcon, RefreshCw, Mic, BarChart2, Shield, ShoppingBag, GitBranch, CheckSquare, AlertTriangle, Bot } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const velocityData = [
  { name: 'Mon', rows: 1200 },
  { name: 'Tue', rows: 2100 },
  { name: 'Wed', rows: 800 },
  { name: 'Thu', rows: 3400 },
  { name: 'Fri', rows: 5000 },
  { name: 'Sat', rows: 4200 },
  { name: 'Sun', rows: 6100 },
];

const qualityData = [
  { name: '0-2', count: 40 },
  { name: '3-5', count: 120 },
  { name: '6-7', count: 350 },
  { name: '8-9', count: 890 },
  { name: '10', count: 210 },
];

export default function Dashboard() {
  return (
    <div className="fade-in">
      <h1 className="display-font">Hypasia AI Studio</h1>
      <p className="mb-4" style={{color: 'var(--charcoal)', fontSize: '1.1rem'}}>
        The end-to-end platform for building, curating, and fine-tuning AI models.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="surface-card">
          <div className="flex items-center gap-2 mb-2">
            <Database size={20} color="var(--primary)" />
            <h2 style={{margin: 0}}>1. Mine & Scrape</h2>
          </div>
          <p style={{fontSize: '0.875rem', color: 'var(--charcoal)', marginBottom: '1rem'}}>
            Crawl websites, Wikipedia, YouTube, or upload PDFs to auto-extract structured Q&A pairs.
          </p>
          <NavLink to="/mine" className="btn btn-outline" style={{width: '100%', textAlign: 'center'}}>Open Data Miner</NavLink>
        </div>

        <div className="surface-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare size={20} color="var(--primary)" />
            <h2 style={{margin: 0}}>2. Curate & Clean</h2>
          </div>
          <p style={{fontSize: '0.875rem', color: 'var(--charcoal)', marginBottom: '1rem'}}>
            Auto-score with Gemini/Ollama, scrub PII, filter languages, and manually review in Studio.
          </p>
          <NavLink to="/annotate" className="btn btn-outline" style={{width: '100%', textAlign: 'center'}}>Open Annotation Studio</NavLink>
        </div>

        <div className="surface-card">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={20} color="var(--primary)" />
            <h2 style={{margin: 0}}>3. Fine-Tune</h2>
          </div>
          <p style={{fontSize: '0.875rem', color: 'var(--charcoal)', marginBottom: '1rem'}}>
            Generate 1-click training scripts for Unsloth, Google Colab, AWS SageMaker, and Azure ML.
          </p>
          <NavLink to="/finetune" className="btn btn-outline" style={{width: '100%', textAlign: 'center'}}>Open Fine-Tune Studio</NavLink>
        </div>
      </div>

      <h2 className="mb-4 mt-6">Live Flywheel Metrics</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="surface-card">
          <h3 style={{fontSize: '1rem', marginBottom: '1rem', color: 'var(--charcoal)'}}>Data Mining Velocity (Rows / Day)</h3>
          <div style={{width: '100%', height: 250}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline-strong)" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--mute)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: 'var(--mute)'}} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid var(--hairline)'}} />
                <Area type="monotone" dataKey="rows" stroke="var(--hero-glow)" fill="var(--hero-pink)" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card">
          <h3 style={{fontSize: '1rem', marginBottom: '1rem', color: 'var(--charcoal)'}}>Quality Score Distribution</h3>
          <div style={{width: '100%', height: 250}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline-strong)" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--mute)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: 'var(--mute)'}} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid var(--hairline)'}} cursor={{fill: 'var(--surface-bone)'}} />
                <Bar dataKey="count" fill="var(--badge-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2 className="mb-4 mt-6">Advanced Tools</h2>
      <div className="grid grid-cols-4 gap-4">
        <NavLink to="/elicit" className="surface-card flex items-center gap-3" style={{textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s'}}>
          <Mic size={24} color="var(--charcoal)" />
          <div>
            <div style={{fontWeight: 600}}>Expert Elicitor</div>
            <div style={{fontSize: '0.75rem', color: 'var(--charcoal)'}}>Audio → Dataset</div>
          </div>
        </NavLink>

        <NavLink to="/redteam" className="surface-card flex items-center gap-3" style={{textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s'}}>
          <AlertTriangle size={24} color="var(--charcoal)" />
          <div>
            <div style={{fontWeight: 600}}>Red-Team Gen</div>
            <div style={{fontSize: '0.75rem', color: 'var(--charcoal)'}}>Adversarial tests</div>
          </div>
        </NavLink>

        <NavLink to="/versions" className="surface-card flex items-center gap-3" style={{textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s'}}>
          <GitBranch size={24} color="var(--charcoal)" />
          <div>
            <div style={{fontWeight: 600}}>Version Control</div>
            <div style={{fontSize: '0.75rem', color: 'var(--charcoal)'}}>Dataset git</div>
          </div>
        </NavLink>

        <NavLink to="/chat" className="surface-card flex items-center gap-3" style={{textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s'}}>
          <Bot size={24} color="var(--hero-glow)" />
          <div>
            <div style={{fontWeight: 600}}>AI Assistant</div>
            <div style={{fontSize: '0.75rem', color: 'var(--charcoal)'}}>Debug & chat</div>
          </div>
        </NavLink>
      </div>

    </div>
  );
}
