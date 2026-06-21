import { useState } from 'react';
import { Users, UserPlus, Shield, ShieldCheck, Mail, Trash2, Edit2, AlertTriangle, Key } from 'lucide-react';
import { useRole } from '../App';

const MOCK_MEMBERS = [
  { id: 1, name: "Admin User", email: "admin@hypasia.ai", role: "admin", joined: "2026-01-10" },
  { id: 2, name: "Data Engineer", email: "data@hypasia.ai", role: "annotator", joined: "2026-03-15" },
  { id: 3, name: "Guest Viewer", email: "guest@external.com", role: "viewer", joined: "2026-05-20" }
];

export default function TeamWorkspace() {
  const { currentRole, setRole } = useRole();
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    // Check RBAC
    if (currentRole === 'viewer') {
      alert("Permission Denied: Viewers cannot invite new team members.");
      return;
    }

    const newMember = {
      id: Date.now(),
      name: "Pending Invite",
      email: inviteEmail,
      role: inviteRole,
      joined: "Pending"
    };
    
    setMembers([...members, newMember]);
    setInviteEmail('');
  };

  const handleRemove = (id) => {
    if (currentRole !== 'admin') {
      alert("Permission Denied: Only Admins can remove team members.");
      return;
    }
    setMembers(members.filter(m => m.id !== id));
  };

  const handleTestRoleSwitch = (newRole) => {
    setRole(newRole);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <Users size={32} color="var(--primary)" />
        <h1 className="display-font" style={{ margin: 0, fontSize: '2.8rem', textAlign: 'center' }}>Team Workspace</h1>
      </div>
      <p style={{ color: 'var(--charcoal)', textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
        Manage access to your models and datasets. Assign roles to team members to restrict who can trigger expensive fine-tuning runs or delete data.
      </p>

      {/* Simulator Tools */}
      <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#854d0e', fontWeight: 600 }}>
          <Key size={18} /> Role Simulator (For Testing)
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => handleTestRoleSwitch('admin')} style={{ background: currentRole === 'admin' ? '#ca8a04' : '#fff', color: currentRole === 'admin' ? '#fff' : '#854d0e', border: '1px solid #ca8a04', padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Admin</button>
          <button onClick={() => handleTestRoleSwitch('annotator')} style={{ background: currentRole === 'annotator' ? '#ca8a04' : '#fff', color: currentRole === 'annotator' ? '#fff' : '#854d0e', border: '1px solid #ca8a04', padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Annotator</button>
          <button onClick={() => handleTestRoleSwitch('viewer')} style={{ background: currentRole === 'viewer' ? '#ca8a04' : '#fff', color: currentRole === 'viewer' ? '#fff' : '#854d0e', border: '1px solid #ca8a04', padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Viewer</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left: Invite Panel */}
        <div className="surface-card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} color="var(--primary)" /> Invite Member
          </h2>
          <form onSubmit={handleInvite}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>Email Address</label>
              <input 
                type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com" required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--hairline)' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>Role</label>
              <select 
                value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--hairline)', background: '#fff' }}
              >
                <option value="admin">Admin (Full Access)</option>
                <option value="annotator">Annotator (Can Edit Data)</option>
                <option value="viewer">Viewer (Read Only)</option>
              </select>
            </div>

            {currentRole === 'viewer' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: '8px', color: '#991b1b', marginBottom: '1rem', display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }}/>
                You do not have permission to invite members.
              </div>
            )}

            <button
              type="submit" disabled={currentRole === 'viewer' || !inviteEmail.trim()}
              style={{ width: '100%', padding: '0.75rem', background: currentRole === 'viewer' ? 'var(--surface-bone)' : 'var(--ink)', color: currentRole === 'viewer' ? 'var(--mute)' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: currentRole === 'viewer' ? 'not-allowed' : 'pointer' }}
            >
              Send Invitation
            </button>
          </form>
        </div>

        {/* Right: Members List */}
        <div className="surface-card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--hairline)' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--primary)" /> Active Team
            </h2>
          </div>
          <div style={{ padding: '1rem' }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {m.name}
                      {m.role === 'admin' && <span style={{ background: '#fefce8', color: '#ca8a04', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Admin</span>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={12}/> {m.email}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--mute)', textTransform: 'capitalize' }}>{m.role}</div>
                  <button 
                    onClick={() => handleRemove(m.id)}
                    disabled={currentRole !== 'admin'}
                    style={{ background: 'transparent', border: 'none', color: currentRole !== 'admin' ? 'var(--mute)' : '#dc2626', cursor: currentRole !== 'admin' ? 'not-allowed' : 'pointer', padding: '0.5rem' }}
                    title={currentRole === 'admin' ? "Remove User" : "Admins only"}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
