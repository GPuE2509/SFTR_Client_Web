import React, { useState } from 'react';
import { Trophy, Star, Gift, Save, Plus, Trash2, ArrowUpRight, ArrowDownRight, UserPlus } from 'lucide-react';

const leaderboardSeed = [
  { rank: 1, name: 'Nguyen Van An', district: 'Quan 12', points: 1240, badge: 'HERO' },
  { rank: 2, name: 'Tran Thi Binh', district: 'Hoc Mon', points: 1095, badge: 'SUPPORT' },
  { rank: 3, name: 'Le Minh Chau', district: 'Thu Duc', points: 980, badge: 'VOLUNTEER' },
  { rank: 4, name: 'Hoang Minh Tuan', district: 'Binh Thanh', points: 910, badge: 'REPORTER' },
  { rank: 5, name: 'Nguyen Thi Lan', district: 'Quan 7', points: 870, badge: 'COMMUNITY' },
];

const rewardSeed = [
  { id: 'rw-01', name: '50k repair voucher', points: 120, badge: 'BRONZE' },
  { id: 'rw-02', name: 'Free rescue support package', points: 250, badge: 'SILVER' },
  { id: 'rw-03', name: 'Community event ticket', points: 400, badge: 'GOLD' },
];

const policySeed = {
  reportSubmit: 5,
  reportVerified: 12,
  volunteerAssist: 20,
  workshopAssist: 8,
  falseReportPenalty: -15,
};

function PolicySlider({ label, value, min, max, unit, color, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color, fontSize: '1rem' }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, var(--bg-elevated) ${pct}%, var(--bg-elevated) 100%)`,
        }}
      />
      <div className="flex justify-between" style={{ marginTop: 4 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{min}{unit}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function PointsManagement() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [policy, setPolicy] = useState(policySeed);
  const [rewards, setRewards] = useState(rewardSeed);
  const [newReward, setNewReward] = useState({ name: '', points: '', badge: '' });
  const [adjust, setAdjust] = useState({ user: '', points: 0, reason: '' });
  const [saved, setSaved] = useState(false);

  const addReward = () => {
    if (!newReward.name || !newReward.points) return alert('Enter name and reward points');
    const id = `rw-${Date.now()}`;
    setRewards(prev => [{ id, ...newReward, points: Number(newReward.points) }, ...prev]);
    setNewReward({ name: '', points: '', badge: '' });
  };

  const removeReward = (id) => setRewards(prev => prev.filter(r => r.id !== id));

  const savePolicy = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyAdjust = () => {
    if (!adjust.user || !adjust.points) return alert('Enter name and points');
    alert(`Updated ${adjust.points} points for ${adjust.user} (mock)`);
    setAdjust({ user: '', points: 0, reason: '' });
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Points Management & Leaderboard</h1>
        <p>Leaderboard, points policy and rewards (FE-only)</p>
      </div>

      <div className="tabs-nav" style={{ marginBottom: 16, maxWidth: 720 }}>
        <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          <Trophy size={13} /> Leaderboard
        </button>
        <button className={`tab-btn ${activeTab === 'policy' ? 'active' : ''}`} onClick={() => setActiveTab('policy')}>
          <Star size={13} /> Points policy
        </button>
        <button className={`tab-btn ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}>
          <Gift size={13} /> Rewards
        </button>
      </div>

      {activeTab === 'leaderboard' && (
        <div className="card table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Area</th>
                <th>Points</th>
                <th>Badge</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardSeed.map(row => (
                <tr key={row.rank}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>#{row.rank}</td>
                  <td style={{ fontWeight: 700 }}>{row.name}</td>
                  <td>{row.district}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)', fontWeight: 700 }}>{row.points}</td>
                  <td><span className="badge badge-cyan">{row.badge}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'policy' && (
        <div className="grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16 }}>Points addition policy</div>
            <PolicySlider label="New report" value={policy.reportSubmit} min={1} max={15} unit=" pts" color="var(--blue-400)" onChange={(v) => setPolicy(prev => ({ ...prev, reportSubmit: v }))} />
            <PolicySlider label="Verified report" value={policy.reportVerified} min={5} max={25} unit=" pts" color="var(--green-400)" onChange={(v) => setPolicy(prev => ({ ...prev, reportVerified: v }))} />
            <PolicySlider label="Rescue support" value={policy.volunteerAssist} min={5} max={40} unit=" pts" color="var(--orange-400)" onChange={(v) => setPolicy(prev => ({ ...prev, volunteerAssist: v }))} />
            <PolicySlider label="Workshop support" value={policy.workshopAssist} min={5} max={20} unit=" pts" color="var(--cyan-400)" onChange={(v) => setPolicy(prev => ({ ...prev, workshopAssist: v }))} />
            <PolicySlider label="False report penalty" value={policy.falseReportPenalty} min={-30} max={-5} unit=" pts" color="var(--red-400)" onChange={(v) => setPolicy(prev => ({ ...prev, falseReportPenalty: v }))} />

            <button className="btn btn-primary" onClick={savePolicy}><Save size={14} /> Save policy</button>
            {saved && <div style={{ marginTop: 8, color: 'var(--green-400)', fontWeight: 600 }}>Saved successfully</div>}
          </div>

          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16 }}>Manual point adjustment</div>
            <div className="input-group">
              <UserPlus size={14} className="input-icon" />
              <input className="input" placeholder="User" value={adjust.user} onChange={(e) => setAdjust(prev => ({ ...prev, user: e.target.value }))} />
            </div>
            <div className="input-group" style={{ marginTop: 10 }}>
              {adjust.points >= 0 ? <ArrowUpRight size={14} className="input-icon" /> : <ArrowDownRight size={14} className="input-icon" />}
              <input className="input" type="number" placeholder="Points (+/-)" value={adjust.points} onChange={(e) => setAdjust(prev => ({ ...prev, points: Number(e.target.value) }))} />
            </div>
            <textarea className="input" rows={3} style={{ marginTop: 10 }} placeholder="Reason" value={adjust.reason} onChange={(e) => setAdjust(prev => ({ ...prev, reason: e.target.value }))} />
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={applyAdjust}>Update points</button>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
          <div className="card table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rewards</th>
                  <th>Points</th>
                  <th>Badge</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)', fontWeight: 700 }}>{r.points}</td>
                    <td>{r.badge ? <span className="badge badge-cyan">{r.badge}</span> : '-'}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => removeReward(r.id)}><Trash2 size={12} /> Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 12 }}>Add reward</div>
            <input className="input" placeholder="Reward name" value={newReward.name} onChange={(e) => setNewReward(prev => ({ ...prev, name: e.target.value }))} />
            <input className="input" type="number" placeholder="Diem" style={{ marginTop: 8 }} value={newReward.points} onChange={(e) => setNewReward(prev => ({ ...prev, points: e.target.value }))} />
            <input className="input" placeholder="Badge (optional)" style={{ marginTop: 8 }} value={newReward.badge} onChange={(e) => setNewReward(prev => ({ ...prev, badge: e.target.value }))} />
            <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={addReward}><Plus size={12} /> Add reward</button>
          </div>
        </div>
      )}
    </div>
  );
}
