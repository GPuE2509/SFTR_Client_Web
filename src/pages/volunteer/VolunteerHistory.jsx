import React, { useState } from 'react';
import {
  CheckCircle, Clock, MapPin, Filter,
  Star, FileText, Download, AlertTriangle,
} from 'lucide-react';

const missionHistory = [
  { id: 'RES-045', date: '31/05/2026', location: "Binh Thanh – No Trang Long", victim: "Hoang Minh Tuan", type: 'SOS', duration: "28 minutes", status: 'resolved', rating: 5, points: 40, note: "The victim was evacuated safely." },
  { id: 'RES-043', date: '31/05/2026', location: "District 7 – Le Van Luong", victim: "Nguyen Thi Lan", type: 'FLOOD', duration: "15 minutes", status: 'resolved', rating: 4, points: 30, note: "Support for moving people." },
  { id: 'RES-041', date: '30/05/2026', location: "Thu Duc – Go Dua intersection", victim: "Le Minh Chau", type: 'SOS', duration: "42 minutes", status: 'resolved', rating: 5, points: 45, note: "Successful rescue, medical handover." },
  { id: 'RES-039', date: '30/05/2026', location: "Go Vap – Nguyen Kiem", victim: "Pham Quoc Dung", type: 'SOS', duration: "20 minutes", status: 'resolved', rating: 4, points: 35, note: "Clear traffic jams and evacuate safely." },
  { id: 'RES-037', date: '29/05/2026', location: "Hoc Mon – Tran Thi He", victim: "Tran Van Hung", type: 'FLOOD', duration: "55 minutes", status: 'resolved', rating: 5, points: 50, note: "Supports a family of 5, with children." },
  { id: 'RES-035', date: '29/05/2026', location: "District 12 – Hiep Thanh", victim: "Dinh Thi Hoa", type: 'SOS', duration: "33 minutes", status: 'resolved', rating: 3, points: 25, note: "Delayed due to traffic jam." },
  { id: 'RES-033', date: '28/05/2026', location: "Binh Chanh – Kenh Doi", victim: "Bui Thi Cuc", type: 'FLOOD', duration: "18 minutes", status: 'resolved', rating: 5, points: 35, note: "Coordinate well with the fire department." },
];

const totalStats = {
  missions: missionHistory.length,
  points: missionHistory.reduce((s, m) => s + m.points, 0),
  avgRating: (missionHistory.reduce((s, m) => s + m.rating, 0) / missionHistory.length).toFixed(1),
  successRate: '97%',
};

export default function VolunteerHistory() {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filtered = missionHistory.filter(m => filter === 'all' || m.type === filter);

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>History of rescue missions</h1>
            <p>Look up, compile statistics and export reports on performed tasks</p>
          </div>
          <button className="btn btn-ghost btn-sm">
            <Download size={14} /> Export PDF reports
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Total mission",    value: totalStats.missions, color: 'var(--cyan-400)' },
          { label: "Total points earned", value: totalStats.points,    color: 'var(--orange-400)' },
          { label: "Average rating", value: totalStats.avgRating, color: 'var(--gold-400)', suffix: '★' },
          { label: "Success rate", value: totalStats.successRate, color: 'var(--green-400)', isText: true },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div style={{ fontSize: s.isText ? '1.5rem' : '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>
              {s.value}{s.suffix || ''}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Filter size={15} color="var(--text-muted)" />
        {[
          { key: 'all', label: "All" },
          { key: 'SOS', label: 'SOS' },
          { key: 'FLOOD', label: "Flooding" },
        ].map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arrange:</span>
          <select className="input" style={{ width: 140, padding: '4px 8px', fontSize: '0.8rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date">Latest date</option>
            <option value="points">Highest score</option>
            <option value="rating">Highest rating</option>
          </select>
        </div>
      </div>

      {/* Mission Table / List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={14} color="var(--text-muted)" />
          <div className="section-title">List {filtered.length} mission</div>
        </div>
        <div style={{ display: 'grid', gap: 0 }}>
          {filtered.map((m, i) => (
            <div
              key={m.id}
              style={{
                padding: '14px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border-dim)' : 'none',
                borderLeft: m.type === 'SOS' ? '3px solid var(--red-400)' : '3px solid var(--cyan-400)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.id}</span>
                    <span className={`badge ${m.type === 'SOS' ? 'badge-red' : 'badge-blue'}`} style={{ fontSize: '0.62rem' }}>{m.type}</span>
                    <span className="badge badge-green" style={{ fontSize: '0.62rem' }}><CheckCircle size={9} style={{ display: 'inline', marginRight: 2 }} />Complete</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.date}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                    <MapPin size={13} style={{ display: 'inline', marginRight: 4, color: 'var(--text-muted)' }} />
                    {m.location}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    Victim: {m.victim} · Time: {m.duration}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    "{m.note}"
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginBottom: 4 }}>
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} size={13} fill={star <= m.rating ? 'var(--gold-400)' : 'none'} color={star <= m.rating ? 'var(--gold-400)' : 'var(--border-default)'} />
                    ))}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--orange-400)', fontSize: '1rem' }}>
                    +{m.points} pts
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                    <Clock size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="card p-6" style={{ marginTop: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Weekly performance (May 2026)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, i) => {
            const heights = [60, 80, 40, 90, 75, 100, 30];
            const missions = [1, 2, 1, 3, 2, 4, 1];
            return (
              <div key={day} style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 60, marginBottom: 4 }}>
                  <div style={{
                    width: 24, borderRadius: 4,
                    height: `${heights[i]}%`,
                    background: `linear-gradient(to top, rgba(239,29,55,0.8), rgba(249,115,22,0.4))`,
                    boxShadow: '0 0 8px rgba(239,29,55,0.3)',
                    transition: 'height 0.3s ease',
                  }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{day}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--orange-400)', fontFamily: 'var(--font-mono)' }}>{missions[i]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--red-400)' }} />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Number of tasks per day</span>
        </div>
      </div>
    </div>
  );
}
