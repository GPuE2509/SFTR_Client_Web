import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, ShieldAlert, Bell,
  MessageSquare, Trophy, ChevronLeft, ChevronRight,
  Waves, AlertTriangle,
  Store, ClipboardList, Star, BarChart2, Users,
} from 'lucide-react';

export default function UserSidebar({ activePage, onNavigate, collapsed, onToggleCollapse, role = 'user', mobileOpen = false, onMobileClose, activeSOSCount = 0 }) {
  const isWorkshop = role === 'workshop';
  const isWorkshopRole = isWorkshop;

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

  const sections = [
    {
      section: "OVERVIEW",
      items: [
        { id: 'user-dashboard', label: "Control panel", icon: LayoutDashboard, badge: null },
      ],
    },
    {
      section: "REPORT & RESCUE",
      items: [
        { id: 'user-reports', label: "Community reporting", icon: FileText, badge: newReportsCount > 0 ? newReportsCount : null },
        { id: 'user-sos', label: "SOS & Rescue", icon: ShieldAlert, badge: activeSOSCount > 0 ? activeSOSCount : null },
      ],
    },
  ];

  if (isWorkshopRole) {
    const wsItems = [
      { id: 'ws-shop', label: "Workshop Profile & Services", icon: Store, badge: null },
      { id: 'ws-tasks', label: "Vehicle repair form", icon: ClipboardList, badge: 4 },
    ];
    if (isWorkshop) {
      wsItems.push({ id: 'ws-mechanics', label: "Vehicle repairman manager", icon: Users, badge: null });
    }
    wsItems.push(
      { id: 'ws-reviews', label: "Customer reviews", icon: Star, badge: 2 },
      { id: 'ws-stats', label: "Contribution statistics", icon: BarChart2, badge: null }
    );
    sections.push({
      section: "YOUR CAR REPAIR SHOP",
      items: wsItems,
    });
  }

  sections.push(
    {
      section: "COMMUNITY",
      items: [
        { id: 'user-notifications', label: "Notifications & Chat", icon: Bell, badge: unreadCount },
        { id: 'user-forum', label: "Forum", icon: MessageSquare, badge: null },
        { id: 'user-rewards', label: "Bonus points", icon: Trophy, badge: null },
      ],
    }
  );


  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Waves size={22} color="white" />
        </div>
        <div className="logo-text">
          <div className="logo-name">FloodSense</div>
          <div className="logo-sub">{isWorkshop ? "Workshop Owner" : "Member · User"}</div>
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="sidebar-mobile-close-btn"
            title="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Alert level bar — same as GuestSidebar */}
      {!collapsed && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-dim)' }}>
          <div className="alert-level-bar level-3" style={{ justifyContent: 'center', gap: 8 }}>
            <AlertTriangle size={11} />
            LEVEL 3 · HIGH ALERT
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {sections.map((section) => (
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

      {/* Footer */}
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
