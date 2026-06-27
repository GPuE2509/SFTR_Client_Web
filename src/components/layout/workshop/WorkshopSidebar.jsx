import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, ShieldAlert, Bell,
  MessageSquare, Trophy, ChevronLeft, ChevronRight,
  Wrench, ClipboardList, Users, BarChart2, Store,
  Waves, Star,
} from 'lucide-react';

const navItems = [
  {
    section: "OVERVIEW",
    items: [
      { id: 'ws-dashboard',   label: "Control panel",     icon: LayoutDashboard, badge: null },
    ],
  },
  {
    section: "CAR REPAIR SHOP",
    items: [
      { id: 'ws-shop',        label: "Workshop Profile & Services", icon: Store,        badge: null },
      { id: 'ws-tasks',       label: "Vehicle repair form",            icon: ClipboardList, badge: 4  },
      { id: 'ws-mechanics',   label: "Vehicle repairman manager",    icon: Users,        badge: null },
      { id: 'ws-reviews',     label: "Customer reviews",   icon: Star,         badge: 2  },
      { id: 'ws-stats',       label: "Contribution statistics",     icon: BarChart2,    badge: null },
    ],
  },
  {
    section: "User",
    items: [
      { id: 'user-dashboard',     label: "Personal dashboard", icon: LayoutDashboard, badge: null },
      { id: 'user-reports',       label: "Community reporting",        icon: FileText,        badge: 2   },
      { id: 'user-sos',           label: "SOS & Rescue",             icon: ShieldAlert,     badge: 1   },
      { id: 'user-notifications', label: "Notifications & Chat",          icon: Bell,            badge: 4   },
      { id: 'user-forum',         label: "Community forum",       icon: MessageSquare,   badge: null },
      { id: 'user-rewards',       label: "Bonus points",               icon: Trophy,          badge: null },
    ],
  },
];

export default function WorkshopSidebar({ activePage, onNavigate, collapsed, onToggleCollapse }) {
  const [unreadCount, setUnreadCount] = useState(() => {
    const cached = localStorage.getItem('total_unread_count');
    return cached ? parseInt(cached, 10) : 0;
  });

  const [newReportsCount, setNewReportsCount] = useState(0);

  useEffect(() => {
    const checkNew = async () => {
      const lastSeen = localStorage.getItem('lastVisitedCommunityVerification');
      try {
        const res = await fetch(`http://localhost:5000/api/incident-reports/new-count${lastSeen ? `?since=${lastSeen}` : ''}`);
        const data = await res.json();
        if (data.success) setNewReportsCount(data.count);
      } catch (err) {
        console.error(err);
      }
    };
    checkNew();
    const interval = setInterval(checkNew, 60000);
    const onVisited = () => setNewReportsCount(0);
    window.addEventListener('communityVerificationVisited', onVisited);
    return () => {
      clearInterval(interval);
      window.removeEventListener('communityVerificationVisited', onVisited);
    };
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
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
          <Wrench size={22} color="white" />
        </div>
        <div className="logo-text">
          <div className="logo-name">FloodSense</div>
          <div className="logo-sub">Workshop · Repair</div>
        </div>
      </div>

      {/* ── Status strip ── */}
      {!collapsed && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '5px 10px', borderRadius: 'var(--r-sm)',
            background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.3)',
            fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            <Wrench size={11} />
            SHOP IS OPEN · 4 ORDERS PENDING
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
                   style={isActive && section.section === "CAR REPAIR SHOP"
                     ? { borderLeft: '3px solid #f59e0b', background: 'rgba(217,119,6,0.1)' }
                     : {}}
                >
                  <Icon size={17} className="nav-item-icon" />
                  <span className="nav-item-label">{item.label}</span>
                  {item.id === 'user-notifications'
                    ? (unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>)
                    : item.id === 'user-reports'
                    ? (newReportsCount > 0 && <span className="nav-badge">{newReportsCount}</span>)
                    : (item.badge && <span className="nav-badge">{item.badge}</span>)}
                </button>
              );
            })}
          </div>
        ))}

        {/* ── Shop Status Panel ── */}
        {!collapsed && (
          <div style={{ margin: '18px 4px 0', padding: '14px', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.18)', borderRadius: 'var(--r-md)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <BarChart2 size={12} color="#f59e0b" />
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
                Performance today
              </span>
            </div>
            {[
              { label: "Application completed", value: '7/11', pct: 64, color: '#f59e0b' },
              { label: "Average rating", value: '4.7★', pct: 94, color: 'var(--green-400)' },
              { label: "Score today", value: '+85', pct: 57, color: 'var(--cyan-400)' },
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
