import React, { useState, useEffect } from 'react';
import { Hammer, Play, Terminal, Database, Cpu, CheckCircle2, FileJson, Loader2 } from 'lucide-react';

const DEFAULT_SKILL = `# Skill: Healthcare Triage Chatbot

**System Prompt**: 
You are an expert AI triage nurse. Your goal is to accurately assess patient symptoms and recommend the correct department (ER, Urgent Care, or Primary Care). You MUST ask exactly 3 diagnostic questions before making a recommendation. You MUST use the available tools to book appointments.

**Allowed Tools**: 
- \`check_symptoms(symptom_list: array)\`
- \`book_appointment(department: string, urgency: string)\`

**Example Interaction**:
User: My chest has been hurting since yesterday.
Model: I'm sorry to hear that. To better understand your situation: 1) On a scale of 1-10, how severe is the pain? 2) Does the pain spread to your arm or jaw? 3) Are you experiencing any shortness of breath?
User: It's an 8, yes to my arm, and yes it's hard to breathe.
Model: [CALL_TOOL: book_appointment(department="ER", urgency="immediate")]
`;

export default function SkillForge() {
  const [skillText, setSkillText] = useState(DEFAULT_SKILL);
  const [isForging, setIsForging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [datasetCount, setDatasetCount] = useState(0);

  const startForge = () => {
    setIsForging(true);
    setProgress(0);
    setLogs([]);
    setDatasetCount(0);
  };

  useEffect(() => {
    if (!isForging) return;

    const stages = [
      { p: 10, msg: "Initializing Persona Matrix Simulator..." },
      { p: 25, msg: "Parsing SKILL.md AST and extracting Tool Schemas..." },
      { p: 40, msg: "Simulating 5,000 synthetic adversarial conversations..." },
      { p: 60, msg: "Compiling JSONL Tool-Calling Training Dataset..." },
      { p: 80, msg: "Triggering LLaMA-3.1 LoRA Fine-Tune via SageMaker..." },
      { p: 100, msg: "Skill Forge Complete. Model deployed to endpoint." }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setProgress(stages[currentStage].p);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${stages[currentStage].msg}`]);
        if (stages[currentStage].p === 40 || stages[currentStage].p === 60) {
           setDatasetCount(prev => prev + Math.floor(Math.random() * 2000) + 1000);
        }
        currentStage++;
      } else {
        clearInterval(interval);
        setDatasetCount(5000);
        setIsForging(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isForging]);

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="display-font" style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Hammer color="var(--primary)" size={28} />
            Skill Forge Compiler
          </h1>
          <p style={{ color: 'var(--charcoal)', margin: 0, fontSize: '1rem' }}>
            Write a SKILL.md file. We'll simulate 5,000 conversations and forge a fine-tuned model instantly.
          </p>
        </div>
        <button 
          onClick={startForge}
          disabled={isForging}
          className="primary-button" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
        >
          {isForging ? <Loader2 className="spinner" size={20} /> : <Play size={20} />}
          {isForging ? 'Forging Model...' : 'Forge Skill Model'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Left Pane: Editor */}
        <div className="surface-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--ink)' }}>
            <FileJson size={18} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>SKILL.md Editor</h3>
          </div>
          <textarea 
            value={skillText}
            onChange={(e) => setSkillText(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              background: '#1e1e1e',
              color: '#d4d4d4',
              border: '1px solid var(--hairline)',
              borderRadius: '8px',
              padding: '1rem',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: 1.6,
              resize: 'none'
            }}
          />
        </div>

        {/* Right Pane: Forge Output */}
        <div className="surface-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', background: '#0d1117' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
            <Terminal size={18} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Forge Telemetry</h3>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span>Compilation Progress</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: '8px', background: '#21262d', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--primary)', width: `${progress}%`, transition: 'width 0.5s ease' }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#161b22', padding: '1rem', borderRadius: '8px', border: '1px solid #30363d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={14} /> Synthetic Rows
              </div>
              <div style={{ color: '#e6edf3', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {datasetCount.toLocaleString()}
              </div>
            </div>
            <div style={{ background: '#161b22', padding: '1rem', borderRadius: '8px', border: '1px solid #30363d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={14} /> Target Model
              </div>
              <div style={{ color: '#e6edf3', fontSize: '1.2rem', fontWeight: 'bold', paddingTop: '0.3rem' }}>
                LLaMA-3.1 8B
              </div>
            </div>
          </div>

          <div style={{ flex: 1, background: '#010409', borderRadius: '8px', padding: '1rem', overflowY: 'auto', border: '1px solid #30363d', fontFamily: 'monospace', fontSize: '0.85rem', color: '#7ee787' }}>
            {logs.length === 0 && <span style={{ color: '#484f58' }}>Ready to forge. Awaiting user input...</span>}
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '0.5rem', animation: 'fadeIn 0.3s ease' }}>
                {log}
              </div>
            ))}
            {progress === 100 && (
              <div style={{ marginTop: '1rem', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.5s ease' }}>
                <CheckCircle2 size={16} /> Forge process completed successfully.
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
