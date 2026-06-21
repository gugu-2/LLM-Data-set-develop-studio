import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Code, FileText } from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Hypasia AI Assistant. How can I help you with your datasets, fine-tuning, or code debugging today?' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [context, setContext] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    if (!apiKey.trim()) {
      setErrorMessage("Please enter your Gemini API Key in the settings or at the top of the chat to continue.");
      setShowErrorPopup(true);
      return;
    }

    const userMsg = { role: 'user', content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs,
          context: context || null,
          api_key: apiKey || null
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Network response was not ok');
      }

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let assistantMsg = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantMsg += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantMsg;
          return updated;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <h1 className="display-font">AI Assistant</h1>
      
      <div className="surface-card mb-4 flex items-center gap-4" style={{padding: '1rem 1.5rem', flexShrink: 0}}>
        <label style={{fontSize: '0.875rem', fontWeight: 600}}>Gemini API Key</label>
        <input
          type="password"
          placeholder="AIzaSy..."
          className="input-field"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          style={{width: '250px', padding: '0.5rem 1rem'}}
        />
      </div>

      <div className="grid grid-cols-4 gap-4" style={{flex: 1, minHeight: 0}}>
        {/* Chat window */}
        <div className="col-span-3 surface-card flex flex-col" style={{padding: 0, overflow: 'hidden'}}>
          <div style={{flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16, 
                  background: m.role === 'assistant' ? 'var(--hero-glow)' : 'var(--surface-deep)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
                }}>
                  {m.role === 'assistant' ? <Bot size={16}/> : <User size={16}/>}
                </div>
                <div style={{
                  maxWidth: '80%', padding: '1rem 1.5rem', borderRadius: 16,
                  background: m.role === 'assistant' ? 'var(--surface-bone)' : 'var(--charcoal)',
                  color: m.role === 'assistant' ? 'var(--ink)' : 'var(--canvas)',
                  borderBottomLeftRadius: m.role === 'assistant' ? 4 : 16,
                  borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                }}>
                  <div style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem'}}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div style={{width: 32, height: 32, borderRadius: 16, background: 'var(--hero-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'}}>
                  <Bot size={16}/>
                </div>
                <div style={{padding: '1rem 1.5rem', borderRadius: 16, background: 'var(--surface-bone)', color: 'var(--ink)'}}>
                  <span className="spin" style={{display: 'inline-block'}}>⟳</span> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{padding: '1.5rem', borderTop: '1px solid var(--hairline)', background: 'var(--surface-card)'}}>
            <div className="flex gap-2">
              <input 
                className="input-field" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about data, fine-tuning, or paste an error..."
                style={{flex: 1}}
              />
              <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()}>
                <Send size={18}/>
              </button>
            </div>
          </div>
        </div>

        {/* Context panel */}
        <div className="col-span-1 surface-card flex flex-col" style={{padding: 0, overflow: 'hidden'}}>
          <div style={{padding: '1rem', borderBottom: '1px solid var(--hairline)', fontWeight: 600}}>
            <Code size={16} className="mr-2" style={{display: 'inline'}}/> Injected Context
          </div>
          <div style={{padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column'}}>
            <p style={{fontSize: '0.8rem', color: 'var(--charcoal)', marginBottom: '0.5rem'}}>
              Paste code, error logs, or sample data here. The assistant will read this with every message.
            </p>
            <textarea
              className="input-field"
              style={{flex: 1, resize: 'none', fontFamily: 'monospace', fontSize: '0.8rem', padding: '0.5rem'}}
              placeholder="Paste context here..."
              value={context}
              onChange={e => setContext(e.target.value)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
