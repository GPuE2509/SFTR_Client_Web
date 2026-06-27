import React, { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, Wifi } from 'lucide-react';

const pageTitles = {
  'user-dashboard':     { title: "CONTROL PANEL", sub: "Monitor alerts, risk zones, and your community activity" },
  'user-reports':       { title: "COMMUNITY REPORT", sub: "Submit flood reports with actual photos and participate in verification" },
  'user-sos':           { title: "SOS & RESCUE CENTER", sub: "Send SOS, track rescue vehicles and manage emergency contacts" },
  'user-notifications': { title: "NOTIFICATIONS & CHAT", sub: "Personal notification center and real-time chat" },
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
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [notifs, setNotifs] = useState([
    { id: 'n1', title: "Flood warning in District 12", body: "The water level at station IOT-QU12-001 has exceeded the threshold of 80cm", time: '14:32', type: 'critical', read: true },
    { id: 'n2', title: "SOS has been received", body: "Your rescue request has been accepted by a volunteer", time: '13:58', type: 'sos', read: true },
    { id: 'n3', title: "The report has been authenticated", body: "Your report of flooding in Hoc Mon was confirmed by 12 people", time: '11:20', type: 'info', read: true },
    { id: 'n4', title: "Trigger warning zone", body: "The flooding event occurred in the \"Home\" zone you set up", time: '10:05', type: 'warning', read: true },
  ]);

  const [unreadCount, setUnreadCount] = useState(() => {
    const cached = localStorage.getItem('total_unread_count');
    return cached ? parseInt(cached, 10) : notifs.filter(n => !n.read).length;
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

  const markAllRead = (e) => {
    e.stopPropagation();
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id, e) => {
    e.stopPropagation();
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

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
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pageInfo.sub}
          </div>
        </div>

        {/* Clock */}
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

        {/* Online status */}
        <div style={{
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
          <button className="topbar-btn" title="Refresh data">
            <RefreshCw size={15} />
          </button>
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className="topbar-btn relative"
              title="Notification"
              onClick={() => setShowNotif(p => !p)}
            >
              <Bell size={15} />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {showNotif && (
              <div style={{
                position: 'absolute',
                top: 42,
                right: 0,
                width: 320,
                background: 'var(--card-bg, #1E293B)',
                border: '1px solid var(--border-dim, #334155)',
                borderRadius: 'var(--r-md, 8px)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                textAlign: 'left',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim, #334155)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>PERSONAL NOTICE</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => markAllRead(e)}
                      style={{ background: 'none', border: 'none', color: 'var(--cyan-400)', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Read them all
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {notifs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>There are no announcements.</div>
                  ) : (
                    notifs.map(n => (
                      <div
                        key={n.id}
                        onClick={(e) => markRead(n.id, e)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--r-sm, 4px)',
                          background: n.read ? 'transparent' : 'rgba(6,182,212,0.05)',
                          border: '1px solid ' + (n.read ? 'transparent' : 'rgba(6,182,212,0.15)'),
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: n.read ? 600 : 800, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.title}</span>
                          <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{n.time}</span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{n.body}</span>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ borderTop: '1px solid var(--border-dim, #334155)', paddingTop: 8, marginTop: 2 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotif(false);
                      if (onNavigate) onNavigate('user-notifications');
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
                      border: '1px solid rgba(6,182,212,0.25)',
                      color: 'var(--cyan-400)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '6px 12px',
                      borderRadius: 'var(--r-sm, 4px)',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                    className="notif-viewall-btn"
                  >
                    See all & Chat
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--border-dim)' }} />

          {/* User avatar + info */}
          <div className="topbar-user" role="button" tabIndex={0} onClick={() => onNavigate && onNavigate('user-profile')} style={{ cursor: 'pointer' }}>
            <div className="user-avatar" style={{ background: isWorkshop ? 'var(--green-400)' : 'var(--cyan-400)', ...avatarStyle }}>
              {avatarUrl ? '' : avatarInitial}
            </div>
            <div>
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
