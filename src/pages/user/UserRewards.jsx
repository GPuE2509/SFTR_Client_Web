import React, { useState } from 'react';
import { Trophy, ShieldCheck, TrendingUp, Star, Medal, Clock, Camera, MessageSquare, LifeBuoy, Zap, Gift, ChevronRight } from 'lucide-react';

const leaders = [
  { rank: 1, name: "Nguyen Van An", district: "District 12", points: 1240, badge: 'HERO' },
  { rank: 2, name: "Tran Thi Binh", district: "Hoc Mon", points: 1095, badge: 'SUPPORT' },
  { rank: 3, name: "Le Minh Chau", district: "Thu Duc", points: 980, badge: 'VOLUNTEER' },
  { rank: 4, name: "Hoang Minh Tuan", district: "Binh Thanh", points: 910, badge: 'REPORTER' },
  { rank: 5, name: "Nguyen Thi Lan", district: "District 7", points: 870, badge: 'COMMUNITY' },
];

const policyItems = [
  { label: "Submit new report", value: "+5 points", icon: Camera, color: 'var(--cyan-400)' },
  { label: "The report is authenticated", value: "+12 points", icon: ShieldCheck, color: 'var(--green-400)' },
  { label: "SOS rescue support", value: "+20 points", icon: LifeBuoy, color: 'var(--orange-400)' },
  { label: "Successful car repair support", value: "+8 points", icon: Zap, color: 'var(--cyan-400)' },
  { label: "Comments authenticate the community", value: "+2 points", icon: MessageSquare, color: 'var(--blue-400)' },
  { label: "Report errors/violations", value: "-15 points", icon: ShieldCheck, color: 'var(--red-400)' },
];

// Mock auto-received point history
const pointHistory = [
  { id: 'h1', time: '31/05/2026 · 14:32', event: "Submit a flood report in District 12", points: +5, type: 'report', icon: Camera, color: 'var(--cyan-400)' },
  { id: 'h2', time: '30/05/2026 · 09:15', event: "The Hoc Mon flooding report was verified by the community", points: +12, type: 'verified', icon: ShieldCheck, color: 'var(--green-400)' },
  { id: 'h3', time: '29/05/2026 · 18:47', event: "Confirmed flooding response on the forum", points: +2, type: 'community', icon: MessageSquare, color: 'var(--blue-400)' },
  { id: 'h4', time: '28/05/2026 · 11:20', event: "Emergency car repair support for users in Binh Thanh", points: +8, type: 'repair', icon: Zap, color: 'var(--cyan-400)' },
  { id: 'h5', time: '27/05/2026 · 16:05', event: "Submit a photo report of flooding in Thu Duc", points: +5, type: 'report', icon: Camera, color: 'var(--cyan-400)' },
  { id: 'h6', time: '26/05/2026 · 08:30', event: "Authentic reports voted on by the community", points: +12, type: 'verified', icon: ShieldCheck, color: 'var(--green-400)' },
  { id: 'h7', time: '25/05/2026 · 20:12', event: "Support SOS emergency rescue in heavily flooded areas", points: +20, type: 'sos', icon: LifeBuoy, color: 'var(--orange-400)' },
];

const myRank = 12;
const myPoints = 860;
const nextLevelPoints = 1000;

