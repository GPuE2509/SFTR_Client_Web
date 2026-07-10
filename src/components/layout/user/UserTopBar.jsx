import React, { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, Wifi, Mail, MapPin, Check, X, Loader } from 'lucide-react';
import { apiService } from '../../../services/apiService';

const pageTitles = {
  'user-dashboard':     { title: "CONTROL PANEL", sub: "Monitor alerts, risk zones, and your community activity" },
  'user-reports':       { title: "COMMUNITY REPORT", sub: "Submit flood reports with actual photos and participate in verification" },
  'user-sos':           { title: "SOS & RESCUE CENTER", sub: "Send SOS, track rescue vehicles and manage emergency contacts" },
  'user-notifications': { title: "NOTIFICATIONS & CHAT", sub: "Personal notification center and real-time chat" },
  'user-invitations':   { title: "WORKSHOP INVITATIONS", sub: "Manage your invitations to join workshop staff" },
  'user-forum':         { title: "COMMUNITY FORUM", sub: "Share flood images and exchange response experiences" },
  'user-workshops':     { title: "REPAIR WORKSHOP", sub: "Find the nearest workshop, rate and comment on the service" },
  'user-rewards':       { title: "REWARD POINTS & HONOR", sub: "Track contribution points, score history and rankings" },
  'user-profile':       { title: "PERSONAL PROFILE", sub: "View and update account information, profile picture, and password" },
  'ws-shop':            { title: "SHOP & SERVICES PROFILE", sub: "Manage Workshop information, service list, price list and operating status" },
  'ws-tasks':           { title: "MANAGE VEHICLE REPAIR ORDERS", sub: "Receive applications, assign mobile Workshop Staff and monitor progress visually" },
  'ws-reviews':         { title: "CUSTOMER REVIEWS", sub: "View customer feedback and write thank you/reply letters" },
  'ws-stats':           { title: "CONTRIBUTED STATISTICS", sub: "Track performance metrics, dedication points, and revenue" },
  'ws-mechanics':       { title: "CAR REPAIR MANAGER", sub: "Approve mobile Workshop Staff' connection requests, coordinate duty schedules and shifts" },
};

const tickerItems = [
  "New warning: 3 areas of District 12 & Hoc Mon are at high risk of flooding",
  "Ho Chi Minh City weather: Heavy rain 60-80mm, limited travel during peak hours",
  "IoT system: 248 active stations — updated every 5 seconds",
  "SOS is handling: 4 cases — Volunteers on the move",
  "Recommendation: Avoid Nguyen Huu Canh street, Binh Loi bridge and An Suong tunnel",
];

export default function UserTopBar({
  activePage,
  collapsed,
  isLoggedIn,
  userName,
  avatarUrl,
  onLogin,
  onLogout,
  onOpenProfile,
  onNavigate,
  role = 'user',
  workshopName = null,
  notifCount = 4,
  onOpenMobileSidebar,
}) {
  const [time, setTime] = useState(new Date());
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const res = await apiService.get('/workshops/staff/invitations');
        if (res && res.invitations) {
          setInvitations(res.invitations);
        }
      } catch (err) {
        console.error('Failed to fetch invitations:', err);
      }
    };
    fetchInvitations();
  }, []);

  const handleToggleInvites = () => {
    if (onNavigate) {
      onNavigate('user-invitations');
    }
  };

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

  const pageInfo = pageTitles[activePage] || pageTitles['user-dashboard'];
  const isWorkshop = role === 'workshop';

  const roleLabel = isWorkshop
    ? `Shop owner · ${workshopName || "Minh Chau Garage"}`
    : "Member";

  const avatarInitial = userName
    ? userName.trim().split(' ').pop().charAt(0).toUpperCase()
    : 'U';

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
    <header className={`topbar ${collapsed ? 'sidebar-collapsed' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', padding: 0, gap: 0, overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', height: 54, flexShrink: 0, overflow: 'visible' }}>

        {/* Hamburger button — mobile only */}
        {onOpenMobileSidebar && (
          <button
            className="topbar-hamburger-btn"
            onClick={onOpenMobileSidebar}
            title="Open menu"
            aria-label="Open navigation menu"
          >
            <span /><span /><span />
          </button>
        )}
        
        {/* Page title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: 'var(--cyan-400)',
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}>
            {pageInfo.title}
          </div>
          <div className="topbar-subtitle" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pageInfo.sub}
          </div>
        </div>

        {/* Clock */}
        <div className="topbar-clock" style={{
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

        {/* Online status */}
        <div className="topbar-wifi" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px',
          background: 'rgba(62,169,123,0.08)',
          border: '1px solid rgba(62,169,123,0.25)',
          borderRadius: 'var(--r-md)',
          fontSize: '0.68rem', fontWeight: 700,
          color: 'var(--green-400)',
          letterSpacing: '0.04em',
        }}>
          <Wifi size={12} />
          CONNECT
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <button 
              className="topbar-btn relative" 
              title="Invitations"
              onClick={handleToggleInvites}
            >
              <Mail size={15} />
              {invitations.length > 0 && <span className="notif-badge">{invitations.length}</span>}
            </button>
          </div>
          <button
            className="topbar-btn relative"
            title="Notification"
            onClick={() => onNavigate && onNavigate('user-notifications')}
          >
            <Bell size={15} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--border-dim)' }} />

          {/* User avatar + info */}
          <div className="topbar-user" role="button" tabIndex={0} onClick={() => onNavigate && onNavigate('user-profile')} style={{ cursor: 'pointer' }}>
            <div className="user-avatar" style={{ background: isWorkshop ? 'var(--green-400)' : 'var(--cyan-400)', ...avatarStyle }}>
              {avatarUrl ? '' : avatarInitial}
            </div>
            <div className="topbar-user-info">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
                {userName || "User"}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
                {roleLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div style={{
        height: 28,
        background: 'rgba(61,125,176,0.06)',
        borderTop: '1px solid rgba(120,150,175,0.2)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '0 14px',
          background: 'linear-gradient(135deg, rgba(61,125,176,0.25), rgba(69,179,192,0.12))',
          borderRight: '1px solid rgba(120,150,175,0.25)',
          height: '100%',
          display: 'flex', alignItems: 'center', gap: 6,
          flexShrink: 0,
        }}>
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--cyan-400)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            NEW NEWS
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
