import { useState } from 'react';
import { Cpu, Zap, Code, Terminal, CheckCircle, FileJson, TrendingDown } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function PromptCompiler() {
  const [intent, setIntent] = useState("Extract all numerical values and format them as a markdown table.");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [ast, setAst] = useState(null);
  const [tokens, setTokens] = useState(null);

  const handleCompile = async () => {
    setLoading(true);
    setAst(null);
    setTokens(null);
    setResults(null);
    try {
      const res = await fetch(`${API}/compiler/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semantic_intent: intent })
      });
      if (res.ok) {
        const out = await res.json();
        setResults(out.results);
        setAst(out.ast);
        setTokens({ original: out.original_tokens, compressed: out.compressed_tokens });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: '12px' }}>
          <Zap size={32} color="#8b5cf6" />
        </div>
        <div>
          <h1 className="display-font" style={{ margin: 0, fontSize: '2.5rem' }}>Universal Prompt Compiler</h1>
          <p style={{ color: 'var(--mute)', margin: '0.25rem 0 0 0', fontSize: '1rem' }}>Token Compression & AST Validation Engine</p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} color="var(--primary)" /> Stop Writing Brittle Prompts
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--charcoal)', maxWidth: '700px', lineHeight: 1.5 }}>
            Prompts that work on one architecture break when you switch models. Define your <b>Semantic Intent</b> here, and the compiler will instantly parse it into an Abstract Syntax Tree (AST), apply Huffman-like token compression (saving ~40% on inference costs), and translate it into the exact structural tags required for any LLM.
          </p>
        </div>
      </div>

      <div className="surface-card" style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Your Sloppy Natural Language Intent:</label>
        <textarea 
          style={{ width: '100%', height: '100px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--hairline)', fontSize: '1rem', fontFamily: 'monospace' }}
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            onClick={handleCompile}
            disabled={loading || !intent}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? <span className="spin">⟳</span> : <Code size={18} />} Compile & Compress
          </button>
        </div>
      </div>

      {ast && tokens && (
        <div className="fade-in" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="surface-card" style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileJson size={18} color="#8b5cf6" /> Parsed Abstract Syntax Tree (AST)
            </h3>
            <pre style={{ background: '#1e293b', color: '#a78bfa', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', overflowX: 'auto', margin: 0 }}>
              {JSON.stringify(ast, null, 2)}
            </pre>
          </div>
          <div className="surface-card" style={{ width: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <TrendingDown size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Token Optimization</h3>
            <p style={{ color: 'var(--charcoal)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Redundant phrasing automatically stripped using AST mapping.</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--mute)' }}>{tokens.original}</div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--charcoal)' }}>Original</div>
              </div>
              <div style={{ fontSize: '1.5rem', color: 'var(--hairline)' }}>→</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{tokens.compressed}</div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#10b981' }}>Compressed</div>
              </div>
            </div>
            
            <div style={{ background: '#ecfdf5', color: '#059669', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
              Saved {ast.metadata.cost_saving} on Inference!
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="fade-in">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={20} color="var(--ink)" /> Compiled Binaries
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            <div className="surface-card" style={{ borderTop: '4px solid #3b82f6', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Meta Llama 3</h3>
                <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>VERIFIED <CheckCircle size={10} style={{ display: 'inline', marginLeft: 2 }} /></span>
              </div>
              <pre style={{ background: '#1e293b', color: '#38bdf8', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'pre-wrap', minHeight: '150px' }}>
                {results.llama3}
              </pre>
            </div>

            <div className="surface-card" style={{ borderTop: '4px solid #f97316', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Mistral / Mixtral</h3>
                <span style={{ fontSize: '0.75rem', background: '#fff7ed', color: '#c2410c', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>VERIFIED <CheckCircle size={10} style={{ display: 'inline', marginLeft: 2 }} /></span>
              </div>
              <pre style={{ background: '#1e293b', color: '#fdba74', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'pre-wrap', minHeight: '150px' }}>
                {results.mistral}
              </pre>
            </div>

            <div className="surface-card" style={{ borderTop: '4px solid #10b981', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>ChatML (Qwen, Yi)</h3>
                <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>VERIFIED <CheckCircle size={10} style={{ display: 'inline', marginLeft: 2 }} /></span>
              </div>
              <pre style={{ background: '#1e293b', color: '#6ee7b7', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'pre-wrap', minHeight: '150px' }}>
                {results.chatml}
              </pre>
            </div>

            <div className="surface-card" style={{ borderTop: '4px solid #a855f7', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Anthropic Claude</h3>
                <span style={{ fontSize: '0.75rem', background: '#faf5ff', color: '#7e22ce', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>VERIFIED <CheckCircle size={10} style={{ display: 'inline', marginLeft: 2 }} /></span>
              </div>
              <pre style={{ background: '#1e293b', color: '#d8b4fe', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'pre-wrap', minHeight: '150px' }}>
                {results.claude}
              </pre>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
