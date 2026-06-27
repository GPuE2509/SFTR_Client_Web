import React from 'react';
import {
  LayoutDashboard, Megaphone, MessageSquare,
  Trophy, LifeBuoy, ChevronLeft, ChevronRight,
  Waves, AlertTriangle, User
} from 'lucide-react';

const navItems = [
  {
    section: "OVERVIEW",
    items: [
      { id: 'guest-home', label: "Flood news", icon: LayoutDashboard, badge: null },
    ],
  },
  {
    section: "COMMUNITY",
    items: [
      { id: 'guest-forum', label: "Community forum", icon: MessageSquare, badge: null },
      { id: 'guest-leaderboard', label: "Honor board", icon: Trophy, badge: null },
    ],
  },
  {
    section: "INSTRUCT",
    items: [
      { id: 'guest-info', label: "Emergency portal", icon: LifeBuoy, badge: null },
    ],
  },
];

export default function GuestSidebar({ activePage, onNavigate, collapsed, onToggleCollapse }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Waves size={22} color="white" />
        </div>
        <div className="logo-text">
          <div className="logo-name">FloodSense</div>
          <div className="logo-sub">Public · Guest Portal</div>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <div className="alert-level-bar level-3" style={{ justifyContent: 'center', gap: 8 }}>
            <AlertTriangle size={11} />
            LEVEL 3 · HIGH ALERT
          </div>
        </div>
      )}

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
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
            <div className="user-avatar" style={{ width: 34, height: 34, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <User size={16} />
            </div>
          </div>
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
