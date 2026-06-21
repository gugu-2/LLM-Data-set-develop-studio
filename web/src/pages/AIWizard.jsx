import { useState } from 'react';
import axios from 'axios';
import {
  Wand2, ChevronRight, ChevronLeft, Check, Download, 
  Cpu, Clock, DollarSign, Target, Database,
  AlertTriangle, Loader, Code, Sparkles
} from 'lucide-react';

const API = 'http://localhost:8000/api';

const GOALS = [
  { id: 'customer_support', label: 'Customer Support', icon: '🎧', desc: 'Answers questions politely and handles complaints.' },
  { id: 'code_helper', label: 'Code Helper', icon: '💻', desc: 'Writes, debugs, and explains code.' },
  { id: 'content_writer', label: 'Content Writer', icon: '✍️', desc: 'Generates creative text, blogs, and marketing copy.' },
  { id: 'qa_bot', label: 'Q&A Bot', icon: '📚', desc: 'Factual answering based strictly on provided documents.' },
  { id: 'medical', label: 'Medical Info', icon: '⚕️', desc: 'Professional medical assistant (requires strict alignment).' },
  { id: 'legal', label: 'Legal Info', icon: '⚖️', desc: 'Legal concept explanation and document review.' },
  { id: 'custom', label: 'Custom', icon: '✨', desc: 'Build something completely unique.' },
];

const DATA_TYPES = [
  { id: 'files', label: 'My own documents', icon: '📄', desc: 'PDFs, DOCX, CSVs' },
  { id: 'urls', label: 'Website URLs', icon: '🌐', desc: 'Web scraping, Wikipedia, YouTube' },
  { id: 'marketplace', label: 'Marketplace Dataset', icon: '🛒', desc: 'Pre-made high-quality datasets' },
  { id: 'none', label: 'I have no data', icon: '🤖', desc: 'Use AI to generate synthetic data for me' },
];

const BUDGETS = [
  { val: 10, label: 'Tiny ($10)', desc: 'Experimenting, cheap GPU.' },
  { val: 50, label: 'Small ($50)', desc: 'Good baseline, balanced GPU.' },
  { val: 200, label: 'Medium ($200)', desc: 'High quality, fast GPU.' },
  { val: 500, label: 'Large ($500+)', desc: 'Production-ready, multi-GPU.' },
];

const SPEEDS = [
  { id: 'today', label: 'Today', desc: 'Fastest models, slight quality drop.' },
  { id: 'this_week', label: 'This Week', desc: 'Balanced training speed vs quality.' },
  { id: 'no_rush', label: 'No Rush', desc: 'Maximum quality, longer training.' },
];

