import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/layout/admin/Sidebar';
import TopBar from './components/layout/admin/TopBar';
import AnimatedBackground from './components/background/AnimatedBackground';

const Dashboard        = lazy(() => import('./pages/admin/Dashboard'));
const CommunityReports = lazy(() => import('./pages/admin/CommunityReports'));
const SystemConfig     = lazy(() => import('./pages/admin/SystemConfig'));
const UserManagement   = lazy(() => import('./pages/admin/UserManagement'));
const IotDeviceManagement = lazy(() => import('./pages/admin/IotDeviceManagement'));
const ForumModeration  = lazy(() => import('./pages/admin/ForumModeration'));
const SupportAnalytics = lazy(() => import('./pages/admin/SupportAnalytics'));
const UserProfile      = lazy(() => import('./pages/user/UserProfile'));
const VehicleTracking   = lazy(() => import('./pages/admin/VehicleTracking'));
const RoutingConfig     = lazy(() => import('./pages/admin/RoutingConfig'));
const CommentModeration = lazy(() => import('./pages/admin/CommentModeration'));
const DeviceActuationLogs = lazy(() => import('./pages/admin/DeviceActuationLogs'));
const OAuthClients      = lazy(() => import('./pages/admin/OAuthClients'));
const PushTokens        = lazy(() => import('./pages/admin/PushTokens'));
const PointsManagement  = lazy(() => import('./pages/admin/PointsManagement'));
const UserNotifications = lazy(() => import('./pages/user/UserNotifications'));


function PageLoader() {
  return (
    <div style={{ padding: '40px 24px', display: 'grid', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--r-lg)' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        <div className="skeleton" style={{ height: 440, borderRadius: 'var(--r-lg)' }} />
        <div className="skeleton" style={{ height: 440, borderRadius: 'var(--r-lg)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="skeleton" style={{ height: 260, borderRadius: 'var(--r-lg)' }} />
        <div className="skeleton" style={{ height: 260, borderRadius: 'var(--r-lg)' }} />
      </div>
    </div>
  );
}

const pages = {
  'dashboard':          Dashboard,
  'community-reports':  CommunityReports,
  'system-config':      SystemConfig,
  'user-management':    UserManagement,
  'iot-management':     IotDeviceManagement,
  'forum-moderation':   ForumModeration,
  'support-analytics':  SupportAnalytics,
  'vehicle-tracking':   VehicleTracking,
  'routing-config':     RoutingConfig,
  'comment-moderation': CommentModeration,
  'device-actuation-logs': DeviceActuationLogs,
  'oauth-clients':      OAuthClients,
  'push-tokens':        PushTokens,
  'points-management': PointsManagement,
  'admin-profile':      UserProfile,
  'admin-notifications': UserNotifications,
};

const pathMap = {
  '/dashboard': 'dashboard',
  '/reports': 'community-reports',
  '/config': 'system-config',
  '/users': 'user-management',
  '/iot': 'iot-management',
  '/forum-mod': 'forum-moderation',
  '/analytics': 'support-analytics',
  '/tracking': 'vehicle-tracking',
  '/routing': 'routing-config',
  '/comments': 'comment-moderation',
  '/logs': 'device-actuation-logs',
  '/oauth': 'oauth-clients',
  '/push': 'push-tokens',
  '/points': 'points-management',
  '/profile': 'admin-profile',
  '/notifications': 'admin-notifications',
};

const pageToPath = Object.fromEntries(Object.entries(pathMap).map(([k, v]) => [v, k]));

import { useAuth } from './hooks/useAuth';

export default function App({ 
  userName: propUserName = 'Admin', 
  avatarUrl: propAvatarUrl = '', 
  onAvatarChange, 
  onUserNameChange 
}) {
  const { logout, setUserName: setGlobalUserName, setAvatarUrl: setGlobalAvatarUrl } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState(propUserName);
  const [avatarUrl, setAvatarUrl] = useState(propAvatarUrl);

  // Lấy activePage từ URL
  const activePage = pathMap[location.pathname] || 'dashboard';

  // Điều hướng tự động nếu URL tào lao
  useEffect(() => {
    if (!pathMap[location.pathname]) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    setUserName(propUserName);
  }, [propUserName]);

  useEffect(() => {
    setAvatarUrl(propAvatarUrl);
  }, [propAvatarUrl]);

  const ActivePage = pages[activePage] || Dashboard;

  const handleNavigate = (page) => {
    const path = pageToPath[page] || '/dashboard';
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const extraProps = activePage === 'admin-profile'
    ? { 
        avatarUrl, 
        onAvatarChange: (newUrl) => {
          setAvatarUrl(newUrl);
          if (onAvatarChange) onAvatarChange(newUrl);
          if (setGlobalAvatarUrl) setGlobalAvatarUrl(newUrl);
        }, 
        userName, 
        onUserNameChange: (newName) => {
          setUserName(newName);
          if (onUserNameChange) onUserNameChange(newName);
          if (setGlobalUserName) setGlobalUserName(newName);
        }, 
        isLoggedIn: true, 
        onLogout: logout, 
        role: 'admin' 
      }
    : {};

  return (
    <>
      {/* ── Animated rain + city background ── */}
      <AnimatedBackground />

      {/* ── App shell ── */}
      <div className="app-layout" style={{ position: 'relative', zIndex: 1 }}>
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(p => !p)}
          userName={userName}
          avatarUrl={avatarUrl}
        />

        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <TopBar activePage={activePage} collapsed={sidebarCollapsed} onOpenProfile={() => handleNavigate('admin-profile')} onNavigate={handleNavigate} userName={userName} avatarUrl={avatarUrl} />
          <div className="page-content">
            <Suspense fallback={<PageLoader />}>
              <ActivePage key={activePage} {...extraProps} />
            </Suspense>
          </div>
        </main>
      </div>
    </>
  );
}