export default function UserRewards() {
  const [activeTab, setActiveTab] = useState('leaderboard');

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Reward Points & Honor Board</h1>
        <p>Track contribution points, point receiving history and point accumulation policy</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Current score", value: myPoints.toLocaleString(), icon: Star, color: 'var(--gold-400)' },
          { label: "Community-wide ranking", value: `#${myRank}`, icon: Trophy, color: 'var(--cyan-400)' },
          { label: "The report is authenticated", value: '24', icon: ShieldCheck, color: 'var(--green-400)' },
          { label: "Growth this month", value: '+12%', icon: TrendingUp, color: 'var(--orange-400)' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5 flex items-center gap-4">
              <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Level progress bar */}
      <div className="card p-5" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Gift size={15} color="var(--gold-400)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Progress to the next level</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {myPoints} / {nextLevelPoints} point
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(myPoints / nextLevelPoints) * 100}%`, background: 'linear-gradient(90deg, var(--cyan-400), var(--gold-400))', borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Need more <strong style={{ color: 'var(--gold-400)' }}>{nextLevelPoints - myPoints} point</strong> to gain levels <strong style={{ color: 'var(--gold-400)' }}>Silver Medal</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 560 }}>
        <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          <Trophy size={13} /> Honor board
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <Clock size={13} /> Point accumulation history
        </button>
        <button className={`tab-btn ${activeTab === 'policy' ? 'active' : ''}`} onClick={() => setActiveTab('policy')}>
          <ShieldCheck size={13} /> Policies & Rewards
        </button>
      </div>

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '12px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={14} color="var(--gold-400)" />
            <div className="section-title">Hall of Fame – Top community contributions</div>
          </div>
          <div style={{ display: 'grid', gap: 0 }}>
            {leaders.map((leader, index) => {
              const rankColors = ['var(--gold-400)', '#C0C0C0', '#CD7F32'];
              const rankColor = rankColors[index] || 'var(--border-default)';
              return (
                <div key={leader.name} style={{
                  padding: '14px 20px',
                  borderBottom: index < leaders.length - 1 ? '1px solid var(--border-dim)' : 'none',
                  background: index === 0 ? 'rgba(212,175,55,0.04)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.2s'
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${rankColor}22`, border: `2px solid ${rankColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: rankColor, fontFamily: 'var(--font-mono)' }}>{leader.rank}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{leader.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leader.district}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: rankColor }}>{leader.points.toLocaleString()}</div>
                    <span className="badge badge-gold" style={{ fontSize: '0.6rem' }}>{leader.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* My position highlight */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(6,182,212,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(6,182,212,0.15)', border: '2px solid var(--cyan-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)' }}>{myRank}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cyan-400)' }}>You (My Location)</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>District 12</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: 'var(--cyan-400)' }}>{myPoints}</div>
              <span className="badge badge-cyan" style={{ fontSize: '0.6rem' }}>MY POSITION</span>
            </div>
          </div>
        </div>
      )}

      {/* Point history (auto-earned) */}
      {activeTab === 'history' && (
        <div>
          <div className="alert-banner info" style={{ marginBottom: 16 }}>
            <Zap size={14} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Points are automatically added after each contribution of a warning image, incident verification or community rescue support.
            </span>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="section-title">History of receiving contribution points</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Automatically updated</span>
            </div>
            <div style={{ display: 'grid', gap: 0 }}>
              {pointHistory.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} style={{
                    padding: '14px 20px',
                    borderBottom: index < pointHistory.length - 1 ? '1px solid var(--border-dim)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.2s'
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${item.color}18`, border: `1px solid ${item.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} color={item.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 2 }}>{item.event}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={10} /> {item.time}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: item.points > 0 ? 'var(--green-400)' : 'var(--red-400)', flexShrink: 0 }}>
                      {item.points > 0 ? `+${item.points}` : item.points}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Policy */}
      {activeTab === 'policy' && (
        <div className="grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={14} color="var(--green-400)" />
              <div className="section-title">Table of points accumulation rules</div>
            </div>
            <div style={{ display: 'grid', gap: 0 }}>
              {policyItems.map((item, index) => {
                const Icon = item.icon;
                const isPositive = !item.value.startsWith('-');
                return (
                  <div key={item.label} style={{
                    padding: '12px 20px',
                    borderBottom: index < policyItems.length - 1 ? '1px solid var(--border-dim)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <Icon size={14} color={item.color} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isPositive ? 'var(--green-400)' : 'var(--red-400)' }}>{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>How to accumulate points quickly</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { title: "Report accurately", desc: "Submit a report with photos and clear location for priority review.", icon: Camera },
                { title: "Community support", desc: "Participate in feedback and safety guidance on the forum.", icon: MessageSquare },
                { title: "Join the rescue", desc: "Respond quickly to SOS requests in your area.", icon: LifeBuoy },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: 'rgba(18,29,40,0.7)', display: 'flex', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} color="var(--cyan-400)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{card.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{card.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="alert-banner info" style={{ marginTop: 14 }}>
              <ShieldCheck size={14} color="var(--green-400)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Points will automatically update after each valid contribution.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
