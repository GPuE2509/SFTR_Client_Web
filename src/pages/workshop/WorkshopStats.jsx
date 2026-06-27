import React, { useState } from 'react';
import {
  BarChart2, TrendingUp, Award, Star, Users,
  Wrench, Clock, Download, Trophy, CheckCircle,
} from 'lucide-react';
import { FloodTrendChart } from '../../components/charts/Charts';

const weeklyData = [
  { day: 'T2', tasks: 8, revenue: 1250000, rating: 4.8 },
  { day: 'T3', tasks: 11, revenue: 1680000, rating: 5.0 },
  { day: 'T4', tasks: 6, revenue: 920000, rating: 4.5 },
  { day: 'T5', tasks: 14, revenue: 2100000, rating: 4.9 },
  { day: 'T6', tasks: 12, revenue: 1870000, rating: 4.7 },
  { day: 'T7', tasks: 18, revenue: 2750000, rating: 4.8 },
  { day: 'CN', tasks: 9, revenue: 1350000, rating: 4.6 },
];

const monthlyComparison = [
  { month: 'T3', tasks: 156, revenue: 24500000 },
  { month: 'T4', tasks: 178, revenue: 27800000 },
  { month: 'T5', tasks: 245, revenue: 38500000 },
];

const mechanicStats = [
  { name: "Workshop Staff Hung", tasks: 389, rating: 4.9, revenue: 14500000, rank: 1 },
  { name: "Workshop Staff Tuan", tasks: 245, rating: 4.8, revenue: 9200000, rank: 2 },
  { name: "Workshop Staff Long", tasks: 98, rating: 4.5, revenue: 3700000, rank: 3 },
];

const pointsHistory = [
  { action: "Complete form WO-045", points: 20, date: '31/05/2026', type: 'task' },
  { action: "Support for flooded vehicles during flood season x3", points: 45, date: '31/05/2026', type: 'bonus' },
  { action: "Rated 5★ from 10 guests", points: 50, date: '30/05/2026', type: 'rating' },
  { action: "Join the community forum", points: 5, date: '29/05/2026', type: 'forum' },
  { action: "Reached the milestone of 200 successful applications", points: 100, date: '28/05/2026', type: 'milestone' },
];

const ptColors = { task: 'var(--green-400)', bonus: '#f59e0b', rating: 'var(--gold-400)', forum: 'var(--cyan-400)', milestone: 'var(--orange-400)' };
const ptLabels = { task: "Order", bonus: "Bonus", rating: "Evaluate", forum: "Forum", milestone: "Landmark" };

const totalPoints = pointsHistory.reduce((s, p) => s + p.points, 0);

