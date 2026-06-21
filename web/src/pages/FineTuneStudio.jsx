import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Terminal, Download, Cloud, Cpu, Bug, Search, Loader, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import InfoTooltip from '../components/InfoTooltip';

const API_BASE = "http://localhost:8000/api";

export default function FineTuneStudio() {
  const [target, setTarget] = useState("unsloth");
  const [modelName, setModelName] = useState("unsloth/llama-3-8b-Instruct-bnb-4bit");
  const [loraRank, setLoraRank] = useState(16);
  const [epochs, setEpochs] = useState(3);
  const [batchSize, setBatchSize] = useState(2);
  const [learningRate, setLearningRate] = useState("2e-4");
  const [dpoBeta, setDpoBeta] = useState(0.1);
  const [datasetName, setDatasetName] = useState("hypasia_dataset.jsonl");
  const [apiKey, setApiKey] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [isSweep, setIsSweep] = useState(false);

  const [cloudLogs, setCloudLogs] = useState([]);
  const [cloudDispatching, setCloudDispatching] = useState(false);


  const [models, setModels] = useState([]);
  const [modelQuery, setModelQuery] = useState("");
  const [searchingModels, setSearchingModels] = useState(false);

  const [debugError, setDebugError] = useState("");

  const [debugResult, setDebugResult] = useState("");
  const [debugLoading, setDebugLoading] = useState(false);

  // Telemetry States
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/telemetry/stream`);
        if (res.data && res.data.logs) {
          setTelemetryLogs(res.data.logs);
        }
      } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setGenerateError("");
    try {
      const res = await axios.post(`${API_BASE}/finetune/generate`, {
        target,
        model_name: modelName,
        lora_rank: loraRank,
        dataset_path: datasetName,
        epochs,
        batch_size: batchSize,
        learning_rate: learningRate,
        beta: dpoBeta,
        is_sweep: isSweep
      });
      setCode(res.data.code);
    } catch (err) {
      setGenerateError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloudDispatch = async () => {
    setCloudDispatching(true);
    setCloudLogs([]);
    setGenerateError("");
    
    try {
      const response = await fetch(`${API_BASE}/cloud/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: target === 'aws' ? 'aws' : target === 'gcp' ? 'gcp' : 'azure',
          model_name: modelName,
          dataset_path: datasetName,
          target_compute: target === 'gcp' ? 'g2-standard-8' : target === 'azure' ? 'Standard_NC6s_v3' : 'g5.2xlarge'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Cloud dispatch failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n').filter(l => l.trim() !== "");
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            setCloudLogs(prev => [...prev, data]);
          } catch(e) {}
        }
      }
    } catch (err) {
      setGenerateError(err.message);
    } finally {
      setCloudDispatching(false);
    }
  };

  const handleDebug = async () => {
    if(!debugError) return;
    setDebugLoading(true);
    setDebugResult("");
    try {
      const res = await axios.post(`${API_BASE}/debug/analyze`, {
        error_message: debugError,
        api_key: apiKey || undefined
      });
      setDebugResult(res.data.message || res.data.status);
    } catch (err) {
      setDebugResult("Failed to connect to Debugger API: " + (err.response?.data?.detail || err.message));
    } finally {
      setDebugLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="display-font">Fine-Tune Studio</h1>
      <p className="mb-4" style={{color: 'var(--charcoal)'}}>
        Configure hyperparameters and generate ready-to-run training code for your local GPU or Cloud.
      </p>

      <div className="surface-card mb-4 flex items-center gap-4" style={{padding: '1rem 1.5rem'}}>
        <label style={{fontSize: '0.875rem', fontWeight: 600}}>Gemini API Key (Optional)</label>
        <input
          type="password"
          placeholder="AIzaSy... (enables AI Debugger)"
          className="input-field"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          style={{width: '300px', padding: '0.5rem 1rem'}}
        />
      </div>

      {generateError && (
        <div className="surface-card mb-4" style={{borderColor: 'var(--badge-rejected)'}}>
          <h3 style={{color: 'var(--badge-rejected)'}}>Error generating script</h3>
          <p>{generateError}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Configuration Panel */}
        <div className="surface-card">
          <h2>Configuration</h2>
          
          <div className="input-group">
            <label>Deployment Target <InfoTooltip text="Choose where you want to train. Unsloth is optimized for local GPUs, while Cloud options automatically provision scalable infrastructure." /></label>
            <div className="flex gap-2">
              <select 
                className="input-field" 
                value={target} 
                onChange={(e) => setTarget(e.target.value)}
                style={{width: '100%', padding: '0.75rem', fontSize: '0.875rem'}}
              >
                <option value="unsloth">SFT (Unsloth Local)</option>
                <option value="unsloth_dpo">DPO (Unsloth Local)</option>
                <option value="unsloth_reward">Reward Model (Unsloth Local)</option>
                <option value="unsloth_ppo">PPO (Unsloth Local)</option>
                <option value="colab">Colab T4 / L4</option>
                <option value="aws">AWS SageMaker</option>
                <option value="gcp">GCP Vertex AI</option>
                <option value="azure">Azure ML</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <div className="flex justify-between items-end mb-1">
              <label style={{margin: 0}}>Base Model (HF ID)</label>
              <div className="flex gap-1" style={{width: '200px'}}>
                <input className="input-field" value={modelQuery} onChange={e => setModelQuery(e.target.value)} placeholder="Search HF..." style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}} />
                <button className="btn btn-outline" style={{padding: '0.25rem 0.5rem'}} onClick={async () => {
                  setSearchingModels(true);
                  try {
                    const r = await axios.get(`${API_BASE}/finetune/models?query=${modelQuery||'llama'}&limit=15`);
                    setModels(r.data.models);
                  } catch(e){} finally { setSearchingModels(false); }
                }}>
                  {searchingModels ? <Loader size={12} className="spin" /> : <Search size={12} />}
                </button>
              </div>
            </div>
            
            <input 
              className="input-field mb-2" 
              value={modelName} 
              onChange={e => setModelName(e.target.value)}
              placeholder="unsloth/llama-3-8b-Instruct-bnb-4bit"
            />
            {models.length > 0 && (
              <div style={{maxHeight: '150px', overflowY: 'auto', background: 'var(--surface-bone)', borderRadius: 6, border: '1px solid var(--hairline)'}}>
                {models.map(m => (
                  <div key={m.id} style={{padding: '0.5rem', fontSize: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--hairline)'}} onClick={() => {setModelName(m.id); setModels([]);}}>
                    <strong>{m.id}</strong> <span style={{color: 'var(--charcoal)'}}>({m.downloads.toLocaleString()} dl)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <div className="flex justify-between items-center mb-2">
              <label style={{margin: 0}}>Hyperparameters <InfoTooltip text="Variables that control how the AI learns. Sweep mode tests multiple combinations to find the mathematical optimum." /></label>
              
              {target === "unsloth" && (
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span style={{fontSize: '0.75rem', fontWeight: 600, color: isSweep ? '#f59e0b' : 'var(--charcoal)'}}>
                    🔥 Enable Hyperparameter Sweep
                  </span>
                  <label className="switch" style={{position: 'relative', display: 'inline-block', width: '34px', height: '20px'}}>
                    <input type="checkbox" checked={isSweep} onChange={e => setIsSweep(e.target.checked)} style={{opacity: 0, width: 0, height: 0}} />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: isSweep ? '#f59e0b' : '#ccc', transition: '.4s', borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '14px', width: '14px', 
                        left: isSweep ? '17px' : '3px', bottom: '3px', backgroundColor: 'white', 
                        transition: '.4s', borderRadius: '50%'
                      }}/>
                    </span>
                  </label>
                </div>
              )}
            </div>

            {isSweep ? (
              <div style={{background: '#fffbeb', color: '#b45309', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem', border: '1px solid #fde68a'}}>
                <strong>🔥 Sweep mode activated.</strong> Hypasia will generate a script that runs 3 parallel training loops testing different learning rates (2e-4, 1e-4, 5e-5). It will output the mathematically optimal model automatically.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label style={{fontSize: '0.75rem', color: 'var(--charcoal)'}}>Epochs: {epochs}</label>
                   <input type="range" min="1" max="10" step="1" value={epochs} onChange={e=>setEpochs(parseInt(e.target.value))} style={{width: '100%'}}/>
                 </div>
                 <div>
                   <label style={{fontSize: '0.75rem', color: 'var(--charcoal)'}}>Batch Size: {batchSize}</label>
                   <input type="range" min="1" max="32" step="1" value={batchSize} onChange={e=>setBatchSize(parseInt(e.target.value))} style={{width: '100%'}}/>
                 </div>
                 <div>
                   <label style={{fontSize: '0.75rem', color: 'var(--charcoal)'}}>LoRA Rank: {loraRank}</label>
                   <input type="range" min="8" max="128" step="8" value={loraRank} onChange={e=>setLoraRank(parseInt(e.target.value))} style={{width: '100%'}}/>
                 </div>
                 <div>
                   <label style={{fontSize: '0.75rem', color: 'var(--charcoal)'}}>Learning Rate</label>
                   <input type="text" className="input-field" value={learningRate} onChange={e=>setLearningRate(e.target.value)} style={{padding: '0.25rem 0.5rem', fontSize: '0.875rem'}}/>
                 </div>
                 {target === 'unsloth_dpo' && (
                   <div>
                     <label style={{fontSize: '0.75rem', color: 'var(--charcoal)'}}>DPO Beta: {dpoBeta}</label>
                     <input type="number" step="0.01" className="input-field" value={dpoBeta} onChange={e=>setDpoBeta(parseFloat(e.target.value))}/>
                   </div>
                 )}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Dataset Filename</label>
            <input type="text" className="input-field" value={datasetName} onChange={e=>setDatasetName(e.target.value)} placeholder="my_data.jsonl"/>
          </div>

          {(target === "aws" || target === "gcp" || target === "azure") ? (
             <div className="flex gap-2">
               <button className="btn btn-outline" onClick={handleGenerate} disabled={loading || cloudDispatching} style={{flex: 1}}>
                 <Terminal size={18}/> Generate Script
               </button>
               <button className="btn btn-primary" onClick={handleCloudDispatch} disabled={cloudDispatching || loading} style={{flex: 2, background: 'var(--hero-glow)', color: '#000'}}>
                 {cloudDispatching ? <><Loader className="spin" size={18} /> Launching Instance...</> : <><Rocket size={18} /> 1-Click Launch to Cloud</>}
               </button>
             </div>
          ) : (
            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || cloudDispatching} style={{width: '100%'}}>
              <Terminal size={18}/> Generate Training Script
            </button>
          )}
        </div>

        {/* Code Output */}
        <div className="surface-dark" style={{display: 'flex', flexDirection: 'column'}}>
          <div className="flex justify-between items-center mb-2">
            <h2>Generated Code</h2>
            {code && (
              <button
                className="btn btn-outline"
                style={{padding: '0.5rem 1rem'}}
                onClick={() => {
                  const blob = new Blob([code], {type: 'text/plain'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `train_${target}.py`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download size={14}/> Download
              </button>
            )}
          </div>
          <div className="code-block" style={{flex: 1, border: 'none', padding: 0}}>
            {cloudLogs.length > 0 ? (
              <div style={{padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem', color: '#00ff00', background: '#0a0a0a', height: '100%', overflowY: 'auto'}}>
                {cloudLogs.map((log, i) => (
                  <div key={i} style={{marginBottom: '0.5rem', opacity: log.status === 'success' ? 1 : 0.8, color: log.status === 'error' ? 'red' : '#00ff00'}}>
                    [{new Date().toLocaleTimeString()}] {log.message}
                  </div>
                ))}
                {cloudDispatching && <div style={{marginTop: '1rem'}}><Loader className="spin" size={14} style={{display: 'inline'}} /> waiting for response...</div>}
              </div>
            ) : code ? (
              <pre><code>{code}</code></pre>
            ) : (
              <div style={{color: 'var(--on-dark-mute)', textAlign: 'center', marginTop: '4rem'}}>
                Click Generate to create your training script, or Launch to Cloud to execute directly.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Telemetry Dashboard - always visible */}
      {(
        <div className="surface-card mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 style={{color: 'var(--primary)'}}><Activity size={20} style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}}/> Live Training Telemetry <InfoTooltip text="Real-time graphs showing the brain of the AI adapting to your dataset." /></h2>
            <div style={{fontSize: '0.875rem', color: 'var(--charcoal)'}}>
              Step: {telemetryLogs[telemetryLogs.length - 1]?.step || 0} | 
              Epoch: {Math.round((telemetryLogs[telemetryLogs.length - 1]?.epoch || 0) * 100) / 100}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Model Learning Progress */}
            <div className="surface-bone" style={{padding: '1rem', borderRadius: 8, border: '1px solid var(--hairline)'}}>
              <h3 style={{fontSize: '0.875rem', marginBottom: '0.5rem'}}>Model Learning Progress (Loss)</h3>
              <p style={{fontSize: '0.75rem', color: 'var(--charcoal)', marginBottom: '1rem'}}>Going down = Model is absorbing knowledge successfully.</p>
              <div style={{width: '100%', height: 200}}>
                <ResponsiveContainer>
                  <LineChart data={telemetryLogs.filter(l => l.loss !== undefined)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.2}/>
                    <XAxis dataKey="step" stroke="var(--charcoal)" fontSize={10} tickFormatter={(val) => `Step ${val}`}/>
                    <YAxis stroke="var(--charcoal)" fontSize={10} domain={['auto', 'auto']}/>
                    <Tooltip contentStyle={{background: '#1a1a1a', border: 'none', borderRadius: 4, color: '#fff'}}/>
                    <Line type="monotone" dataKey="loss" stroke="#2d9d5e" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confusion Meter */}
            <div className="surface-bone" style={{padding: '1rem', borderRadius: 8, border: '1px solid var(--hairline)'}}>
              <h3 style={{fontSize: '0.875rem', marginBottom: '0.5rem'}}>Confusion Meter (Gradient Norm)</h3>
              <p style={{fontSize: '0.75rem', color: 'var(--charcoal)', marginBottom: '1rem'}}>Spikes mean bad or contradictory data formatting.</p>
              <div style={{width: '100%', height: 200}}>
                <ResponsiveContainer>
                  <BarChart data={telemetryLogs.filter(l => l.grad_norm !== undefined)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.2}/>
                    <XAxis dataKey="step" stroke="var(--charcoal)" fontSize={10} tickFormatter={(val) => `Step ${val}`}/>
                    <YAxis stroke="var(--charcoal)" fontSize={10} />
                    <Tooltip contentStyle={{background: '#1a1a1a', border: 'none', borderRadius: 4, color: '#fff'}}/>
                    <Bar dataKey="grad_norm" fill="var(--badge-rejected)" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Brain Plasticity */}
            <div className="surface-bone" style={{padding: '1rem', borderRadius: 8, border: '1px solid var(--hairline)'}}>
              <h3 style={{fontSize: '0.875rem', marginBottom: '0.5rem'}}>Brain Plasticity (Learning Rate)</h3>
              <p style={{fontSize: '0.75rem', color: 'var(--charcoal)', marginBottom: '1rem'}}>Starts high for big concepts, decays for polishing details.</p>
              <div style={{width: '100%', height: 200}}>
                <ResponsiveContainer>
                  <LineChart data={telemetryLogs.filter(l => l.learning_rate !== undefined)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.2}/>
                    <XAxis dataKey="step" stroke="var(--charcoal)" fontSize={10} tickFormatter={(val) => `Step ${val}`}/>
                    <YAxis stroke="var(--charcoal)" fontSize={10} tickFormatter={(val) => val.toExponential(1)}/>
                    <Tooltip contentStyle={{background: '#1a1a1a', border: 'none', borderRadius: 4, color: '#fff'}}/>
                    <Line type="monotone" dataKey="learning_rate" stroke="#4868ff" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ETA / Speedometer Equivalent */}
            <div className="surface-bone flex items-center justify-center" style={{padding: '1rem', borderRadius: 8, border: '1px solid var(--hairline)', flexDirection: 'column'}}>
              <h3 style={{fontSize: '0.875rem', marginBottom: '0.5rem', width: '100%', textAlign: 'left'}}>Cost & Efficiency</h3>
              <div className="flex flex-col gap-4 w-full h-full justify-center">
                 <div style={{padding: '1rem', background: 'var(--surface-card)', borderRadius: 8, textAlign: 'center'}}>
                    <div style={{fontSize: '0.75rem', color: 'var(--charcoal)', textTransform: 'uppercase'}}>Epoch Progress</div>
                    <div style={{fontSize: '2rem', fontWeight: 800, color: 'var(--hero-glow)', fontFamily: 'Bricolage Grotesque, sans-serif'}}>
                      {(telemetryLogs[telemetryLogs.length - 1]?.epoch || 0).toFixed(2)} / {epochs}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Debugging Assistant */}
      <div className="surface-dark">
        <h2 style={{color: 'var(--hero-glow)'}}><Bug size={20} style={{display: 'inline', verticalAlign: 'middle'}}/> AI Debugging Assistant</h2>
        <p className="mb-4" style={{fontSize: '0.875rem', color: 'var(--on-dark-mute)'}}>
          Paste any PyTorch or CUDA OutOfMemory errors here. Gemini will analyze it and provide a fix.
        </p>
        <div className="flex gap-2">
          <textarea 
            className="input-field" 
            placeholder="Paste your traceback error here..."
            rows={3}
            value={debugError}
            onChange={e => setDebugError(e.target.value)}
            style={{resize: 'none', background: 'var(--surface-card)', color: 'var(--ink)'}}
          />
          <button className="btn btn-primary" onClick={handleDebug} disabled={debugLoading || !debugError}>
            Analyze
          </button>
        </div>

        {debugResult && (
          <div className="mt-4 code-block" style={{background: 'var(--surface-deep)', border: '1px solid var(--hairline-strong)'}}>
            <pre style={{whiteSpace: 'pre-wrap'}}>{debugResult}</pre>
          </div>
        )}
      </div>

    </div>
  );
}
