import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WorkshopSidebar from './components/layout/workshop/WorkshopSidebar';
import WorkshopTopBar from './components/layout/workshop/WorkshopTopBar';
import AnimatedBackground from './components/background/AnimatedBackground';
import { apiService } from './services/apiService';
import { MessageSquare } from 'lucide-react';
import MobileSidebarToggle from './components/layout/MobileSidebarToggle';

// ── Workshop-specific pages ──
const WorkshopDashboard = lazy(() => import('./pages/workshop/WorkshopDashboard'));
const WorkshopShop      = lazy(() => import('./pages/workshop/WorkshopShop'));
const WorkshopTasks     = lazy(() => import('./pages/workshop/WorkshopTasks'));
const WorkshopMechanics = lazy(() => import('./pages/workshop/WorkshopMechanics'));
const WorkshopReviews   = lazy(() => import('./pages/workshop/WorkshopReviews'));
const WorkshopStats     = lazy(() => import('./pages/workshop/WorkshopStats'));

// ── Inherited User pages ──
const UserDashboard     = lazy(() => import('./pages/user/UserDashboard'));
const UserReports       = lazy(() => import('./pages/user/UserReports'));
const UserSOS           = lazy(() => import('./pages/user/UserSOS'));
const UserNotifications = lazy(() => import('./pages/user/UserNotifications'));
const UserForum         = lazy(() => import('./pages/user/UserForum'));
const UserRewards       = lazy(() => import('./pages/user/UserRewards'));
const UserProfile       = lazy(() => import('./pages/user/UserProfile'));

function PageLoader() {
  return (
    <div style={{ padding: '40px 24px', display: 'grid', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--r-lg)' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 16 }}>
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--r-lg)' }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--r-lg)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="skeleton" style={{ height: 240, borderRadius: 'var(--r-lg)' }} />
        <div className="skeleton" style={{ height: 240, borderRadius: 'var(--r-lg)' }} />
      </div>
    </div>
  );
}

const pages = {
  // Workshop pages
  'ws-dashboard':  WorkshopDashboard,
  'ws-shop':       WorkshopShop,
  'ws-tasks':      WorkshopTasks,
  'ws-mechanics':  WorkshopMechanics,
  'ws-reviews':    WorkshopReviews,
  'ws-stats':      WorkshopStats,
  // Inherited user pages
  'user-dashboard':     UserDashboard,
  'user-reports':       UserReports,
  'user-sos':           UserSOS,
  'user-notifications': UserNotifications,
  'user-forum':         UserForum,
  'user-rewards':       UserRewards,
  'user-profile':       UserProfile,
};

const pathMap = {
  // Workshop pages
  '/dashboard': 'ws-dashboard',
  '/shop': 'ws-shop',
  '/tasks': 'ws-tasks',
  '/mechanics': 'ws-mechanics',
  '/reviews': 'ws-reviews',
  '/stats': 'ws-stats',
  // Inherited user pages
  '/reports': 'user-reports',
  '/sos': 'user-sos',
  '/notifications': 'user-notifications',
  '/forum': 'user-forum',
  '/rewards': 'user-rewards',
  '/profile': 'user-profile',
};

const pageToPath = Object.fromEntries(Object.entries(pathMap).map(([k, v]) => [v, k]));

