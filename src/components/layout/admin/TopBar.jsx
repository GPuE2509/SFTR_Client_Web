import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, Settings, Wifi, ShieldCheck, Globe2 } from 'lucide-react';

const pageTitles = {
  'dashboard':          { title: "LIVE EXECUTIVE DASHBOARD", sub: "Overall monitoring, reporting quality and operational performance" },
  'community-reports':  { title: "REVIEW COMMUNITY REPORTS",    sub: "Manage & verify flood reports from residents" },
  'system-config':      { title: "SYSTEM CONFIGURATION",     sub: "Alarm thresholds, data storage and system modules" },
  'routing-config':     { title: "NAVIGATION CONFIGURATION",   sub: "AI warning rules, safe routing configuration" },
  'forum-moderation':   { title: "FORUM MODERATION",   sub: "Manage content, pinned posts and violating posts" },
  'user-management':    { title: "USER & IOT DEVICE MANAGEMENT", sub: "Manage accounts, device lifecycles, and IoT status" },
  'iot-management':     { title: "IOT DEVICE MANAGEMENT", sub: "Manage connection and status of IoT sensors" },
  'device-actuation-logs': { title: "DEVICE ACTUATION LOGS", sub: "View commands sent to warning devices" },
  'points-management':  { title: "SCORE MANAGEMENT", sub: "Adjust and verify contribution points" },
  'support-analytics':  { title: "SUPPORT & ANALYSIS", sub: "Handle technical tickets and produce analysis reports" }
};

// Scrolling alert ticker content
const tickerItems = [
  "SOS-001 · District 12 · 1st floor flooded, urgent assistance needed",
  "Hoc Mon: Tran Thi He Street flooded 91cm deep · IOT-HM-047 station red alert",
  "8 newly connected IoT stations · Binh Duong, Dong Nai area",
  "Forecast: Heavy rain 60-80mm this evening in Ho Chi Minh City and surrounding areas",
  "QB-07 rescue team arrived at the Thu Duc scene · The situation is under control",
  "SOS-004 · Thu Duc · Water rising rapidly on National Highway 13",
  "AI system analyzed 234 reports today · 96.2% accuracy",
];

export default function TopBar({ activePage, collapsed, onOpenProfile, onNavigate, userName = 'Admin', avatarUrl = '' }) {
  const [time, setTime] = useState(new Date());
  const pageInfo = pageTitles[activePage] || pageTitles['dashboard'];

  const avatarInitial = userName ? userName.slice(0, 2).toUpperCase() : 'AD';
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

      {/* ── Main topbar row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', height: 54, flexShrink: 0 }}>

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

        {/* Live clock block */}
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

        {/* Connection badge */}
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

        {/* Alert level */}
        <div className="alert-level-bar level-3" style={{ padding: '5px 12px' }}>
          <ShieldCheck size={12} />
          LEVEL 3
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="topbar-btn" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button 
            className="topbar-btn relative" 
            title="Notification"
            onClick={() => onNavigate && onNavigate('admin-notifications')}
          >
            <Bell size={15} />
            <span className="notif-badge">7</span>
          </button>
          <button className="topbar-btn" title="Setting">
            <Settings size={15} />
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--border-dim)' }} />

          <div className="topbar-user" role="button" tabIndex={0} onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
            <div className="user-avatar" style={{ ...avatarStyle }}>
              {avatarUrl ? '' : avatarInitial}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{userName || 'Admin'}</div>
              <div style={{ fontSize: '0.6rem', color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Super Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Alert ticker strip ── */}
      <div style={{
        height: 28,
        background: 'rgba(61,125,176,0.06)',
        borderTop: '1px solid rgba(120,150,175,0.2)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Label */}
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
            NEW WARNING
          </span>
        </div>

        {/* Scrolling content */}
        <div className="ticker-wrap" style={{ paddingLeft: 12 }}>
          <div className="ticker-content" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {tickerItems.map((item, i) => (
              <span key={i} style={{ marginRight: 60 }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
