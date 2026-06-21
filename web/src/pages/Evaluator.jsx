import { useState, useEffect } from 'react';
import { Target, Cpu, Activity, Zap, Beaker, GitBranch, ArrowRight, CheckCircle, BrainCircuit } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ZAxis } from 'recharts';
import InfoTooltip from '../components/InfoTooltip';

const API = 'http://localhost:8000/api';

const DEFAULT_MODELS = [
  { id: 'gemini:gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'ollama:llama3.1', label: 'Llama 3.1 (Local Base)' },
  { id: 'ollama:qwen2.5:7b', label: 'Qwen 2.5 (Local)' },
  { id: 'openai:gpt-4o-mini', label: 'GPT-4o Mini' }
];

export default function Evaluator() {
  const [step, setStep] = useState(1); // 1: Config, 2: Running, 3: Results
  
  const [datasetId, setDatasetId] = useState('healthcare_qa_v2');
  const [baseModelId, setBaseModelId] = useState('ollama:llama3.1');
  const [tunedModelId, setTunedModelId] = useState('llama3.1-fine-tuned-medical');

  // Pipeline states
  const [pipelineState, setPipelineState] = useState({
    analysis: { status: 'idle', result: null },
    generation: { status: 'idle', result: null },
    evaluation: { status: 'idle', result: null }
  });

  const [metrics, setMetrics] = useState(null);
  const [radarData, setRadarData] = useState([]);
  const [scatterData, setScatterData] = useState([]);

  const runPipeline = async () => {
    setStep(2);
    setPipelineState({
      analysis: { status: 'loading', result: null },
      generation: { status: 'idle', result: null },
      evaluation: { status: 'idle', result: null }
    });

    try {
      // 1. Analyze Dataset
      const analyzeRes = await fetch(`${API}/evaluator/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId })
      });
      const analyzeData = await analyzeRes.json();
      setPipelineState(prev => ({
        ...prev,
        analysis: { status: 'done', result: analyzeData },
        generation: { status: 'loading', result: null }
      }));

      // 2. Generate Prompts
      const genRes = await fetch(`${API}/evaluator/generate_prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId, target_count: 1000 })
      });
      const genData = await genRes.json();
      setPipelineState(prev => ({
        ...prev,
        generation: { status: 'done', result: genData },
        evaluation: { status: 'loading', result: null }
      }));

      // 3. Run Evaluation
      const runRes = await fetch(`${API}/evaluator/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_model_id: baseModelId, tuned_model_id: tunedModelId, dataset_id: datasetId })
      });
      const runData = await runRes.json();
      setPipelineState(prev => ({
        ...prev,
        evaluation: { status: 'done', result: runData }
      }));

      setRadarData(runData.radar_data);
      setScatterData(runData.scatter_data);
      setMetrics(runData.metrics);
      setStep(3);

    } catch (e) {
      console.error(e);
      alert("Pipeline failed. Check console.");
      setStep(1);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Prompt Complexity: {data.complexity}</p>
          <p style={{ margin: '0', color: '#ef4444' }}>Base Score: {data.base_score}</p>
          <p style={{ margin: '0', color: '#3b82f6' }}>Tuned Score: {data.tuned_score}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Target size={32} color="var(--primary)" />
        <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem' }}>Automated Evaluator</h1>
      </div>
      <p style={{ color: 'var(--charcoal)', maxWidth: '700px', lineHeight: 1.6, marginBottom: '2rem' }}>
        Auto-analyze your dataset, generate thousands of tailored synthetic prompts, and aggressively benchmark your Fine-Tuned Model against the Base Model. Uncover deep metrics across interactive 2D and 3D-bubble graphs.
      </p>

      {step === 1 && (
        <div className="surface-card fade-in" style={{ maxWidth: '800px' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitBranch size={20} color="var(--primary)" /> Configure Evaluation Pipeline <InfoTooltip text="Pits your new fine-tuned model against a baseline model using a generated test set." />
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Training Dataset</label>
              <input type="text" className="input-field" value={datasetId} onChange={e => setDatasetId(e.target.value)} />
            </div>
            <div />
            
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Base Model</label>
              <select className="input-field" value={baseModelId} onChange={e => setBaseModelId(e.target.value)}>
                {DEFAULT_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Fine-Tuned Model</label>
              <input type="text" className="input-field" value={tunedModelId} onChange={e => setTunedModelId(e.target.value)} placeholder="e.g. llama3.1-fine-tuned" />
            </div>
          </div>

          <button onClick={runPipeline} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            <Activity size={20} /> Run Automated Evaluation (1,000+ Prompts)
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="surface-card fade-in" style={{ maxWidth: '800px' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', textAlign: 'center' }}>Executing Evaluation Pipeline...</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Step 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: pipelineState.analysis.status === 'done' ? '#f0fdf4' : 'var(--surface-bone)', borderRadius: '8px' }}>
              {pipelineState.analysis.status === 'loading' ? <div className="spinner-small" /> : pipelineState.analysis.status === 'done' ? <CheckCircle color="#10b981" /> : <div style={{width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--hairline)'}}/>}
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', color: 'var(--ink)' }}>1. Analyzing Dataset Domain</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--charcoal)' }}>{pipelineState.analysis.result ? `Identified Domain: ${pipelineState.analysis.result.domain} (${pipelineState.analysis.result.data_points} rows)` : 'Extracting statistical vectors...'}</span>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: pipelineState.generation.status === 'done' ? '#f0fdf4' : 'var(--surface-bone)', borderRadius: '8px' }}>
              {pipelineState.generation.status === 'loading' ? <div className="spinner-small" /> : pipelineState.generation.status === 'done' ? <CheckCircle color="#10b981" /> : <div style={{width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--hairline)'}}/>}
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', color: 'var(--ink)' }}>2. Synthesizing Evaluation Prompts</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--charcoal)' }}>{pipelineState.generation.result ? `Generated ${pipelineState.generation.result.generated_count} edge-case prompts` : 'Auto-generating domain-specific prompts...'}</span>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: pipelineState.evaluation.status === 'done' ? '#f0fdf4' : 'var(--surface-bone)', borderRadius: '8px' }}>
              {pipelineState.evaluation.status === 'loading' ? <div className="spinner-small" /> : pipelineState.evaluation.status === 'done' ? <CheckCircle color="#10b981" /> : <div style={{width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--hairline)'}}/>}
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', color: 'var(--ink)' }}>3. Mass Model Evaluation</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--charcoal)' }}>{pipelineState.evaluation.status === 'loading' ? 'Pitting Base vs Tuned against 1,000 prompts...' : pipelineState.evaluation.status === 'done' ? 'Evaluation Complete' : 'Waiting...'}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {step === 3 && metrics && (
        <div className="fade-in">
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Evaluation Results</h2>
            <button className="btn btn-outline" onClick={() => setStep(1)}>Run New Evaluation</button>
          </div>

          {/* Quantitative Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div className="surface-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Accuracy Improvement</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{metrics.accuracy_improvement}</div>
            </div>
            <div className="surface-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Domain Mastery</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{metrics.domain_mastery_gain}</div>
            </div>
            <div className="surface-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Hallucination Reduction</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>{metrics.hallucination_reduction}</div>
            </div>
            <div className="surface-card" style={{ textAlign: 'center', background: 'var(--ink)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Overall Winner</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Tuned Model</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* Scatter / Bubble Plot (3D equivalent) */}
            <div className="surface-card">
              <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BrainCircuit size={18} color="var(--primary)" /> Performance vs Complexity <InfoTooltip text="A 3D scatter plot showing if your model struggles on highly complex prompts compared to the base model." />
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--charcoal)' }}>
                X: Prompt Complexity | Y: Score | Bubble Size: Model Confidence
              </p>
              <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="complexity" name="Complexity" unit="" label={{ value: 'Prompt Complexity', position: 'insideBottom', offset: -10 }} />
                    <YAxis type="number" dataKey="tuned_score" name="Score" unit="%" label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                    <ZAxis type="number" dataKey="tuned_confidence" range={[50, 400]} name="Confidence" />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter name="Base Model (Red)" data={scatterData} fill="#ef4444" opacity={0.6} dataKey="base_score">
                      {/* We map the ZAxis to base_confidence but rechart scatter doesn't strictly support two separate ZAxis simultaneously on same Scatter without multiple series using different Z mapping, so we pass separate Scatter for Base. Wait, we need separate data shapes for recharts. */}
                    </Scatter>
                    <Scatter name="Tuned Model (Blue)" data={scatterData} fill="#3b82f6" opacity={0.6} dataKey="tuned_score" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="surface-card">
              <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Beaker size={18} color="#8b5cf6" /> Skill Radar Profile <InfoTooltip text="Visualizes specific domain competencies (e.g. math, logic, coding) to show where your fine-tune improved or regressed." />
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--charcoal)' }}>
                Multi-dimensional breakdown of capabilities.
              </p>
              <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Base Model" dataKey="base" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                    <Radar name="Fine-Tuned Model" dataKey="tuned" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                    <RechartsTooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .spinner-small { width: 20px; height: 20px; border: 2px solid rgba(0,0,0,0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
