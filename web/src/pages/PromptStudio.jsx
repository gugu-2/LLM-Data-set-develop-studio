import { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Plus, Network, Settings, AlertTriangle, Code, Database } from 'lucide-react';

const API = 'http://localhost:8000/api';

const initialNodes = [
  {
    id: 'system-1',
    type: 'default',
    data: { label: 'System Prompt\n"You are a helpful AI"' },
    position: { x: 100, y: 100 },
    style: { background: '#f8fafc', border: '2px solid #94a3b8', borderRadius: '8px', padding: '10px', width: 200 }
  },
  {
    id: 'user-1',
    type: 'default',
    data: { label: 'User Query\n"How do I sort an array?"' },
    position: { x: 100, y: 300 },
    style: { background: '#f8fafc', border: '2px solid #94a3b8', borderRadius: '8px', padding: '10px', width: 200 }
  }
];

const initialEdges = [
  { id: 'e1', source: 'system-1', target: 'user-1', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } }
];

export default function PromptStudio() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } }, eds)),
    []
  );

  const addNode = (type) => {
    let label = '';
    let nodeType = '';
    
    if (type === 'system') { label = 'System Prompt\n...'; nodeType = 'systemNode'; }
    else if (type === 'var') { label = 'Variable\n<context>'; nodeType = 'variableNode'; }
    else if (type === 'user') { label = 'User Query\n...'; nodeType = 'userQueryNode'; }
    
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      data: { label },
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      style: { background: '#f8fafc', border: '2px solid #94a3b8', borderRadius: '8px', padding: '10px', width: 200 }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleTest = async () => {
    setError('');
    setResult(null);
    setLoading(true);

    const payload = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.id.startsWith('system') ? 'systemNode' : n.id.startsWith('user') ? 'userQueryNode' : 'variableNode',
        data: { 
          content: n.data.label.split('\\n')[1] || n.data.label,
          query: n.data.label.split('\\n')[1] || n.data.label,
          name: 'variable'
        }
      })),
      edges: edges,
      sample_vars: { variable: "This is sample context text." }
    };

    try {
      const res = await fetch(`${API}/prompt/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to execute prompt graph');
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Network size={28} color="var(--primary)" />
          <h1 className="display-font" style={{ margin: 0, fontSize: '2rem' }}>Visual Prompt Studio</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => addNode('system')} style={{ background: 'var(--surface-bone)', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}><Settings size={14}/> + System</button>
          <button onClick={() => addNode('var')} style={{ background: 'var(--surface-bone)', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}><Database size={14}/> + Variable</button>
          <button onClick={() => addNode('user')} style={{ background: 'var(--surface-bone)', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}><Code size={14}/> + User</button>
          <button 
            onClick={handleTest} disabled={loading}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer', marginLeft: '1rem' }}
          >
            {loading ? <div className="spin"><Play size={14} /></div> : <Play size={14} />}
            {loading ? 'Executing...' : 'Run Pipeline'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        
        {/* Canvas */}
        <div className="surface-card" style={{ flex: 2, position: 'relative', overflow: 'hidden', padding: 0 }}>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onConnect={onConnect}
            fitView
          >
            <Background color="#ccc" gap={16} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Results Panel */}
        <div className="surface-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--hairline)', paddingBottom: '0.5rem' }}>Output Terminal</h2>
          
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '8px', color: '#991b1b', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }}/>
              <span style={{ fontSize: '0.85rem' }}>{error}</span>
            </div>
          )}

          {!result && !error && !loading && (
            <div style={{ color: 'var(--mute)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
              Build your prompt graph and click "Run Pipeline" to see the compiled output.
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--mute)', marginTop: '2rem' }}>
              <div className="spin" style={{ marginBottom: '1rem' }}><Network size={32} /></div>
              <span>Resolving topological graph...</span>
            </div>
          )}

          {result && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Compiled Prompt ({result.token_count} words)</div>
                <pre style={{ background: '#1e1e2e', color: '#cdd6f4', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace' }}>
                  {result.compiled_prompt}
                </pre>
              </div>
              
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>LLM Response</div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {result.model_output}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
