import React, { useState } from 'react';
import {
  Trophy, Star, TrendingUp, Award, Heart,
  CheckCircle, Clock, Gift, Shield,
} from 'lucide-react';
import { FloodTrendChart } from '../../components/charts/Charts';

const rewardHistory = [
  { id: 'RWD-001', action: "Complete SOS mission #RES-047", points: 40, date: '31/05/2026', type: 'mission' },
  { id: 'RWD-002', action: "Complete SOS mission #RES-043", points: 30, date: '31/05/2026', type: 'mission' },
  { id: 'RWD-003', action: "Rated 5 stars – victim Le Minh Chau", points: 10, date: '30/05/2026', type: 'rating' },
  { id: 'RWD-004', action: "Complete 50 missions – Golden milestone", points: 200, date: '28/05/2026', type: 'milestone' },
  { id: 'RWD-005', action: "Join the rescue forum – new post", points: 5, date: '27/05/2026', type: 'forum' },
  { id: 'RWD-006', action: "Late night rescue support (+50% bonus)", points: 60, date: '25/05/2026', type: 'bonus' },
  { id: 'RWD-007', action: "Penalty – Cancel mission without reason", points: -20, date: '22/05/2026', type: 'penalty' },
];

const leaderboard = [
  { rank: 1, name: "Tran Hung Dung", missions: 127, points: 4850, badge: '🥇' },
  { rank: 2, name: "Le Thi Phuong", missions: 98, points: 3720, badge: '🥈' },
  { rank: 3, name: "Nguyen Hung Cuong", missions: 52, points: 2340, badge: '🥉', isMe: true },
  { rank: 4, name: "Pham Thanh Long", missions: 45, points: 1980, badge: '4' },
  { rank: 5, name: "Hoang Minh Tuan", missions: 38, points: 1620, badge: '5' },
  { rank: 6, name: "Dinh Van An", missions: 31, points: 1350, badge: '6' },
  { rank: 7, name: "Bui Thi Cuc", missions: 27, points: 1120, badge: '7' },
];

const badges = [
  { icon: '🦺', name: "First rescuer", desc: "Complete the first mission", earned: true },
  { icon: '💪', name: "Storm warrior", desc: "10 successful missions", earned: true },
  { icon: '⚡', name: "Quick response", desc: "ETA < 10 minutes 5 times in a row", earned: true },
  { icon: '🌟', name: "Outstanding volunteer of the month", desc: "Top 3 of the month", earned: true },
  { icon: '🏆', name: "Rescue legend", desc: "100 successful missions", earned: false },
  { icon: '❤️', name: "Community protector", desc: "Saved > 200 people", earned: false },
];

const rewardPolicy = [
  { action: "Complete the SOS mission", points: '+30–50', color: 'var(--red-400)' },
  { action: "Complete the flood mission", points: '+20–35', color: 'var(--orange-400)' },
  { action: "Rated 5 stars", points: '+10', color: 'var(--gold-400)' },
  { action: "Join the rescue forum", points: '+5', color: 'var(--cyan-400)' },
  { action: "Bonus late night mission", points: '+50%', color: 'var(--blue-400)' },
  { action: "Cancel mission without reason", points: '-20', color: 'var(--text-muted)' },
];

const myStats = {
  totalPoints: 2340,
  weekPoints: 380,
  monthPoints: 1140,
  rank: 3,
  totalMissions: 52,
  avgRating: 4.8,
};

