import React from 'react';
import { Trophy, Star, ShieldCheck } from 'lucide-react';

const leaders = [
  { name: "Nguyen Van An", district: "District 12", points: 1240, badge: 'HERO' },
  { name: "Tran Thi Binh", district: "Hoc Mon", points: 1095, badge: 'SUPPORT' },
  { name: "Le Minh Chau", district: "Thu Duc", points: 980, badge: 'VOLUNTEER' },
  { name: "Hoang Minh Tuan", district: "Binh Thanh", points: 910, badge: 'REPORTER' },
  { name: "Nguyen Thi Lan", district: "District 7", points: 870, badge: 'COMMUNITY' },
];

const policyItems = [
  { label: "New report", value: "+5 points" },
  { label: "The report is authenticated", value: "+12 points" },
  { label: "Rescue support", value: "+20 points" },
  { label: "Repair support", value: "+8 points" },
  { label: "Wrong report", value: "-15 points" },
];

export default function GuestLeaderboard() {
  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Honor board & Bonus points policy</h1>
        <p>Honor community contributions and transparent point accumulation mechanism</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={14} color="var(--gold-400)" />
            <div className="section-title">Hall of Fame</div>
          </div>
          <div style={{ display: 'grid', gap: 10, padding: '12px 16px 16px' }}>
            {leaders.map((leader, index) => (
              <div key={leader.name} className="card" style={{ padding: '14px 16px', borderLeft: index === 0 ? '3px solid var(--gold-400)' : '3px solid var(--border-default)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{leader.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{leader.district}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: 'var(--gold-400)' }}>{leader.points}</div>
                    <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{leader.badge}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="section-title" style={{ marginBottom: 12 }}>Bonus points policy</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {policyItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between" style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'rgba(61,125,176,0.08)', border: '1px solid var(--border-dim)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="alert-banner info" style={{ marginTop: 12 }}>
            <ShieldCheck size={16} color="var(--green-400)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Points will be updated periodically and displayed when you log in.
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="section-title" style={{ marginBottom: 12 }}>How to accumulate points</div>
        <div className="grid grid-3">
          {[
            { title: "Report accurately", desc: "Submit a report with photos and clear location.", icon: Star },
            { title: "Community support", desc: "Participate in feedback or share safety experiences.", icon: ShieldCheck },
            { title: "Volunteer rescue", desc: "Support according to system coordination.", icon: Trophy },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: 'rgba(18,29,40,0.7)' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                  <Icon size={14} color="var(--cyan-400)" />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{card.title}</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{card.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
