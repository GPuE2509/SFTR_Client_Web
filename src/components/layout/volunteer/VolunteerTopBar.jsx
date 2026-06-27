import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, Wifi, LogOut, ShieldAlert } from 'lucide-react';

const pageTitles = {
  'volunteer-dashboard':     { title: 'VOLUNTEER VOLUNTEER DASHBOARD', sub: "Real-time rescue mission coordination center" },
  'volunteer-missions':      { title: "REQUEST SOS & TASKS",    sub: "Receive and process emergency rescue requests" },
  'volunteer-map':           { title: "COMBAT MAP",          sub: "Track location and coordinate rescue forces" },
  'volunteer-history':       { title: "MISSION HISTORY",          sub: "Look up and make statistics of performed tasks" },
  'volunteer-profile':       { title: "VOLUNTEER PROFILE",    sub: "Manage profile and activity status" },
  'volunteer-rewards':       { title: "DONATION POINTS & REWARDS",    sub: "Score statistics and volunteer rankings" },
  'volunteer-notifications': { title: "NOTIFICATIONS & CHAT",           sub: "Rescue group notification and communication center" },
  'volunteer-forum':         { title: "COMMUNITY FORUM",        sub: "Share experiences and discuss rescue" },
};

const tickerItems = [
  "New SOS: District 12 – water flooded 1st floor, urgent assistance needed",
  "Mission RES-047 completed: Thu Duc – Volunteer Alpha team",
  "3 rescue requests are waiting for routing",
  "Warning level 3: Water in Hoc Mon area is rising rapidly",
];

export default function VolunteerTopBar({ activePage, collapsed, onLogout, userName, avatarUrl = '', onOpenProfile, onNavigate }) {
  const [time, setTime] = useState(new Date());
  const [sosCount] = useState(3);
  const pageInfo = pageTitles[activePage] || pageTitles['volunteer-dashboard'];

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

  const avatarInitial = userName ? userName.slice(0, 2).toUpperCase() : 'RV';
  const avatarStyle = avatarUrl
    ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent', fontSize: 0 }
    : {};

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fmtTime = (d) =>
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const fmtDate = (d) =>
    d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <header className={`topbar ${collapsed ? 'sidebar-collapsed' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', padding: 0, gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', height: 54, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: 'var(--red-400)',
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}>
            {pageInfo.title}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pageInfo.sub}
          </div>
        </div>

        {/* SOS Alert Badge */}
        {sosCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px',
            background: 'rgba(239,29,55,0.12)',
            border: '1px solid rgba(239,29,55,0.35)',
            borderRadius: 'var(--r-md)',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--red-400)',
            animation: 'blink 2s ease-in-out infinite',
          }}>
            <ShieldAlert size={13} />
            {sosCount} SOS WAITING
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '5px 14px',
          background: 'rgba(61,125,176,0.08)',
          border: '1px solid rgba(120,150,175,0.25)',
          borderRadius: 'var(--r-md)',
        }}>
          <div className="live-indicator">
            <div className="live-dot" />
            LIVE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
            {fmtTime(time)}
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--border-dim)' }} />
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {fmtDate(time)}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px',
          background: 'rgba(62,169,123,0.08)',
          border: '1px solid rgba(62,169,123,0.25)',
          borderRadius: 'var(--r-md)',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--green-400)',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.04em',
        }}>
          <Wifi size={12} />
          ONLINE
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="topbar-btn" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button 
            className="topbar-btn relative" 
            title="Notification"
            onClick={() => onNavigate && onNavigate('volunteer-notifications')}
          >
            <Bell size={15} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--border-dim)' }} />

          <div className="topbar-user" role="button" tabIndex={0} onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', ...avatarStyle }}>
              {avatarUrl ? '' : avatarInitial}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)' }}>
                {userName || 'Volunteer'}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Rescue Volunteers</div>
            </div>
            {/* Removed ChevronDown */}
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div style={{
        height: 28,
        background: 'rgba(239,29,55,0.04)',
        borderTop: '1px solid rgba(239,29,55,0.15)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '0 14px',
          background: 'linear-gradient(135deg, rgba(239,29,55,0.2), rgba(220,38,38,0.1))',
          borderRight: '1px solid rgba(239,29,55,0.2)',
          height: '100%',
          display: 'flex', alignItems: 'center', gap: 6,
          flexShrink: 0,
        }}>
          <div className="live-dot" style={{ width: 6, height: 6, background: 'var(--red-400)', boxShadow: '0 0 6px var(--red-400)' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--red-400)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            NEW WARNING
          </span>
        </div>
        <div className="ticker-wrap" style={{ paddingLeft: 12 }}>
          <div className="ticker-content" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {tickerItems.map((item, i) => (
              <span key={i} style={{ marginRight: 60 }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