export default function WorkshopStats() {
  const [activeTab, setActiveTab] = useState('performance');

  const totalRevenue = weeklyData.reduce((s, d) => s + d.revenue, 0);
  const totalTasks = weeklyData.reduce((s, d) => s + d.tasks, 0);
  const avgRating = (weeklyData.reduce((s, d) => s + d.rating, 0) / weeklyData.length).toFixed(1);
  const maxTasks = Math.max(...weeklyData.map(d => d.tasks));

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Contribution Statistics & Performance</h1>
            <p>Detailed reports on orders, revenue, contribution points and Workshop Staff performance</p>
          </div>
          <button className="btn btn-ghost btn-sm">
            <Download size={14} /> Export report
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Application this week", value: totalTasks, color: '#f59e0b', icon: Wrench },
          { label: "Weekly revenue", value: `${(totalRevenue / 1000000).toFixed(1)}M`, color: 'var(--green-400)', icon: TrendingUp, isText: true },
          { label: "TB Review", value: avgRating + '★', color: 'var(--gold-400)', icon: Star, isText: true },
          { label: "Accumulated points", value: totalPoints + 220, color: 'var(--orange-400)', icon: Award },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5 flex items-center gap-4">
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: s.isText ? '1.2rem' : '1.6rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 560 }}>
        <button className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
          <BarChart2 size={13} /> Efficiency
        </button>
        <button className={`tab-btn ${activeTab === 'mechanics' ? 'active' : ''}`} onClick={() => setActiveTab('mechanics')}>
          <Users size={13} /> Excellent worker
        </button>
        <button className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`} onClick={() => setActiveTab('points')}>
          <Trophy size={13} /> Contribution points
        </button>
      </div>

      {/* Tab: Performance */}
      {activeTab === 'performance' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Daily bar chart */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 20 }}>Orders by day of the week</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, alignItems: 'flex-end', height: 160 }}>
              {weeklyData.map((d) => {
                const pct = (d.tasks / maxTasks) * 100;
                return (
                  <div key={d.day} style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>{d.tasks}</div>
                    <div style={{
                      width: '100%', height: `${pct}%`,
                      background: 'linear-gradient(to top, rgba(217,119,6,0.9), rgba(245,158,11,0.5))',
                      borderRadius: '4px 4px 0 0',
                      boxShadow: '0 0 8px rgba(245,158,11,0.4)',
                      minHeight: 4, transition: 'height 0.5s ease',
                    }} />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{d.day}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginTop: 2 }}>
                      {(d.revenue / 1000000).toFixed(1)}M
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly comparison + Flood trend */}
          <div className="grid grid-2">
            <div className="card p-6">
              <div className="section-title" style={{ marginBottom: 14 }}>Month comparison (March–May 2026)</div>
              <div style={{ display: 'grid', gap: 14 }}>
                {monthlyComparison.map((m, i) => (
                  <div key={m.month}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Month {m.month}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b', fontSize: '0.88rem' }}>{m.tasks} single</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(m.revenue / 1000000).toFixed(1)}M d</div>
                      </div>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(m.tasks / 260) * 100}%`, background: i === 2 ? '#f59e0b' : 'rgba(245,158,11,0.4)', borderRadius: 99, boxShadow: i === 2 ? '0 0 8px rgba(245,158,11,0.5)' : 'none' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="section-title" style={{ marginBottom: 16 }}>Water level & car repair needs</div>
              <FloodTrendChart />
            </div>
          </div>

          {/* Service breakdown */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Distribution by type of service</div>
            <div className="grid grid-3" style={{ gap: 12 }}>
              {[
                { service: "Car flooded", count: 89, pct: 36, color: '#f59e0b' },
                { service: "Towing mobile vehicles", count: 52, pct: 21, color: 'var(--cyan-400)' },
                { service: "Replace tire", count: 47, pct: 19, color: 'var(--green-400)' },
                { service: "Electricity & Batteries", count: 35, pct: 14, color: 'var(--blue-400)' },
                { service: "Maintenance", count: 22, pct: 9, color: 'var(--orange-400)' },
                { service: "Other", count: 0, pct: 1, color: 'var(--text-muted)' },
              ].map(s => (
                <div key={s.service} style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: 'rgba(61,125,176,0.04)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 6 }}>{s.service}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: s.color, fontSize: '1.2rem', marginBottom: 4 }}>{s.count}</div>
                  <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{s.pct}% of total orders</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Mechanics */}
      {activeTab === 'mechanics' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={14} color="#f59e0b" />
              <div className="section-title">Outstanding Workshop Staff in May 2026</div>
            </div>
            {mechanicStats.map((m, i) => (
              <div key={m.name} style={{ padding: '16px 20px', borderBottom: i < mechanicStats.length - 1 ? '1px solid var(--border-dim)' : 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: m.rank === 1 ? 'rgba(234,179,8,0.12)' : 'rgba(61,125,176,0.08)',
                  border: m.rank === 1 ? '1px solid rgba(234,179,8,0.3)' : '1px solid var(--border-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: m.rank <= 3 ? '1.2rem' : '0.85rem', fontWeight: 800,
                  color: m.rank === 1 ? '#f59e0b' : 'var(--text-muted)',
                }}>
                  {m.rank === 1 ? '🥇' : m.rank === 2 ? '🥈' : '🥉'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.tasks} single · {m.rating}★ reviews</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f59e0b', fontSize: '1rem' }}>
                    {(m.revenue / 1000000).toFixed(1)}M d
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>doanh thu</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mechanic individual bar chart */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16 }}>Number of completed orders by Workshop Staff</div>
            <div style={{ display: 'grid', gap: 14 }}>
              {mechanicStats.map(m => {
                const pct = (m.tasks / mechanicStats[0].tasks) * 100;
                return (
                  <div key={m.name}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{m.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b' }}>{m.tasks} single</span>
                    </div>
                    <div style={{ height: 10, background: 'var(--bg-elevated)', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, #d97706, #f59e0b)`, borderRadius: 99, boxShadow: '0 0 8px rgba(245,158,11,0.4)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Points */}
      {activeTab === 'points' && (
        <div className="grid grid-2" style={{ gap: 16 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="section-title">Contribution point history</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f59e0b' }}>{totalPoints + 220} pts</div>
            </div>
            {pointsHistory.map((p, i) => (
              <div key={i} style={{ padding: '12px 18px', borderBottom: i < pointsHistory.length - 1 ? '1px solid var(--border-dim)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ptColors[p.type], boxShadow: `0 0 6px ${ptColors[p.type]}`, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 500 }}>{p.action}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      <span className="badge" style={{ fontSize: '0.58rem', background: `${ptColors[p.type]}18`, color: ptColors[p.type], border: 'none', marginRight: 5 }}>{ptLabels[p.type]}</span>
                      {p.date}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--green-400)', fontSize: '0.95rem', flexShrink: 0 }}>+{p.points}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <div className="card p-6">
              <div className="section-title" style={{ marginBottom: 14 }}>Points policy for the Workshop</div>
              {[
                { action: "Complete the vehicle repair form", points: '+15–25', color: 'var(--green-400)' },
                { action: "Support for flooded vehicles during flood season", points: "+15/order", color: '#f59e0b' },
                { action: "Rated 5★", points: '+10', color: 'var(--gold-400)' },
                { action: "Night mobile service", points: '+50% bonus', color: 'var(--blue-400)' },
                { action: "Post technical sharing articles", points: '+5', color: 'var(--cyan-400)' },
                { action: "Cancellation without reason", points: '-20', color: 'var(--text-muted)' },
              ].map(s => (
                <div key={s.action} className="flex items-center justify-between" style={{ padding: '8px 12px', marginBottom: 6, borderRadius: 'var(--r-sm)', border: '1px solid var(--border-dim)', background: 'rgba(61,125,176,0.04)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.action}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: s.color, fontSize: '0.85rem' }}>{s.points}</span>
                </div>
              ))}
            </div>

            <div className="card p-6">
              <div className="section-title" style={{ marginBottom: 12 }}>Next milestone</div>
              {[
                { label: "Gold level destination (1000 points)", current: 720, max: 1000, color: '#f59e0b' },
                { label: "Application to Elite Workshop (500 applications)", current: 350, max: 500, color: 'var(--cyan-400)' },
              ].map(bar => {
                const pct = Math.round((bar.current / bar.max) * 100);
                return (
                  <div key={bar.label} style={{ marginBottom: 14 }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{bar.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: bar.color, fontSize: '0.82rem' }}>{bar.current}/{bar.max}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${bar.color}, ${bar.color}88)`, borderRadius: 99, boxShadow: `0 0 6px ${bar.color}44` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