export default function AIWizard() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    goal: '', goal_description: '',
    data_type: '', data_description: '',
    budget_usd: 50,
    speed: ''
  });
  
  const [recommendation, setRecommendation] = useState(null);
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextStep = () => setStep(s => Math.min(6, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const updateAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const getRecommendation = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/wizard/recommend`, answers);
      setRecommendation(res.data.config);
      setStep(6);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateScript = async () => {
    if (!recommendation) return;
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/wizard/generate-script`, { config: recommendation });
      setScript(res.data.script);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadScript = () => {
    const blob = new Blob([script], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'train.py'; a.click();
    URL.revokeObjectURL(url);
  };

  // Step 1: Goal
  const renderStep1 = () => (
    <div className="fade-in">
      <h2>What do you want your AI to do?</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {GOALS.map(g => (
          <button
            key={g.id}
            onClick={() => updateAnswer('goal', g.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
              borderRadius: '12px', border: answers.goal === g.id ? '2px solid var(--primary)' : '2px solid var(--hairline)',
              background: answers.goal === g.id ? 'var(--primary-light)' : 'var(--surface-card)',
              textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '2rem' }}>{g.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: answers.goal === g.id ? 'var(--primary)' : 'var(--ink)' }}>{g.label}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--charcoal)', marginTop: '0.25rem' }}>{g.desc}</div>
            </div>
          </button>
        ))}
      </div>
      {answers.goal && (
        <div className="fade-in">
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Briefly describe your specific use case (optional):</label>
          <textarea
            value={answers.goal_description}
            onChange={e => updateAnswer('goal_description', e.target.value)}
            placeholder="e.g. I want to build a bot that answers questions about my company's HR policies..."
            style={{ width: '100%', minHeight: '100px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--hairline)', fontFamily: 'Inter', fontSize: '0.9rem' }}
          />
        </div>
      )}
    </div>
  );

  // Step 2: Data
  const renderStep2 = () => (
    <div className="fade-in">
      <h2>What kind of training data do you have?</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {DATA_TYPES.map(d => (
          <button
            key={d.id}
            onClick={() => updateAnswer('data_type', d.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
              borderRadius: '12px', border: answers.data_type === d.id ? '2px solid #10b981' : '2px solid var(--hairline)',
              background: answers.data_type === d.id ? '#ecfdf5' : 'var(--surface-card)',
              textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '2rem' }}>{d.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: answers.data_type === d.id ? '#059669' : 'var(--ink)' }}>{d.label}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--charcoal)', marginTop: '0.25rem' }}>{d.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 3: Budget
  const renderStep3 = () => (
    <div className="fade-in">
      <h2>What is your budget for GPU compute?</h2>
      <p style={{ color: 'var(--charcoal)', marginBottom: '2rem' }}>Fine-tuning an AI requires renting cloud GPUs (like renting a supercomputer by the hour).</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {BUDGETS.map(b => (
          <button
            key={b.val}
            onClick={() => updateAnswer('budget_usd', b.val)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem',
              borderRadius: '12px', border: answers.budget_usd === b.val ? '2px solid #8b5cf6' : '2px solid var(--hairline)',
              background: answers.budget_usd === b.val ? '#f5f3ff' : 'var(--surface-card)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: answers.budget_usd === b.val ? '#7c3aed' : 'var(--ink)' }}>{b.label}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--charcoal)' }}>{b.desc}</div>
            </div>
            {answers.budget_usd === b.val && <Check color="#7c3aed" />}
          </button>
        ))}
      </div>
    </div>
  );

  // Step 4: Speed
  const renderStep4 = () => (
    <div className="fade-in">
      <h2>How fast do you need the model ready?</h2>
      <p style={{ color: 'var(--charcoal)', marginBottom: '2rem' }}>Faster models are smaller and cheaper, but might not be as smart.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {SPEEDS.map(s => (
          <button
            key={s.id}
            onClick={() => updateAnswer('speed', s.id)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem',
              borderRadius: '12px', border: answers.speed === s.id ? '2px solid #f59e0b' : '2px solid var(--hairline)',
              background: answers.speed === s.id ? '#fffbeb' : 'var(--surface-card)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: answers.speed === s.id ? '#d97706' : 'var(--ink)' }}>{s.label}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--charcoal)' }}>{s.desc}</div>
            </div>
            {answers.speed === s.id && <Check color="#d97706" />}
          </button>
        ))}
      </div>
    </div>
  );

  // Step 5: Review
  const renderStep5 = () => (
    <div className="fade-in">
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <Wand2 size={64} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Magic is ready.</h2>
        <p style={{ color: 'var(--charcoal)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          We've analyzed your requirements. Click the button below, and the Wizard will recommend the perfect open-source model, hardware, and generate a complete training script for you.
        </p>
        
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <button
          onClick={getRecommendation}
          disabled={loading}
          style={{
            background: 'var(--primary)', color: '#fff', border: 'none', padding: '1rem 2.5rem',
            borderRadius: '30px', fontSize: '1.2rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
          }}
        >
          {loading ? <Loader className="spin" size={24} /> : <Sparkles size={24} />}
          Reveal Recommendation
        </button>
      </div>
    </div>
  );

  // Step 6: Result & Script
  const renderStep6 = () => {
    if (!recommendation) return null;
    return (
      <div className="fade-in">
        <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Your Custom AI Blueprint</h2>
        <p style={{ color: 'var(--charcoal)', marginBottom: '2rem' }}>Here is the optimal setup based on your budget and goals.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="surface-card" style={{ borderTop: '4px solid #4868ff' }}>
            <div style={{ color: 'var(--mute)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}><Cpu size={14}/> Model</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{recommendation.model.split('/')[1]}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', marginTop: '0.25rem' }}>{recommendation.params} parameters • {recommendation.quantization}</div>
          </div>
          <div className="surface-card" style={{ borderTop: '4px solid #10b981' }}>
            <div style={{ color: 'var(--mute)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}><Database size={14}/> Hardware</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{recommendation.gpu}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', marginTop: '0.25rem' }}>Requires {recommendation.vram_gb}GB VRAM</div>
          </div>
          <div className="surface-card" style={{ borderTop: '4px solid #f59e0b' }}>
            <div style={{ color: 'var(--mute)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}><Clock size={14}/> Est. Time</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{recommendation.est_time_hrs} hours</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', marginTop: '0.25rem' }}>Training duration</div>
          </div>
          <div className="surface-card" style={{ borderTop: '4px solid #8b5cf6' }}>
            <div style={{ color: 'var(--mute)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}><DollarSign size={14}/> Est. Cost</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>${recommendation.est_cost_usd.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', marginTop: '0.25rem' }}>Total compute cost</div>
          </div>
        </div>

        <div className="surface-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={18}/> Training Hyperparameters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'var(--surface-bone)', padding: '1rem', borderRadius: '8px' }}>
            <div><span style={{color:'var(--mute)', fontSize:'0.8rem'}}>Batch Size:</span> <strong style={{marginLeft:'5px'}}>{recommendation.batch_size}</strong></div>
            <div><span style={{color:'var(--mute)', fontSize:'0.8rem'}}>Epochs:</span> <strong style={{marginLeft:'5px'}}>{recommendation.epochs}</strong></div>
            <div><span style={{color:'var(--mute)', fontSize:'0.8rem'}}>Learning Rate:</span> <strong style={{marginLeft:'5px'}}>{recommendation.learning_rate}</strong></div>
            <div><span style={{color:'var(--mute)', fontSize:'0.8rem'}}>LoRA Rank:</span> <strong style={{marginLeft:'5px'}}>{recommendation.lora_rank}</strong></div>
          </div>
        </div>

        {!script ? (
          <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed var(--hairline)', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Ready to build?</h3>
            <button
              onClick={generateScript}
              disabled={loading}
              style={{
                background: 'var(--ink)', color: '#fff', border: 'none', padding: '0.875rem 2rem',
                borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              {loading ? <Loader className="spin" size={18} /> : <Code size={18} />}
              Generate Unsloth Training Script
            </button>
          </div>
        ) : (
          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Code size={18}/> `train.py`</h3>
              <button
                onClick={downloadScript}
                style={{
                  background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem',
                  borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                <Download size={14} /> Download Script
              </button>
            </div>
            <pre style={{
              background: '#1e1e2e', color: '#cdd6f4', padding: '1.25rem',
              borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto',
              fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5,
            }}>
              {script}
            </pre>
          </div>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button onClick={() => {setStep(1); setScript(''); setRecommendation(null);}} style={{ background: 'transparent', border: '1px solid var(--hairline)', padding: '0.75rem 1.5rem', borderRadius: '30px', cursor: 'pointer', fontWeight: 600, color: 'var(--charcoal)' }}>
            Start Over
          </button>
        </div>
      </div>
    );
  };

  const steps = [
    { num: 1, label: 'Goal' },
    { num: 2, label: 'Data' },
    { num: 3, label: 'Budget' },
    { num: 4, label: 'Speed' },
    { num: 5, label: 'Review' },
  ];

  // Disable next button if step not completed
  const canProceed = () => {
    if (step === 1 && !answers.goal) return false;
    if (step === 2 && !answers.data_type) return false;
    if (step === 3 && !answers.budget_usd) return false;
    if (step === 4 && !answers.speed) return false;
    return true;
  };

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', justifyContent: 'center' }}>
        <Wand2 size={32} color="var(--primary)" />
        <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem', textAlign: 'center' }}>AI Wizard</h1>
      </div>

      {/* Stepper Header */}
      {step < 6 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: 'var(--hairline)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '15px', left: '0', height: '2px', background: 'var(--primary)', zIndex: 1, width: `${((step - 1) / 4) * 100}%`, transition: 'width 0.3s ease' }} />
          
          {steps.map(s => (
            <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, gap: '0.5rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= s.num ? 'var(--primary)' : 'var(--surface-bone)',
                color: step >= s.num ? '#fff' : 'var(--mute)',
                border: step === s.num ? '4px solid var(--primary-light)' : '4px solid var(--canvas)',
                fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.3s'
              }}>
                {s.num}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: step >= s.num ? 'var(--ink)' : 'var(--mute)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div style={{ minHeight: '400px' }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </div>

      {/* Navigation Footer */}
      {step < 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid var(--hairline)', paddingTop: '2rem' }}>
          <button
            onClick={prevStep}
            disabled={step === 1}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
              background: 'transparent', border: '1px solid var(--hairline)', borderRadius: '30px',
              color: step === 1 ? 'var(--mute)' : 'var(--ink)', fontWeight: 600, cursor: step === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={18} /> Back
          </button>
          
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
              background: canProceed() ? 'var(--ink)' : 'var(--surface-bone)', border: 'none', borderRadius: '30px',
              color: canProceed() ? '#fff' : 'var(--mute)', fontWeight: 600, cursor: canProceed() ? 'pointer' : 'not-allowed'
            }}
          >
            Continue <ChevronRight size={18} />
          </button>
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
