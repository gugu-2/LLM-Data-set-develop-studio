import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Flame, Search, ChevronUp, Star, TrendingUp } from 'lucide-react';

// Simulated Leaderboard Data
const MOCK_LEADERS = [
  { id: 1, rank: 1, name: "DataAlchemist", role: "Elite Data Engineer", score: 98500, rows: 250000, badges: ["verified", "top1", "bug_hunter"], trend: "up" },
  { id: 2, rank: 2, name: "NeuralKnight", role: "AI Researcher", score: 87200, rows: 180000, badges: ["verified", "top1"], trend: "up" },
  { id: 3, rank: 3, name: "SynapseWeaver", role: "Prompt Engineer", score: 81050, rows: 165000, badges: ["verified", "prompt_master"], trend: "down" },
  { id: 4, rank: 4, name: "CipherSec", role: "Red Team Specialist", score: 76000, rows: 85000, badges: ["bug_hunter", "verified"], trend: "up" },
  { id: 5, rank: 5, name: "TuringTest_99", role: "Data Annotator", score: 62400, rows: 120000, badges: ["fast_fingers"], trend: "same" },
  { id: 6, rank: 6, name: "MetaMiner", role: "Data Engineer", score: 58000, rows: 110000, badges: [], trend: "down" },
  { id: 7, rank: 7, name: "OllamaLlama", role: "Community Member", score: 45000, rows: 95000, badges: ["rising_star"], trend: "up" },
  { id: 8, rank: 8, name: "Quantums", role: "Data Scientist", score: 42100, rows: 80000, badges: [], trend: "same" },
  { id: 9, rank: 9, name: "SillyLlama", role: "Hobbyist", score: 39000, rows: 60000, badges: [], trend: "up" },
  { id: 10, rank: 10, name: "DeepThink", role: "AI Engineer", score: 38500, rows: 55000, badges: ["verified"], trend: "down" }
];

const BADGE_INFO = {
  verified: { icon: <ShieldCheck size={14} />, color: "#10b981", bg: "#ecfdf5", label: "Verified Contributor" },
  top1: { icon: <Medal size={14} />, color: "#eab308", bg: "#fefce8", label: "Top 1% Global" },
  bug_hunter: { icon: <AlertTriangle size={14} />, color: "#ef4444", bg: "#fef2f2", label: "Elite Red Team" },
  prompt_master: { icon: <Wand2 size={14} />, color: "#8b5cf6", bg: "#f3e8ff", label: "Prompt Master" },
  fast_fingers: { icon: <Zap size={14} />, color: "#f97316", bg: "#fff7ed", label: "Speed Annotator" },
  rising_star: { icon: <Star size={14} />, color: "#06b6d4", bg: "#ecfeff", label: "Rising Star" }
};

// Lazy import icons to prevent circular dependency
import { ShieldCheck, AlertTriangle, Wand2, Zap } from 'lucide-react';

export default function Leaderboard() {
  const [search, setSearch] = useState('');
  
  const filtered = MOCK_LEADERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <Trophy size={36} color="#eab308" />
        <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem', textAlign: 'center' }}>Global Leaderboard</h1>
      </div>
      <p style={{ color: 'var(--charcoal)', textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
        Compete with the best data engineers globally. Earn XP by contributing high-quality datasets, red-teaming models, and building prompt chains.
      </p>

      {/* Top 3 Podium */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '4rem', height: '240px' }}>
        {/* Rank 2 */}
        <div className="surface-card" style={{ width: '200px', height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '1.5rem', borderBottom: '6px solid #94a3b8', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-25px', background: '#94a3b8', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>2</div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{MOCK_LEADERS[1].name}</h3>
          <div style={{ color: 'var(--mute)', fontSize: '0.8rem', marginBottom: '1rem' }}>{MOCK_LEADERS[1].role}</div>
          <div style={{ background: '#f8fafc', padding: '0.4rem 1rem', borderRadius: '30px', fontWeight: 700, color: 'var(--ink)' }}>{MOCK_LEADERS[1].score.toLocaleString()} XP</div>
        </div>

        {/* Rank 1 */}
        <div className="surface-card" style={{ width: '220px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '1.5rem', borderBottom: '6px solid #eab308', position: 'relative', boxShadow: '0 20px 40px rgba(234, 179, 8, 0.15)', zIndex: 10 }}>
          <div style={{ position: 'absolute', top: '-40px' }}><Award size={64} color="#eab308" fill="#fef08a" /></div>
          <div style={{ position: 'absolute', top: '-15px', background: '#eab308', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>1</div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#854d0e' }}>{MOCK_LEADERS[0].name}</h3>
          <div style={{ color: 'var(--mute)', fontSize: '0.8rem', marginBottom: '1rem' }}>{MOCK_LEADERS[0].role}</div>
          <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '0.5rem 1.2rem', borderRadius: '30px', fontWeight: 800, color: '#ca8a04', fontSize: '1.1rem' }}>{MOCK_LEADERS[0].score.toLocaleString()} XP</div>
        </div>

        {/* Rank 3 */}
        <div className="surface-card" style={{ width: '200px', height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '1.5rem', borderBottom: '6px solid #b45309', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-25px', background: '#b45309', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>3</div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{MOCK_LEADERS[2].name}</h3>
          <div style={{ color: 'var(--mute)', fontSize: '0.8rem', marginBottom: '1rem' }}>{MOCK_LEADERS[2].role}</div>
          <div style={{ background: '#f8fafc', padding: '0.4rem 1rem', borderRadius: '30px', fontWeight: 700, color: 'var(--ink)' }}>{MOCK_LEADERS[2].score.toLocaleString()} XP</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="surface-card" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={20} color="#f97316" /> Top Contributors
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-bone)', padding: '0.5rem 1rem', borderRadius: '30px', width: '300px' }}>
            <Search size={16} color="var(--mute)" style={{ marginRight: '0.5rem' }} />
            <input 
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or role..."
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--hairline)', color: 'var(--charcoal)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem 1.5rem', width: '80px' }}>Rank</th>
              <th style={{ padding: '1rem' }}>User</th>
              <th style={{ padding: '1rem' }}>Badges</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Rows Contributed</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Total XP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--hairline)', transition: 'background 0.2s' }} className="table-row-hover">
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: u.rank <= 3 ? '#ca8a04' : 'var(--ink)' }}>
                    #{u.rank}
                    {u.trend === 'up' && <TrendingUp size={14} color="#10b981" />}
                    {u.trend === 'down' && <TrendingUp size={14} color="#ef4444" style={{ transform: 'scaleY(-1)' }} />}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{u.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--mute)' }}>{u.role}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {u.badges.map(b => {
                      const info = BADGE_INFO[b];
                      if (!info) return null;
                      return (
                        <div key={b} title={info.label} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: info.bg, color: info.color }}>
                          {info.icon}
                        </div>
                      )
                    })}
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--charcoal)', fontVariantNumeric: 'tabular-nums' }}>
                  {u.rows.toLocaleString()}
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: u.rank <= 3 ? '#fefce8' : 'var(--surface-bone)', color: u.rank <= 3 ? '#854d0e' : 'var(--ink)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    <Flame size={14} color={u.rank <= 3 ? "#eab308" : "var(--mute)"} />
                    {u.score.toLocaleString()}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--mute)' }}>
                  <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'inline-block' }} />
                  <div>No contributors found matching your search.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .table-row-hover:hover { background: #f8fafc; cursor: pointer; }
      `}</style>
    </div>
  );
}
