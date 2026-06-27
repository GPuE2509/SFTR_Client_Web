import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShieldAlert, Bell, MessageSquare,
  UserCheck, Trophy, ChevronLeft, ChevronRight,
  Waves, Heart, Map, ClipboardList,
} from 'lucide-react';

const navItems = [
  {
    section: "OVERVIEW",
    items: [
      { id: 'volunteer-dashboard', label: "Control panel", icon: LayoutDashboard, badge: null },
    ],
  },
  {
    section: "RESCUE",
    items: [
      { id: 'volunteer-missions', label: "Request SOS", icon: ShieldAlert, badge: 3 },
      { id: 'volunteer-history', label: "Mission history", icon: ClipboardList, badge: null },
    ],
  },
  {
    section: "Volunteer",
    items: [
      { id: 'volunteer-profile',  label: "Volunteer profile",       icon: UserCheck, badge: null },
      { id: 'volunteer-rewards',  label: "Contribution points",   icon: Trophy, badge: null },
    ],
  },
  {
    section: "COMMUNITY",
    items: [
      { id: 'volunteer-notifications', label: "Notifications & Chat", icon: Bell, badge: 5 },
      { id: 'volunteer-forum',         label: "Forum",         icon: MessageSquare, badge: null },
    ],
  },
];

export default function VolunteerSidebar({ activePage, onNavigate, collapsed, onToggleCollapse }) {
  const [unreadCount, setUnreadCount] = useState(() => {
    const cached = localStorage.getItem('total_unread_count');
    return cached ? parseInt(cached, 10) : 0;
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail && typeof e.detail.count === 'number') {
        setUnreadCount(e.detail.count);
      }
    };
    window.addEventListener('unread-count-changed', handleUpdate);
    return () => window.removeEventListener('unread-count-changed', handleUpdate);
  }, []);
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* ── Logo / Branding ── */}
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
          <Heart size={22} color="white" />
        </div>
        <div className="logo-text">
          <div className="logo-name">FloodSense</div>
          <div className="logo-sub">Volunteer · Volunteer</div>
        </div>
      </div>

      {/* ── Status Strip ── */}
      {!collapsed && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <div className="alert-level-bar level-3" style={{ justifyContent: 'center', gap: 8, background: 'rgba(239,29,55,0.12)', border: '1px solid rgba(239,29,55,0.25)', color: 'var(--red-400)' }}>
            <Waves size={11} />
            ONLINE · 3 SOS REQUESTS
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : ''}
                >
                  <Icon size={17} className="nav-item-icon" />
                  <span className="nav-item-label">{item.label}</span>
                  {item.id === 'volunteer-notifications'
                    ? (unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>)
                    : (item.badge && <span className="nav-badge">{item.badge}</span>)}
                </button>
              );
            })}
          </div>
        ))}

        {/* ── Volunteer Status Panel ── */}
        {!collapsed && (
          <div style={{ margin: '18px 4px 0', padding: '14px', background: 'rgba(239,29,55,0.06)', border: '1px solid rgba(239,29,55,0.15)', borderRadius: 'var(--r-md)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <ShieldAlert size={12} color="var(--red-400)" />
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--red-400)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                Volunteer status
              </span>
            </div>
            {[
              { label: "Today's mission", value: '2/5', pct: 40, color: 'var(--orange-400)' },
              { label: "Success rate", value: '97%',  pct: 97, color: 'var(--green-400)' },
              { label: "Score this week",    value: '+120',  pct: 60, color: 'var(--cyan-400)' },
            ].map((row) => (
              <div key={row.label} style={{ marginBottom: 9 }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: row.color, fontFamily: 'var(--font-mono)' }}>{row.value}</span>
                </div>
                <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 99, boxShadow: `0 0 6px ${row.color}` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <button className="collapse-btn" onClick={onToggleCollapse}>
          {collapsed
            ? <ChevronRight size={16} color="var(--text-muted)" />
            : <>
                <ChevronLeft size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 6, fontWeight: 600, letterSpacing: '0.06em' }}>COLLAPSE</span>
              </>
          }
        </button>
      </div>
    </aside>
  );
}
