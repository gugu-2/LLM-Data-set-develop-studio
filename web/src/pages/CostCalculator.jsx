import React, { useState, useMemo } from 'react';
import { Calculator, AlertTriangle, Cpu, HardDrive, DollarSign, Clock, Zap, CheckCircle, Settings as SettingsIcon, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PRESET_MODELS = [
  // Meta
  { id: 'llama3-8b', name: 'Llama-3 (8B)', params: 8, group: 'Meta' },
  { id: 'llama3-70b', name: 'Llama-3 (70B)', params: 70, group: 'Meta' },
  { id: 'llama2-7b', name: 'Llama-2 (7B)', params: 7, group: 'Meta' },
  { id: 'llama2-13b', name: 'Llama-2 (13B)', params: 13, group: 'Meta' },
  { id: 'llama2-70b', name: 'Llama-2 (70B)', params: 70, group: 'Meta' },
  
  // Mistral
  { id: 'mistral-7b', name: 'Mistral (7B)', params: 7, group: 'Mistral AI' },
  { id: 'mixtral-8x7b', name: 'Mixtral (8x7B)', params: 47, group: 'Mistral AI' }, // active params approx
  
  // Google
  { id: 'gemma-2b', name: 'Gemma (2B)', params: 2, group: 'Google' },
  { id: 'gemma-7b', name: 'Gemma (7B)', params: 7, group: 'Google' },
  { id: 'gemma-27b', name: 'Gemma (27B)', params: 27, group: 'Google' },
  
  // Alibaba
  { id: 'qwen-0.5b', name: 'Qwen 1.5 (0.5B)', params: 0.5, group: 'Alibaba' },
  { id: 'qwen-1.8b', name: 'Qwen 1.5 (1.8B)', params: 1.8, group: 'Alibaba' },
  { id: 'qwen-4b', name: 'Qwen 1.5 (4B)', params: 4, group: 'Alibaba' },
  { id: 'qwen-7b', name: 'Qwen 1.5 (7B)', params: 7, group: 'Alibaba' },
  { id: 'qwen-14b', name: 'Qwen 1.5 (14B)', params: 14, group: 'Alibaba' },
  { id: 'qwen-32b', name: 'Qwen 1.5 (32B)', params: 32, group: 'Alibaba' },
  { id: 'qwen-72b', name: 'Qwen 1.5 (72B)', params: 72, group: 'Alibaba' },
  { id: 'qwen-110b', name: 'Qwen 1.5 (110B)', params: 110, group: 'Alibaba' },

  // DeepSeek
  { id: 'deepseek-7b', name: 'DeepSeek (7B)', params: 7, group: 'DeepSeek' },
  { id: 'deepseek-33b', name: 'DeepSeek Coder (33B)', params: 33, group: 'DeepSeek' },
  { id: 'deepseek-67b', name: 'DeepSeek LLM (67B)', params: 67, group: 'DeepSeek' },

  { id: 'custom', name: 'Custom Model...', params: 8, group: 'Other' },
];

const HARDWARE = [
  { id: 'h100', name: 'NVIDIA H100', vram: 80, tflops: 989, price: 3.50 },
  { id: 'a100-80', name: 'NVIDIA A100 (80GB)', vram: 80, tflops: 312, price: 1.50 },
  { id: 'a100-40', name: 'NVIDIA A100 (40GB)', vram: 40, tflops: 312, price: 1.10 },
  { id: 'rtx4090', name: 'RTX 4090', vram: 24, tflops: 82, price: 0.50 },
  { id: 't4', name: 'NVIDIA T4', vram: 16, tflops: 65, price: 0.35 },
  { id: 'v100', name: 'NVIDIA V100', vram: 16, tflops: 125, price: 0.90 },
];

export default function CostCalculator() {
  // Model
  const [modelPreset, setModelPreset] = useState('llama3-8b');
  const [paramsBillion, setParamsBillion] = useState(8);
  const [quantized, setQuantized] = useState(true);

  // Data
  const [numRows, setNumRows] = useState(10000);
  const [avgWordsPerRow, setAvgWordsPerRow] = useState(300);
  const [numImages, setNumImages] = useState(0);

  // Hardware
  const [gpuId, setGpuId] = useState('a100-80');
  const [numGpus, setNumGpus] = useState(1);
  const [manualPrice, setManualPrice] = useState(0);

  // Hyperparameters
  const [batchSize, setBatchSize] = useState(4);
  const [epochs, setEpochs] = useState(3);
  const [loraRank, setLoraRank] = useState(16);
  const [contextWindow, setContextWindow] = useState(2048);

  const handleModelPresetChange = (e) => {
    const id = e.target.value;
    setModelPreset(id);
    const m = PRESET_MODELS.find(x => x.id === id);
    if (m && m.id !== 'custom') {
      setParamsBillion(m.params);
    }
  };

  // Math Logic
  const results = useMemo(() => {
    // 1. Tokens Calculation
    const textTokens = numRows * avgWordsPerRow * 1.3;
    const imageTokens = numImages * 258;
    const totalTokens = textTokens + imageTokens;

    // 2. VRAM Calculation
    const weightBytes = quantized ? 0.7 : 2.0;
    const baseMem = paramsBillion * weightBytes;
    const loraMem = loraRank > 0 ? (paramsBillion * 0.1 * (loraRank / 16)) : 0;
    const memPerK = paramsBillion > 30 ? 1.5 : 0.4;
    const ctxMem = (batchSize * (contextWindow / 1024)) * memPerK;
    const totalVramGB = baseMem + loraMem + ctxMem;

    // 3. Current Hardware Checks
    const currentGpu = HARDWARE.find(g => g.id === gpuId);
    const pricePerHour = manualPrice > 0 ? manualPrice : currentGpu.price;
    const availableVram = currentGpu.vram;
    const isOom = totalVramGB > availableVram;

    // 4. Time Calculation
    const utilization = 0.3; // 30% MFU
    const totalFlops = 8 * totalTokens * (paramsBillion * 1e9) * epochs;
    const systemFlopsPerSec = (currentGpu.tflops * 1e12) * numGpus * utilization;
    const timeSeconds = totalFlops / systemFlopsPerSec;
    const timeHours = timeSeconds / 3600;
    const totalCost = timeHours * pricePerHour * numGpus;

    // 5. Compute Comparative Data across ALL GPUs using reduce to avoid mutation
    const comparativeData = HARDWARE.map(gpu => {
      const gIsOom = totalVramGB > gpu.vram;
      const gSysFlops = (gpu.tflops * 1e12) * numGpus * utilization;
      const gTimeHours = (totalFlops / gSysFlops) / 3600;
      const gCost = gTimeHours * gpu.price * numGpus;
      return {
        name: gpu.name,
        vram: gpu.vram,
        time: gIsOom ? 0 : Number(gTimeHours.toFixed(2)),
        cost: gIsOom ? 0 : Number(gCost.toFixed(2)),
        isOom: gIsOom
      };
    });

    const viable = comparativeData.filter(x => !x.isOom);
    const fastestItem = viable.length ? viable.reduce((a, b) => a.time < b.time ? a : b) : null;
    const cheapestItem = viable.length ? viable.reduce((a, b) => a.cost < b.cost ? a : b) : null;
    const recommendedItem = viable.length
      ? (viable.slice().sort((a, b) => a.cost - b.cost).find(x => x.time <= 24) || fastestItem)
      : null;

    return {
      totalTokens,
      baseMem,
      loraMem,
      ctxMem,
      totalVramGB,
      availableVram,
      isOom,
      timeHours,
      totalCost,
      gpuName: currentGpu.name,
      comparativeData,
      fastest: fastestItem,
      cheapest: cheapestItem,
      recommended: recommendedItem
    };
  }, [paramsBillion, quantized, numRows, avgWordsPerRow, numImages, batchSize, epochs, loraRank, contextWindow, gpuId, numGpus, manualPrice]);

  return (
    <div className="fade-in pb-10">
      <h1 className="display-font"><Calculator size={28} style={{display: 'inline', verticalAlign: 'text-bottom', marginRight: 8, color: 'var(--primary)'}}/> AI Training Calculator</h1>
      <p style={{marginBottom: '2rem', color: 'var(--charcoal)', maxWidth: '800px'}}>
        Estimate the financial cost, duration, and hardware requirements for fine-tuning your Large Language Model. Predict <strong>Out of Memory (OOM)</strong> failures before spinning up expensive cloud instances.
      </p>

      {results.isOom && (
        <div className="surface-card" style={{marginBottom: '2rem', borderLeft: '4px solid var(--badge-rejected)', background: 'rgba(234, 40, 4, 0.05)'}}>
          <h3 style={{color: 'var(--badge-rejected)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, paddingBottom: '0.5rem'}}>
            <AlertTriangle size={20}/> Failure Predicted: CUDA OutOfMemoryError
          </h3>
          <p style={{margin: 0, fontSize: '0.875rem', color: 'var(--ink)'}}>
            Your configuration requires <strong>{results.totalVramGB.toFixed(1)} GB</strong> of VRAM, but a single {results.gpuName} only has <strong>{results.availableVram} GB</strong>. Training will immediately crash.
          </p>
          <div style={{marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--charcoal)'}}>
            <strong>Suggested Fixes:</strong>
            <ul style={{marginTop: '0.25rem', paddingLeft: '1.2rem'}}>
              <li>Reduce Batch Size (currently {batchSize}) to lower activation memory.</li>
              <li>Reduce Context Window (currently {contextWindow}) to lower activation memory.</li>
              <li>Select a GPU with more VRAM (e.g. A100 80GB or H100).</li>
              <li>{quantized ? '' : 'Enable 4-bit Quantization (QLoRA) to slash base model memory.'}</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Input Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Model Selection */}
          <div className="surface-card reveal-left">
            <h2 className="flex items-center gap-2"><Cpu size={18}/> 1. Model Configuration</h2>
            <div className="flex flex-col gap-4 mt-4">
              <div className="input-group">
                <label>LLM Preset</label>
                <select className="input-field" value={modelPreset} onChange={handleModelPresetChange}>
                  {Object.entries(
                    PRESET_MODELS.reduce((acc, m) => {
                      (acc[m.group] = acc[m.group] || []).push(m);
                      return acc;
                    }, {})
                  ).map(([group, models]) => (
                    <optgroup key={group} label={group}>
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Parameters (Billions)</label>
                <input type="number" className="input-field" value={paramsBillion} onChange={e=>setParamsBillion(parseFloat(e.target.value))} disabled={modelPreset !== 'custom'} />
              </div>
              <div className="input-group" style={{gridColumn: '1 / -1'}}>
                <label className="flex items-center gap-2" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={quantized} onChange={e=>setQuantized(e.target.checked)}/>
                  Use 4-Bit Quantization (QLoRA)
                </label>
                <p style={{fontSize: '0.75rem', color: 'var(--charcoal)', marginLeft: '1.5rem', marginTop: '0.2rem'}}>Drastically reduces memory usage with minimal quality loss.</p>
              </div>
            </div>
          </div>

          {/* Dataset Size */}
          <div className="surface-card reveal-right" style={{animationDelay: '0.1s'}}>
            <h2 className="flex items-center gap-2"><HardDrive size={18}/> 2. Dataset Size</h2>
            <div className="flex flex-col gap-4 mt-4">
              <div className="input-group">
                <label>Number of Rows (Examples)</label>
                <input type="number" className="input-field" value={numRows} onChange={e=>setNumRows(parseInt(e.target.value))} />
              </div>
              <div className="input-group">
                <label>Avg. Words per Row</label>
                <input type="number" className="input-field" value={avgWordsPerRow} onChange={e=>setAvgWordsPerRow(parseInt(e.target.value))} />
              </div>
              <div className="input-group">
                <label>Number of Images (Vision)</label>
                <input type="number" className="input-field" value={numImages} onChange={e=>setNumImages(parseInt(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Training Hyperparameters */}
          <div className="surface-card reveal-top" style={{animationDelay: '0.2s'}}>
            <h2 className="flex items-center gap-2"><SettingsIcon size={18}/> 3. Training Parameters</h2>
            <div className="flex flex-col gap-4 mt-4">
              <div className="input-group">
                <label>Batch Size: {batchSize}</label>
                <input type="range" min="1" max="64" value={batchSize} onChange={e=>setBatchSize(parseInt(e.target.value))} style={{width: '100%'}}/>
              </div>
              <div className="input-group">
                <label>Context Window (Tokens): {contextWindow}</label>
                <input type="range" min="512" max="16384" step="512" value={contextWindow} onChange={e=>setContextWindow(parseInt(e.target.value))} style={{width: '100%'}}/>
              </div>
              <div className="input-group">
                <label>LoRA Rank (r): {loraRank}</label>
                <input type="range" min="8" max="128" step="8" value={loraRank} onChange={e=>setLoraRank(parseInt(e.target.value))} style={{width: '100%'}}/>
              </div>
              <div className="input-group">
                <label>Epochs: {epochs}</label>
                <input type="range" min="1" max="10" value={epochs} onChange={e=>setEpochs(parseInt(e.target.value))} style={{width: '100%'}}/>
              </div>
            </div>
          </div>

          {/* Hardware Selection */}
          <div className="surface-card reveal-bottom" style={{animationDelay: '0.3s'}}>
            <h2 className="flex items-center gap-2"><Zap size={18}/> 4. Cloud Hardware</h2>
            <div className="flex flex-col gap-4 mt-4">
              <div className="input-group">
                <label>GPU Type</label>
                <select className="input-field" value={gpuId} onChange={e=>setGpuId(e.target.value)}>
                  {HARDWARE.map(h => <option key={h.id} value={h.id}>{h.name} (${h.price.toFixed(2)}/hr)</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Number of GPUs</label>
                <input type="number" min="1" max="8" className="input-field" value={numGpus} onChange={e=>setNumGpus(parseInt(e.target.value))} />
              </div>
              <div className="input-group" style={{gridColumn: '1 / -1'}}>
                <label>Override Hourly Price ($) - Leave 0 for default</label>
                <input type="number" step="0.10" className="input-field" value={manualPrice} onChange={e=>setManualPrice(parseFloat(e.target.value))} placeholder="0.00" />
              </div>
            </div>
          </div>

        </div>

        {/* Results Sticky Sidebar */}
        <div style={{position: 'sticky', top: '2rem'}} className="reveal-right" style={{animationDelay: '0.4s'}}>
          <div className="surface-dark">
            <h2 style={{color: 'var(--hero-glow)', marginBottom: '1.5rem'}}>Estimated Results</h2>
            
            <div className="flex flex-col gap-4">
              <div style={{paddingBottom: '1rem', borderBottom: '1px solid var(--hairline-strong)'}}>
                <div style={{fontSize: '0.75rem', color: 'var(--on-dark-mute)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Total Estimated Cost</div>
                <div style={{fontSize: '2.5rem', fontWeight: 800, color: 'var(--badge-gold)', fontFamily: 'Bricolage Grotesque, sans-serif'}}>
                  ${results.totalCost.toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div style={{fontSize: '0.75rem', color: 'var(--on-dark-mute)'}}>Training Time</div>
                  <div style={{fontSize: '1.25rem', fontWeight: 600, color: '#fff'}} className="flex items-center gap-1">
                    <Clock size={16}/> {results.timeHours.toFixed(1)} hrs
                  </div>
                </div>
                <div>
                  <div style={{fontSize: '0.75rem', color: 'var(--on-dark-mute)'}}>Total Tokens</div>
                  <div style={{fontSize: '1.25rem', fontWeight: 600, color: '#fff'}}>
                    {(results.totalTokens / 1e6).toFixed(1)}M
                  </div>
                </div>
              </div>

              <div style={{marginTop: '1rem'}}>
                <div className="flex justify-between items-center mb-1">
                  <div style={{fontSize: '0.75rem', color: 'var(--on-dark-mute)'}}>Peak VRAM Usage</div>
                  <div style={{fontSize: '0.75rem', color: results.isOom ? 'var(--badge-rejected)' : '#2d9d5e', fontWeight: 'bold'}}>
                    {results.totalVramGB.toFixed(1)} / {results.availableVram} GB
                  </div>
                </div>
                {/* Progress bar for VRAM */}
                <div style={{width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', display: 'flex'}}>
                   <div style={{height: '100%', background: '#4868ff', width: `${Math.min((results.baseMem / results.availableVram) * 100, 100)}%`}} title="Base Model Weights"></div>
                   <div style={{height: '100%', background: '#9d4edd', width: `${Math.min((results.loraMem / results.availableVram) * 100, 100)}%`}} title="LoRA Adapters"></div>
                   <div style={{height: '100%', background: '#fca311', width: `${Math.min((results.ctxMem / results.availableVram) * 100, 100)}%`}} title="Activations (Batch & Context)"></div>
                </div>
                <div className="flex gap-4 mt-2 text-[0.65rem]" style={{color: 'var(--on-dark-mute)'}}>
                  <div className="flex items-center gap-1"><span style={{display:'inline-block', width:8, height:8, background: '#4868ff', borderRadius: 2}}></span> Weights</div>
                  <div className="flex items-center gap-1"><span style={{display:'inline-block', width:8, height:8, background: '#9d4edd', borderRadius: 2}}></span> LoRA</div>
                  <div className="flex items-center gap-1"><span style={{display:'inline-block', width:8, height:8, background: '#fca311', borderRadius: 2}}></span> Context</div>
                </div>
              </div>

              {results.isOom ? (
                <div className="mt-4" style={{padding: '0.75rem', background: 'rgba(234, 40, 4, 0.1)', color: 'var(--badge-rejected)', borderRadius: 6, fontSize: '0.875rem', textAlign: 'center'}}>
                  <AlertTriangle size={16} style={{display: 'inline', marginRight: 4, verticalAlign: 'text-bottom'}}/> 
                  Cannot train. Out of memory.
                </div>
              ) : (
                <div className="mt-4" style={{padding: '0.75rem', background: 'rgba(45, 157, 94, 0.1)', color: '#2d9d5e', borderRadius: 6, fontSize: '0.875rem', textAlign: 'center'}}>
                  <CheckCircle size={16} style={{display: 'inline', marginRight: 4, verticalAlign: 'text-bottom'}}/> 
                  Configuration is optimal for training.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GPU Comparative Analysis Section */}
      <div className="surface-bone reveal-bottom" style={{marginTop: '4rem', animationDelay: '0.5s', padding: '2rem', borderRadius: '16px', border: '1px solid var(--hairline)'}}>
        <h2 className="flex items-center gap-2" style={{marginBottom: '2rem'}}><BarChart2 size={24} style={{color: 'var(--primary)'}}/> Hardware Market Comparison</h2>
        
        {/* Recommendation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="surface-card" style={{borderTop: '4px solid #2d9d5e'}}>
            <div style={{fontSize: '0.875rem', color: 'var(--charcoal)', textTransform: 'uppercase', fontWeight: 600}}>⭐ Recommended</div>
            {results.recommended ? (
              <>
                <div style={{fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0'}}>{results.recommended.name}</div>
                <div style={{fontSize: '0.875rem', color: 'var(--mute)'}}>Good balance of cost (${results.recommended.cost}) and time ({results.recommended.time} hrs).</div>
              </>
            ) : (
              <div style={{color: 'var(--badge-rejected)', marginTop: '0.5rem'}}>No GPU has enough VRAM for this.</div>
            )}
          </div>
          
          <div className="surface-card" style={{borderTop: '4px solid #fca311'}}>
            <div style={{fontSize: '0.875rem', color: 'var(--charcoal)', textTransform: 'uppercase', fontWeight: 600}}>💰 Cheapest</div>
            {results.cheapest ? (
              <>
                <div style={{fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0'}}>{results.cheapest.name}</div>
                <div style={{fontSize: '0.875rem', color: 'var(--mute)'}}>Lowest total cost (${results.cheapest.cost}), but takes {results.cheapest.time} hrs.</div>
              </>
            ) : (
              <div style={{color: 'var(--badge-rejected)', marginTop: '0.5rem'}}>All GPUs OOM.</div>
            )}
          </div>

          <div className="surface-card" style={{borderTop: '4px solid #4868ff'}}>
            <div style={{fontSize: '0.875rem', color: 'var(--charcoal)', textTransform: 'uppercase', fontWeight: 600}}>🚀 Fastest</div>
            {results.fastest ? (
              <>
                <div style={{fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0'}}>{results.fastest.name}</div>
                <div style={{fontSize: '0.875rem', color: 'var(--mute)'}}>Finishes in {results.fastest.time} hrs. Total cost: ${results.fastest.cost}.</div>
              </>
            ) : (
              <div style={{color: 'var(--badge-rejected)', marginTop: '0.5rem'}}>All GPUs OOM.</div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div style={{minWidth: 0}}>
            <h3 style={{fontSize: '1rem', color: 'var(--charcoal)', marginBottom: '1rem'}}>Total Training Cost ($)</h3>
            <div style={{height: 250, width: '100%', minWidth: 0}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.comparativeData.map(d => ({...d, cost: d.isOom ? 0 : d.cost}))} layout="vertical" margin={{left: 40}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} stroke="var(--ink)"/>
                  <XAxis type="number" stroke="var(--charcoal)" fontSize={11} tickFormatter={(v)=>`$${v}`}/>
                  <YAxis dataKey="name" type="category" stroke="var(--charcoal)" fontSize={11} width={120}/>
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} formatter={(val, name, props) => props.payload.isOom ? ['OOM', 'Cost'] : [`$${val}`, 'Cost']} />
                  <Bar dataKey="cost" fill="#fca311" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{minWidth: 0}}>
            <h3 style={{fontSize: '1rem', color: 'var(--charcoal)', marginBottom: '1rem'}}>Estimated Training Time (Hours)</h3>
            <div style={{height: 250, width: '100%', minWidth: 0}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.comparativeData.map(d => ({...d, time: d.isOom ? 0 : d.time}))} layout="vertical" margin={{left: 40}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} stroke="var(--ink)"/>
                  <XAxis type="number" stroke="var(--charcoal)" fontSize={11} tickFormatter={(v)=>`${v}h`}/>
                  <YAxis dataKey="name" type="category" stroke="var(--charcoal)" fontSize={11} width={120}/>
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} formatter={(val, name, props) => props.payload.isOom ? ['OOM', 'Time'] : [`${val} hrs`, 'Time']} />
                  <Bar dataKey="time" fill="#4868ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
