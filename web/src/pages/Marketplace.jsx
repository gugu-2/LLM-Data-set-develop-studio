import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ShoppingCart, Star, ShieldCheck, Download, Loader, BadgeCheck } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/marketplace';

export default function Marketplace() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState(null);

  const fetchDatasets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/list`);
      setDatasets(res.data.datasets || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleBuy = async (dataset) => {
    try {
      setPurchasing(dataset.id);
      
      // 1. Hit the secure checkout gateway (Mock Stripe)
      const checkoutRes = await axios.post(`${API_BASE}/checkout`, { dataset_id: dataset.id });
      const token = checkoutRes.data.download_token;
      
      // 2. Consume the secure token to download the data
      const downloadRes = await axios.post(`${API_BASE}/download`, { token });
      
      // Trigger download
      const jsonl = downloadRes.data.data.map(p => JSON.stringify(p)).join('\\n');
      const blob = new Blob([jsonl], { type: 'application/jsonl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset.title.replace(/\\s+/g, '_').toLowerCase()}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      alert("Purchase failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="display-font" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={32} color="var(--primary)" /> Expert Marketplace
          </h1>
          <p style={{ color: 'var(--charcoal)' }}>Browse and purchase verified, domain-expert datasets for fine-tuning.</p>
        </div>
      </div>

      {error && (
        <div className="surface-card mb-4" style={{ borderColor: 'var(--badge-rejected)' }}>
          <p style={{ color: 'var(--badge-rejected)' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <Loader className="spin" size={32} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <p>Loading marketplace...</p>
        </div>
      ) : datasets.length === 0 ? (
        <div className="surface-card text-center py-8">
          <p style={{ color: 'var(--charcoal)' }}>No datasets published yet. Head to the Expert Elicitor to publish the first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map(dataset => (
            <div key={dataset.id} className="surface-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between items-start mb-2">
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{dataset.title}</h3>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>
                  ${dataset.price}
                </div>
              </div>
              
              <div className="mb-4" style={{ fontSize: '0.875rem', color: 'var(--charcoal)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <ShieldCheck size={14} color="var(--success)" />
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>Verified Expert:</span> {dataset.expert_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <BadgeCheck size={14} color="var(--primary)" />
                  <span>Domain: {dataset.domain}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={14} color="var(--accent)" />
                  <span>{dataset.rows_count} High-Quality Pairs</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--hairline)' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                  onClick={() => handleBuy(dataset)}
                  disabled={purchasing === dataset.id}
                >
                  {purchasing === dataset.id ? (
                    <><Loader className="spin" size={16} /> Processing...</>
                  ) : (
                    <><Download size={16} /> Buy & Download</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