export default function WorkshopApp({ 
  onLogoutToGuest, 
  linkRequests, 
  onApproveLink, 
  onRejectLink,
  workshopName,
  userName: initialUserName,
  avatarUrl: propAvatarUrl,
  isLoggedIn: initialIsLoggedIn = true,
  onAvatarChange,
  onUserNameChange
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shopName, setShopName] = useState(workshopName);

  // Shared user-profile props (passed down to UserProfile)
  const [avatarUrl, setAvatarUrl] = useState(propAvatarUrl);
  const [userName, setUserName] = useState(initialUserName);
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);

  // Lấy activePage từ URL
  const activePage = pathMap[location.pathname] || 'ws-dashboard';

  // Điều hướng tự động nếu URL tào lao
  useEffect(() => {
    if (!pathMap[location.pathname]) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (initialUserName) {
      setUserName(initialUserName);
    }
  }, [initialUserName]);

  useEffect(() => {
    setAvatarUrl(propAvatarUrl);
  }, [propAvatarUrl]);

  useEffect(() => {
    if (workshopName) {
      setShopName(workshopName);
    }
  }, [workshopName]);

  const ActivePage = pages[activePage] || WorkshopDashboard;

  const handleNavigate = (page) => {
    const path = pageToPath[page] || '/dashboard';
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    if (onLogoutToGuest) onLogoutToGuest();
  };

  const [globalToast, setGlobalToast] = useState(null);

  useEffect(() => {
    if (globalToast) {
      const timer = setTimeout(() => setGlobalToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalToast]);

  useEffect(() => {
    const isNotificationsPage = activePage === 'user-notifications';
    if (isNotificationsPage || !isLoggedIn) return;

    let socket;
    let retryTimer;

    const connect = () => {
      const wsUrl = `ws://localhost:5000`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WorkshopApp background WebSocket connected');
        const registerUser = async () => {
          try {
            const res = await apiService.get('/auth/profile');
            if (res && res.user && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'register',
                userId: res.user._id,
                userName: res.user.full_name,
                role: res.user.role,
                avatarUrl: res.user.avatar_url || ''
              }));

              // Fetch conversations to initialize unread count from database
              const convsRes = await apiService.get('/chat/conversations');
              if (convsRes && convsRes.success && convsRes.data) {
                const chatUnread = convsRes.data.reduce((acc, c) => acc + (c.unread || 0), 0);
                localStorage.setItem('total_unread_count', chatUnread);
                window.dispatchEvent(new CustomEvent('unread-count-changed', { detail: { count: chatUnread } }));
              }
            }
          } catch (err) {
            console.error('Background socket auth check failed:', err);
          }
        };
        registerUser();
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'chat') {
            // Update unread count in localStorage and dispatch event
            const cached = localStorage.getItem('total_unread_count');
            const currentCount = cached ? parseInt(cached, 10) : 0;
            const newCount = currentCount + 1;
            localStorage.setItem('total_unread_count', newCount);
            window.dispatchEvent(new CustomEvent('unread-count-changed', { detail: { count: newCount } }));

            // Show Toast
            setGlobalToast({
              id: Date.now(),
              title: `New message from ${msg.senderName}`,
              body: msg.text
            });
          }
        } catch (err) {
          console.error('Error in background socket message handler:', err);
        }
      };

      socket.onclose = () => {
        console.log('WorkshopApp background WebSocket disconnected, retrying in 5s...');
        retryTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [activePage, isLoggedIn]);

  // Extra props for pages that need them (inherited user pages / mechanics page)
  const extraProps = activePage === 'user-profile'
    ? { 
        avatarUrl, 
        onAvatarChange: (url) => { setAvatarUrl(url); if (onAvatarChange) onAvatarChange(url); }, 
        userName, 
        onUserNameChange: (name) => { setUserName(name); if (onUserNameChange) onUserNameChange(name); }, 
        isLoggedIn, 
        onLogout: handleLogout,
        role: 'workshop'
      }
    : activePage === 'ws-mechanics'
    ? { linkRequests, onApproveLink, onRejectLink }
    : {};

  return (
    <>
      <AnimatedBackground />
      <MobileSidebarToggle />
      <div className="app-layout" style={{ position: 'relative', zIndex: 1 }}>
        <WorkshopSidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(p => !p)}
        />

        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <WorkshopTopBar
            activePage={activePage}
            collapsed={sidebarCollapsed}
            onLogout={handleLogout}
            shopName={shopName}
            onOpenProfile={() => handleNavigate('user-profile')}
            userName={userName}
            avatarUrl={avatarUrl}
            onNavigate={handleNavigate}
          />
          <div className="page-content">
            <Suspense fallback={<PageLoader />}>
              <ActivePage key={activePage} onNavigate={handleNavigate} {...extraProps} />
            </Suspense>
          </div>
        </main>
      </div>
      {globalToast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 320,
          background: 'rgba(18, 29, 40, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-default, rgba(120,150,175,0.3))',
          boxShadow: 'var(--shadow-lg), 0 0 20px rgba(69, 179, 192, 0.2)',
          borderRadius: 'var(--r-md)',
          padding: '12px 14px',
          display: 'flex',
          gap: 12,
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <style>{`
            @keyframes slideIn {
              from { transform: translateY(100px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare size={16} color="var(--cyan-400)" />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{globalToast.title}</span>
              <button 
                onClick={() => setGlobalToast(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: '0.85rem' }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{globalToast.body}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                className="btn btn-primary btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.68rem', height: 22 }}
                onClick={() => {
                  setGlobalToast(null);
                  handleNavigate('user-notifications');
                }}
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