export default function VolunteerRewards() {
  const [activeTab, setActiveTab] = useState('overview');

  const typeColor = {
    mission: 'var(--green-400)',
    rating: 'var(--gold-400)',
    milestone: 'var(--cyan-400)',
    bonus: 'var(--orange-400)',
    forum: 'var(--blue-400)',
    penalty: 'var(--red-400)',
  };

  const typeLabel = {
    mission: "Mission",
    rating: "Evaluate",
    milestone: "Landmark",
    bonus: "Extra bonus",
    forum: "Forum",
    penalty: "Punish",
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Contribution Points & Rewards</h1>
        <p>Track accumulated points, rankings and volunteer badges</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Total accumulated points", value: myStats.totalPoints, color: 'var(--gold-400)', icon: Trophy },
          { label: "Score this week", value: `+${myStats.weekPoints}`, color: 'var(--orange-400)', icon: TrendingUp, isText: true },
          { label: "Volunteer rating", value: `#${myStats.rank}`, color: 'var(--cyan-400)', icon: Award, isText: true },
          { label: "Average rating", value: `${myStats.avgRating}★`, color: 'var(--gold-400)', icon: Star, isText: true },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5 flex items-center gap-4">
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: `rgba(${s.color === 'var(--gold-400)' ? '234,179,8' : '69,179,192'},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: s.isText ? '1.2rem' : '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 540 }}>
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <TrendingUp size={13} /> Overview
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <Clock size={13} /> Point history
        </button>
        <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          <Trophy size={13} /> Rankings
        </button>
        <button className={`tab-btn ${activeTab === 'policy' ? 'active' : ''}`} onClick={() => setActiveTab('policy')}>
          <Shield size={13} /> Points policy
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Progress to next badge */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16 }}>Milestone progress</div>
            {[
              { label: "Gold level destination (3000 points)", current: 2340, max: 3000, color: 'var(--gold-400)' },
              { label: "Quest to Legend (100)", current: 52, max: 100, color: 'var(--cyan-400)' },
              { label: "Monthly Points (target 1500)", current: 1140, max: 1500, color: 'var(--orange-400)' },
            ].map(bar => {
              const pct = Math.min((bar.current / bar.max) * 100, 100);
              return (
                <div key={bar.label} style={{ marginBottom: 16 }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{bar.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: bar.color, fontSize: '0.85rem' }}>
                      {bar.current}/{bar.max}
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${bar.color}, ${bar.color}88)`, borderRadius: 99, boxShadow: `0 0 8px ${bar.color}44`, transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Badges */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Badge ({badges.filter(b => b.earned).length}/{badges.length})</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {badges.map((badge) => (
                <div key={badge.name} style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--r-md)',
                  border: badge.earned ? '1px solid rgba(234,179,8,0.3)' : '1px solid var(--border-dim)',
                  background: badge.earned ? 'rgba(234,179,8,0.06)' : 'rgba(61,125,176,0.03)',
                  opacity: badge.earned ? 1 : 0.5,
                }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{badge.icon}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: badge.earned ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: 2 }}>{badge.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{badge.desc}</div>
                  {badge.earned && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--gold-400)', marginTop: 4, fontWeight: 700 }}>✓ Achieved</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Points Trend Chart */}
          <div className="card p-6" style={{ gridColumn: '1 / -1' }}>
            <div className="section-title" style={{ marginBottom: 16 }}>Cumulative score trend (latest 12 hours)</div>
            <FloodTrendChart />
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title">Point history</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold-400)', fontSize: '1rem' }}>
              Total: {myStats.totalPoints.toLocaleString('vi-VN')} point
            </div>
          </div>
          {rewardHistory.map((item, i) => (
            <div key={item.id} style={{
              padding: '12px 18px',
              borderBottom: i < rewardHistory.length - 1 ? '1px solid var(--border-dim)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div className="flex items-center gap-3" style={{ flex: 1 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor[item.type], flexShrink: 0, boxShadow: `0 0 6px ${typeColor[item.type]}` }} />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.action}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 6px', marginRight: 6, background: `${typeColor[item.type]}18`, color: typeColor[item.type], border: 'none' }}>{typeLabel[item.type]}</span>
                    {item.date}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: item.points > 0 ? 'var(--green-400)' : 'var(--red-400)', flexShrink: 0 }}>
                {item.points > 0 ? '+' : ''}{item.points}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="section-title">Volunteer rankings for May 2026</div>
          </div>
          {leaderboard.map((entry, i) => (
            <div key={entry.rank} style={{
              padding: '14px 18px',
              borderBottom: i < leaderboard.length - 1 ? '1px solid var(--border-dim)' : 'none',
              background: entry.isMe ? 'rgba(239,29,55,0.06)' : 'transparent',
              display: 'flex', alignItems: 'center', gap: 16,
              border: entry.isMe ? '1px solid rgba(239,29,55,0.15)' : undefined,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: entry.rank <= 3 ? 'rgba(234,179,8,0.12)' : 'rgba(61,125,176,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: entry.rank <= 3 ? '1.2rem' : '0.85rem',
                fontWeight: 800,
                color: entry.rank <= 3 ? 'var(--gold-400)' : 'var(--text-muted)',
                flexShrink: 0,
                border: entry.rank <= 3 ? '1px solid rgba(234,179,8,0.25)' : '1px solid var(--border-dim)',
              }}>
                {entry.badge}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: entry.isMe ? 'var(--red-400)' : 'var(--text-primary)' }}>
                  {entry.name} {entry.isMe && <span style={{ fontSize: '0.65rem', fontWeight: 400 }}>(Friend)</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {entry.missions} mission completed
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: entry.rank === 1 ? 'var(--gold-400)' : entry.rank === 2 ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                {entry.points.toLocaleString('vi-VN')} pts
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Policy */}
      {activeTab === 'policy' && (
        <div className="grid grid-2" style={{ gap: 16 }}>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Contribution transcript</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {rewardPolicy.map(p => (
                <div key={p.action} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border-dim)', background: 'rgba(61,125,176,0.04)',
                }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.action}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: p.color, fontSize: '0.9rem' }}>{p.points}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Rules & Notes</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                "Points are updated immediately after completing the task.",
                "Late night tasks (10pm–5pm) add 50% points.",
                "Canceling missions more than 3 times/week will be temporarily locked for 24 hours.",
                "Points at the end of the month can be converted into vouchers or material rewards.",
                "Top 3 volunteers each month receive certificates of merit and special rewards.",
                "Continuously negative scores will be considered for temporary suspension.",
              ].map((note, i) => (
                <div key={i} className="alert-banner info" style={{ margin: 0 }}>
                  <CheckCircle size={14} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
