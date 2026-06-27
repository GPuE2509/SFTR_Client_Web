import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Settings, Users,
  MessageSquare, HeadphonesIcon, ChevronLeft, ChevronRight,
  Waves, Shield, Activity, AlertTriangle, Truck, History, Layers, Key, Smartphone, Trophy, Bell, Cpu,
} from 'lucide-react';

const navItems = [
  {
    section: "OVERVIEW",
    items: [
      { id: 'dashboard', label: 'Live Executive Dashboard', icon: LayoutDashboard, badge: null },
      { id: 'admin-notifications', label: "Notifications & Chat", icon: Bell, badge: 7 },
    ],
  },
  {
    section: "SYSTEM MANAGEMENT",
    items: [
      { id: 'community-reports', label: "Report Review", icon: FileText, badge: null },
      { id: 'system-config',     label: "System Configuration",  icon: Settings, badge: null },
      { id: 'routing-config',    label: "Navigation Configuration", icon: Layers, badge: null },
      { id: 'user-management',   label: "User Management", icon: Users, badge: 2 },
      { id: 'iot-management',    label: "IoT Devices", icon: Cpu, badge: null },
      { id: 'device-actuation-logs', label: "Device command log", icon: History, badge: null },
    ],
  },
  {
    section: "COMMUNITY",
    items: [
      { id: 'forum-moderation',  label: "Forum Moderation", icon: MessageSquare, badge: 5 },
      { id: 'comment-moderation', label: "Moderation Comments", icon: MessageSquare, badge: null },
      { id: 'points-management', label: "Score Management", icon: Trophy, badge: null },
      { id: 'support-analytics', label: "Support & Analysis",  icon: HeadphonesIcon, badge: 3 },
    ],
  },
  {
    section: "INTEGRATION & OPS",
    items: [
      { id: 'vehicle-tracking', label: "Follow Media", icon: Truck, badge: null },
      { id: 'oauth-clients', label: 'OAuth Clients', icon: Key, badge: null },
      { id: 'push-tokens', label: 'Push Tokens', icon: Smartphone, badge: null },
    ],
  },
];

export default function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse }) {
  const [unreadCount, setUnreadCount] = useState(() => {
    const cached = localStorage.getItem('total_unread_count');
    return cached ? parseInt(cached, 10) : 0;
  });
  const [pendingReports, setPendingReports] = useState(0);

  useEffect(() => {
    fetch('http://localhost:5000/api/incident-reports')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const count = data.data.filter(r => r.moderation_status === 'Pending').length;
          setPendingReports(count);
        }
      })
      .catch(err => console.error(err));
  }, []);

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
        <div className="logo-icon">
          <Waves size={22} color="white" />
        </div>
        <div className="logo-text">
          <div className="logo-name">FloodSense</div>
          <div className="logo-sub">GOV · Command Center</div>
        </div>
      </div>

      {/* ── Alert Level Strip ── */}
      {!collapsed && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <div className="alert-level-bar level-3" style={{ justifyContent: 'center', gap: 8 }}>
            <AlertTriangle size={11} />
            LEVEL 3 · HIGH ALERT
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
                  {item.id === 'admin-notifications'
                    ? (unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>)
                    : item.id === 'community-reports'
                      ? (pendingReports > 0 && <span className="nav-badge">{pendingReports}</span>)
                      : (item.badge && <span className="nav-badge">{item.badge}</span>)}
                </button>
              );
            })}
          </div>
        ))}

        {/* ── System Health Panel ── */}
        {!collapsed && (
          <div style={{ margin: '18px 4px 0', padding: '14px', background: 'rgba(61,125,176,0.08)', border: '1px solid rgba(120,150,175,0.2)', borderRadius: 'var(--r-md)' }}>
            {/* Header */}
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <Activity size={12} color="var(--green-400)" />
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--cyan-400)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                System Health
              </span>
            </div>

            {/* Health rows */}
            {[
              { label: "Online IoT Station",  value: '248/290', pct: 85, color: 'var(--green-400)' },
              { label: 'API Uptime',        value: '99.8%',   pct: 99, color: 'var(--cyan-400)' },
              { label: 'DB Health',         value: 'Optimal', pct: 100, color: 'var(--green-400)' },
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

            {/* Status dots */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-dim)' }}>
              {[
                { label: 'AI', color: 'var(--green-400)' },
                { label: 'MAP', color: 'var(--green-400)' },
                { label: 'PUSH', color: 'var(--green-400)' },
                { label: 'BACKUP', color: 'var(--orange-400)' },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ width: 7, height: 7, background: s.color, borderRadius: '50%', margin: '0 auto 3px', boxShadow: `0 0 5px ${s.color}`, animation: 'blink 2s ease-in-out infinite' }} />
                  <div style={{ fontSize: '0.52rem', color: 'var(--text-dim)', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>{s.label}</div>
                </div>
              ))}
            </div>
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
