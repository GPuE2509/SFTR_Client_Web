import React, { useState, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from './services/apiService';
import ManagerSidebar from './components/layout/manager/ManagerSidebar';
import ManagerTopBar from './components/layout/manager/ManagerTopBar';
import AnimatedBackground from './components/background/AnimatedBackground';
import MobileSidebarToggle from './components/layout/MobileSidebarToggle';

const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const ManagerOps = lazy(() => import('./pages/manager/ManagerOps'));
const CommunityReports = lazy(() => import('./pages/admin/CommunityReports'));
const ForumModeration = lazy(() => import('./pages/admin/ForumModeration'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const IotDeviceManagement = lazy(() => import('./pages/manager/ManagerIotDeviceManagement'));
const SystemConfig = lazy(() => import('./pages/admin/SystemConfig'));
const SupportAnalytics = lazy(() => import('./pages/admin/SupportAnalytics'));
const UserProfile = lazy(() => import('./pages/user/UserProfile'));
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
  'manager-dashboard': ManagerDashboard,
  'manager-ops': ManagerOps,
  'community-reports': CommunityReports,
  'forum-moderation': ForumModeration,
  'user-management': UserManagement,
  'iot-management': IotDeviceManagement,
  'system-config': SystemConfig,
  'support-analytics': SupportAnalytics,
  'manager-profile': UserProfile,
  'manager-notifications': UserNotifications,
};

const pathMap = {
  '/dashboard': 'manager-dashboard',
  '/ops': 'manager-ops',
  '/reports': 'community-reports',
  '/forum-mod': 'forum-moderation',
  '/users': 'user-management',
  '/iot': 'iot-management',
  '/config': 'system-config',
  '/analytics': 'support-analytics',
  '/profile': 'manager-profile',
  '/notifications': 'manager-notifications',
};

const pageToPath = Object.fromEntries(Object.entries(pathMap).map(([k, v]) => [v, k]));

export default function ManagerApp({ onLogoutToGuest, roleRequests, onApproveRequest, onRejectRequest, userName: propUserName = 'Manager', avatarUrl: propAvatarUrl = '', onAvatarChange, onUserNameChange }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState(propUserName);
  const [avatarUrl, setAvatarUrl] = useState(propAvatarUrl);

  // Lấy activePage từ URL
  const activePage = pathMap[location.pathname] || 'manager-dashboard';

  // Điều hướng tự động nếu URL tào lao
  React.useEffect(() => {
    if (!pathMap[location.pathname]) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  React.useEffect(() => {
    setUserName(propUserName);
  }, [propUserName]);

  React.useEffect(() => {
    setAvatarUrl(propAvatarUrl);
  }, [propAvatarUrl]);

  React.useEffect(() => {
    const fetchInitialUnreadCount = async () => {
      try {
        const notifsRes = await apiService.get('/notifications');
        let notifUnread = 0;
        if (notifsRes && notifsRes.success && notifsRes.data) {
          notifUnread = notifsRes.data.filter(n => !n.is_read).length;
        }

        const convsRes = await apiService.get('/chat/conversations');
        let chatUnread = 0;
        if (convsRes && convsRes.success && convsRes.data) {
          chatUnread = convsRes.data.reduce((acc, c) => acc + (c.unread || 0), 0);
        }

        const totalUnread = notifUnread + chatUnread;
        localStorage.setItem('total_unread_count', totalUnread);
        window.dispatchEvent(new CustomEvent('unread-count-changed', { detail: { count: totalUnread } }));
      } catch (err) {
        console.error('Failed to fetch initial unread notifications count:', err);
      }
    };
    fetchInitialUnreadCount();
  }, []);

  const ActivePage = pages[activePage] || ManagerDashboard;

  const handleNavigate = (page) => {
    const path = pageToPath[page] || '/dashboard';
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    if (onLogoutToGuest) onLogoutToGuest();
  };

  const extraProps = activePage === 'manager-profile'
    ? { 
        avatarUrl, 
        onAvatarChange: (url) => { setAvatarUrl(url); if (onAvatarChange) onAvatarChange(url); }, 
        userName, 
        onUserNameChange: (name) => { setUserName(name); if (onUserNameChange) onUserNameChange(name); }, 
        isLoggedIn: true, 
        onLogout: handleLogout, 
        role: 'manager' 
      }
    : {};

  return (
    <>
      <AnimatedBackground />
      <MobileSidebarToggle />
      <div className="app-layout" style={{ position: 'relative', zIndex: 1 }}>
        <ManagerSidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(p => !p)}
          userName={userName}
          avatarUrl={avatarUrl}
        />

        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <ManagerTopBar activePage={activePage} collapsed={sidebarCollapsed} onOpenProfile={() => handleNavigate('manager-profile')} onNavigate={handleNavigate} userName={userName} avatarUrl={avatarUrl} />
          <div className="page-content">
            <Suspense fallback={<PageLoader />}>
              <ActivePage 
                key={activePage} 
                roleRequests={roleRequests}
                onApproveRequest={onApproveRequest}
                onRejectRequest={onRejectRequest}
                {...extraProps}
              />
            </Suspense>
          </div>
        </main>
      </div>
    </>
  );
}

