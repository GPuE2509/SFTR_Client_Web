import React, { useState, useRef, useEffect } from 'react';
import {
  Bell, CheckCircle, MessageSquare, Search, Send, Clock,
  Mail, Smartphone, ShieldCheck, Settings, Circle, Check,
  Image as ImageIcon, Smile, Phone, Video, MoreHorizontal,
  AlertTriangle, Zap, Users, ChevronRight, X, UserPlus, UserCheck,
  Radio, ShieldAlert, Loader
} from 'lucide-react';
import { broadcastAdvisories } from '../../data/mockData';
import { apiService } from '../../services/apiService';

// ── Mock Data ────────────────────────────────────────────────────────────────

const initialNotifications = [
  { id: 'N001', title: "New SOS: District 12 - Nguyen Van An needs urgent support", time: '14:32', type: 'sos', read: true },
  { id: 'N002', title: "Complete mission #RES-045 – +40 points", time: '14:10', type: 'reward', read: true },
  { id: 'N003', title: "Rated 5 stars from victim Le Minh Chau", time: '13:55', type: 'rating', read: true },
  { id: 'N004', title: "New warning: Hoc Mon water level rising rapidly - level 3", time: '13:40', type: 'flood', read: true },
  { id: 'N005', title: "Assign SOS-003 to your team", time: '13:20', type: 'sos', read: true },
  ...broadcastAdvisories.map((adv, i) => ({ id: adv.id, title: adv.title, time: adv.sentAt, type: adv.type, read: true })),
];

const conversations = [];

const mockMessages = {};

const allUsers = [];

const notifTypeConfig = {
  sos: { color: 'var(--red-400)', bg: 'rgba(239,68,68,0.08)', icon: AlertTriangle, label: "SOS" },
  reward: { color: 'var(--yellow-400)', bg: 'rgba(234,179,8,0.08)', icon: Zap, label: 'Reward' },
  rating: { color: 'var(--cyan-400)', bg: 'rgba(6,182,212,0.06)', icon: ShieldAlert, label: "Rating" },
  flood: { color: 'var(--orange-400)', bg: 'rgba(249,115,22,0.08)', icon: AlertTriangle, label: "Flood" },
  critical: { color: 'var(--red-400)', bg: 'rgba(239,68,68,0.08)', icon: AlertTriangle, label: "Critical" },
  warning: { color: 'var(--orange-400)', bg: 'rgba(249,115,22,0.06)', icon: AlertTriangle, label: "Warning" },
  info: { color: 'var(--cyan-400)', bg: 'rgba(6,182,212,0.06)', icon: Bell, label: "Information" },
  chat: { color: 'var(--red-400)', bg: 'rgba(239,68,68,0.08)', icon: MessageSquare, label: "Message" },
};

// ── Avatar Helpers ───────────────────────────────────────────────────────────
const renderAvatar = (user, size = 36) => {
  const nameVal = user.name || user.full_name || 'U';
  const initials = nameVal.substring(0, 2).toUpperCase();
  const themeColor = user.role === 'Volunteer' ? '#e1843c' : user.role === 'Workshop' ? '#d9b35c' : '#45b3c0';
  
  const hasAvatar = user.avatar_url && (user.avatar_url.startsWith('http') || user.avatar_url.startsWith('/'));
  
  if (hasAvatar) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundImage: `url(${user.avatar_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        flexShrink: 0
      }} />
    );
  } else {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${themeColor}22`,
        border: `2px solid ${themeColor}44`,
        color: themeColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size === 36 ? '0.72rem' : '0.65rem',
        fontWeight: 800,
        flexShrink: 0
      }}>
        {initials}
      </div>
    );
  }
};

const renderConvAvatar = (conv, size = 40) => {
  const initials = conv.avatar || 'U';
  let themeColor = '#45b3c0';
  if (conv.role === 'Volunteer' || conv.color === 'var(--orange-400)' || conv.color === 'var(--red-400)') {
    themeColor = '#e05d66'; // red/orange theme for volunteer
  } else if (conv.role === 'Workshop' || conv.color === 'var(--yellow-400)') {
    themeColor = '#d9b35c';
  }
  
  const hasAvatar = conv.avatar_url && (conv.avatar_url.startsWith('http') || conv.avatar_url.startsWith('/'));
  
  if (hasAvatar) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundImage: `url(${conv.avatar_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        flexShrink: 0
      }} />
    );
  } else {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${themeColor}22`,
        border: `2px solid ${themeColor}44`,
        color: themeColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size === 40 ? '0.8rem' : size === 36 ? '0.72rem' : '0.6rem',
        fontWeight: 800,
        flexShrink: 0
      }}>
        {initials}
      </div>
    );
  }
};

// ── Component ────────────────────────────────────────────────────────────────

export default function VolunteerNotifications() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState(initialNotifications);
  const [searchChat, setSearchChat] = useState('');
  const [searchPeople, setSearchPeople] = useState('');
  const [chatSidebarMode, setChatSidebarMode] = useState('convs'); // 'convs' | 'find' | 'create-group'
  const [convList, setConvList] = useState(conversations);
  const [activeConv, setActiveConv] = useState(conversations[0]);
  const [messages, setMessages] = useState(mockMessages);
  const [inputText, setInputText] = useState('');
  const [preferences, setPreferences] = useState({
    masterPush: true,
    flood: true,
    sos: true,
    reward: true,
    team: true,
    pushChannel: true,
    emailChannel: false,
    smsChannel: true,
  });
  const messagesEndRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [peopleList, setPeopleList] = useState(allUsers);
  const [volunteersList, setVolunteersList] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState(false);
  const [toast, setToast] = useState(null);
  const wsRef = useRef(null);
  const imageInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv, messages]);

  // Load current user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiService.get('/auth/profile');
        if (res && res.user) {
          setCurrentUser(res.user);
        }
      } catch (err) {
        console.error('Failed to load profile for volunteer chat:', err);
      }
    };
    loadProfile();
  }, []);

  // Load conversation list once currentUser is loaded
  useEffect(() => {
    if (!currentUser) return;
    const loadConversations = async () => {
      try {
        const res = await apiService.get('/chat/conversations');
        if (res.success && res.data) {
          setConvList(res.data);
          if (res.data.length > 0 && !activeConv) {
            setActiveConv(res.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    };
    loadConversations();
  }, [currentUser]);

  // Load message history when activeConv changes
  useEffect(() => {
    if (!currentUser || !activeConv) return;
    const loadHistory = async () => {
      try {
        const res = await apiService.get(`/chat/history?targetId=${activeConv.id}`);
        if (res.success && res.data) {
          setMessages(prev => ({
            ...prev,
            [activeConv.id]: res.data
          }));
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    loadHistory();
  }, [currentUser, activeConv?.id]);

  const activeConvRef = useRef(activeConv);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    const wsUrl = `ws://localhost:5000`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('Volunteer WebSocket connected');
      socket.send(JSON.stringify({
        type: 'register',
        userId: currentUser._id,
        userName: currentUser.full_name,
        role: currentUser.role,
        avatarUrl: currentUser.avatar_url || ''
      }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'chat') {
          const threadId = msg.groupId || msg.senderId;
          const isViewingThisChat = activeTabRef.current === 'chat' && threadId === activeConvRef.current?.id;

          // Add to notifications list if not currently active conversation
          if (!isViewingThisChat) {
            const newNotif = {
              id: `chat-${Date.now()}`,
              threadId: threadId,
              title: `New message from ${msg.senderName}`,
              body: msg.text,
              time: msg.time,
              type: 'chat',
              read: false
            };
            setNotifications(prev => [newNotif, ...prev]);

            setToast({
              id: `chat-toast-${Date.now()}`,
              title: `New message from ${msg.senderName}`,
              body: msg.text,
              senderId: threadId,
              senderName: msg.senderName,
              senderRole: msg.senderRole,
            });
          }
          
          setConvList(convs => {
            const exists = convs.some(c => c.id === threadId);
            if (!exists) {
              const newConv = {
                id: threadId,
                name: msg.senderName,
                role: msg.senderRole || "Volunteer",
                avatar: msg.senderName ? msg.senderName.substring(0, 2).toUpperCase() : "V",
                avatar_url: msg.senderAvatarUrl || '',
                color: 'var(--red-400)',
                lastMsg: msg.text,
                time: msg.time,
                unread: isViewingThisChat ? 0 : 1,
                online: true
              };
              return [newConv, ...convs];
            }
            return convs.map(c => c.id === threadId ? { ...c, lastMsg: msg.text, time: msg.time, avatar_url: msg.senderAvatarUrl || c.avatar_url || '', unread: isViewingThisChat ? 0 : c.unread + 1 } : c);
          });

          setMessages(prev => ({
            ...prev,
            [threadId]: [...(prev[threadId] || []), {
              id: Date.now(),
              from: 'them',
              senderName: msg.senderName,
              senderAvatarUrl: msg.senderAvatarUrl || '',
              text: msg.text,
              time: msg.time
            }]
          }));
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onclose = () => {
      console.log('Volunteer WebSocket disconnected');
    };

    return () => {
      socket.close();
    };
  }, [currentUser]);

  // Debounced search for find friend API
  useEffect(() => {
    if (!searchPeople.trim()) {
      setPeopleList(allUsers);
      return;
    }

    setIsSearchingPeople(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await apiService.get(`/chat/users/search?q=${encodeURIComponent(searchPeople)}`);
        if (res.success && res.data) {
          setPeopleList(res.data);
        }
      } catch (err) {
        console.error('Error querying users search:', err);
      } finally {
        setIsSearchingPeople(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchPeople]);

  // Fetch list of volunteers for group creation
  const fetchVolunteers = async () => {
    setIsLoadingVolunteers(true);
    // Auto-fill a default group name
    const now = new Date();
    const defaultName = `Rescue Group ${now.getDate()}/${now.getMonth() + 1} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    setGroupName(defaultName);
    try {
      const res = await apiService.get('/chat/volunteers');
      if (res.success && res.data) {
        setVolunteersList(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch volunteer list for group:', err);
    } finally {
      setIsLoadingVolunteers(false);
    }
  };

  const toggleSelectVolunteer = (volId) => {
    setSelectedVolunteers(prev =>
      prev.includes(volId) ? prev.filter(id => id !== volId) : [...prev, volId]
    );
  };

  // Create Volunteer Group Chat
  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedVolunteers.length < 2 || !currentUser) return;

    const groupId = `group-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const newGroupConv = {
      id: groupId,
      name: groupName.trim(),
      role: `Group · ${selectedVolunteers.length + 1} people`,
      avatar: groupName.trim().substring(0, 2).toUpperCase(),
      color: 'var(--green-400)',
      lastMsg: `Group created by ${currentUser.full_name}`,
      time: timeStr,
      unread: 0,
      online: false
    };

    setConvList(prev => [newGroupConv, ...prev]);
    setMessages(prev => ({
      ...prev,
      [groupId]: [{
        id: Date.now(),
        from: 'them',
        senderName: 'System',
        text: `Group "${groupName.trim()}" created. Welcome all volunteers!`,
        time: timeStr
      }]
    }));
    setActiveConv(newGroupConv);

    // Broadcast group creation via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        senderId: currentUser._id,
        senderName: currentUser.full_name,
        senderRole: currentUser.role,
        targetId: groupId,
        text: `Group "${groupName.trim()}" created. Welcome all volunteers!`,
        time: timeStr
      }));
    }

    // Reset create group panel
    setChatSidebarMode('convs');
    setGroupName('');
    setSelectedVolunteers([]);
  };

  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAll = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const sendMessage = () => {
    if (!inputText.trim() || !activeConv) return;
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Send through WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentUser) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        senderId: currentUser._id,
        senderName: currentUser.full_name,
        senderRole: currentUser.role,
        targetId: activeConv.id,
        text: inputText.trim(),
        time: timeStr
      }));
    }

    const newMsg = {
      id: Date.now(),
      from: 'me',
      senderName: currentUser?.full_name || 'Me',
      senderAvatarUrl: currentUser?.avatar_url || '',
      text: inputText.trim(),
      time: timeStr,
      read: false,
    };
    setMessages(prev => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] || []), newMsg],
    }));
    setInputText('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeConv) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await apiService.upload('/chat/upload-image', formData, {}, 'POST');
      if (res.success && res.url) {
        sendImageMessage(res.url);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const sendImageMessage = (imageUrl) => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const imageMsgText = `[IMAGE]:${imageUrl}`;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentUser) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        senderId: currentUser._id,
        senderName: currentUser.full_name,
        senderRole: currentUser.role,
        targetId: activeConv.id,
        text: imageMsgText,
        time: timeStr
      }));
    }

    const newMsg = {
      id: Date.now(),
      from: 'me',
      senderName: currentUser?.full_name || 'Me',
      senderAvatarUrl: currentUser?.avatar_url || '',
      text: imageMsgText,
      time: timeStr,
      read: false,
    };
    setMessages(prev => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] || []), newMsg],
    }));
  };

  // Start direct chat with user from directory
  const startChat = (user) => {
    const targetId = user.id || user._id;
    const existingConv = convList.find(c => c.id === targetId);
    if (existingConv) {
      setActiveConv(existingConv);
    } else {
      const newConv = {
        id: targetId,
        name: user.name || user.full_name,
        role: user.role,
        avatar: (user.name || user.full_name).substring(0, 2).toUpperCase(),
        avatar_url: user.avatar_url || '',
        color: user.color || 'var(--red-400)',
        lastMsg: "Start a new conversation",
        time: "Just now",
        unread: 0,
        online: user.online || false,
      };
      setConvList(prev => [newConv, ...prev]);
      setMessages(prev => ({ ...prev, [targetId]: [] }));
      setActiveConv(newConv);
    }
    setChatSidebarMode('convs');
    setSearchPeople('');
  };

  const filteredConvs = convList.filter(c =>
    c.name.toLowerCase().includes(searchChat.toLowerCase())
  );

  const filteredPeople = peopleList;

  const currentMessages = messages[activeConv?.id] || [];

  const chatUnreadCount = convList.reduce((acc, c) => acc + (c.unread || 0), 0);

  // When user switches TO the Chat tab: clear ALL unread counts for all conversations
  useEffect(() => {
    if (activeTab === 'chat') {
      // 1. Zero out all conversation unread counts
      setConvList(prev => prev.map(c => ({ ...c, unread: 0 })));

      // 2. Mark ALL chat notifications as read
      setNotifications(prev => prev.map(n =>
        n.type === 'chat' ? { ...n, read: true } : n
      ));
    }
  }, [activeTab]);

  // When active conversation changes while on Chat tab: mark that specific conv as read in DB
  useEffect(() => {
    if (activeTab === 'chat' && activeConv) {
      const markAsReadDb = async () => {
        try {
          await apiService.post('/chat/read', { targetId: activeConv.id });
        } catch (err) {
          console.error('Failed to mark chat as read in DB:', err);
        }
      };
      markAsReadDb();
    }
  }, [activeConv?.id, activeTab]);

  // Emit unread count changed event for sidebar synchronization
  useEffect(() => {
    const totalUnread = unreadCount + chatUnreadCount;
    localStorage.setItem('total_unread_count', totalUnread);
    window.dispatchEvent(new CustomEvent('unread-count-changed', { detail: { count: totalUnread } }));
  }, [unreadCount, chatUnreadCount]);

  const tabs = [
    { id: 'notifications', label: "Notification", icon: Bell, badge: unreadCount },
    { id: 'chat', label: 'Rescue group chat', icon: MessageSquare, badge: chatUnreadCount },
    { id: 'settings', label: "Customize", icon: Settings },
  ];

  return (
    <div className="page-enter" style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', gap: 0 }}>
      
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 16, flexShrink: 0 }}>
        <h1>Notifications & Chat</h1>
        <p>Real-time notification and rescue group communication center</p>
      </div>

      {/* Tab nav */}
      <div className="tabs-nav" style={{ marginBottom: 16, maxWidth: 540, flexShrink: 0 }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <Icon size={13} />
              {tab.label}
              {tab.badge > 0 && <span className="nav-badge" style={{ marginLeft: 4 }}>{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div className="flex items-center gap-3">
              <div className="section-title">Personal notification center</div>
              {unreadCount > 0 && <span className="badge badge-red" style={{ fontSize: '0.62rem' }}>{unreadCount} unread notification</span>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={markAll}>
              <CheckCircle size={12} /> Mark all as read
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px', display: 'grid', gap: 10, alignContent: 'start' }}>
            {notifications.map(n => {
              const cfg = notifTypeConfig[n.type] || notifTypeConfig.info;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${n.read ? 'var(--border-dim)' : cfg.color + '55'}`,
                    background: n.read ? 'transparent' : cfg.bg,
                    opacity: n.read ? 0.65 : 1,
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.bg, border: `1px solid ${cfg.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Icon size={14} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{n.title}</span>
                      {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={10} /> {n.time}
                      <span className={`badge`} style={{ marginLeft: 8, fontSize: '0.58rem', background: `${cfg.color}18`, color: cfg.color }}>{cfg.label.toUpperCase()}</span>
                    </div>
                  </div>
                  {!n.read && (
                    <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.id)} style={{ flexShrink: 0, fontSize: '0.7rem' }}>
                      <Check size={11} /> Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CHAT TAB — Messenger Style ── */}
      {activeTab === 'chat' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0, overflow: 'hidden', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-subtle)' }}>
          
          {/* Sidebar: Conversation list */}
          <div style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Sidebar header with mode toggle */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-dim)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {chatSidebarMode === 'convs' ? "Message" : chatSidebarMode === 'find' ? "Find users" : "Create Group"}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {chatSidebarMode === 'convs' && (
                    <>
                      <button
                        onClick={() => setChatSidebarMode('find')}
                        className="btn btn-ghost btn-sm"
                        style={{ gap: 4, fontSize: '0.72rem', padding: '4px 8px' }}
                        title="Find friends to chat with"
                      >
                        <UserPlus size={13} /> Find friends
                      </button>
                      <button
                        onClick={() => {
                          setChatSidebarMode('create-group');
                          fetchVolunteers();
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ gap: 4, fontSize: '0.72rem', padding: '4px 8px' }}
                        title="Create volunteer group"
                      >
                        <Users size={13} /> Create Group
                      </button>
                    </>
                  )}
                  {chatSidebarMode !== 'convs' && (
                    <button
                      onClick={() => { setChatSidebarMode('convs'); setSearchChat(''); setSearchPeople(''); setSelectedVolunteers([]); }}
                      className="btn btn-ghost btn-sm"
                      style={{ gap: 4, fontSize: '0.72rem', padding: '4px 8px' }}
                    >
                      <X size={12} /> Close
                    </button>
                  )}
                </div>
              </div>

              {chatSidebarMode === 'convs' && (
                <div className="input-group">
                  <Search size={13} className="input-icon" />
                  <input
                    className="input"
                    placeholder="Find conversations..."
                    value={searchChat}
                    onChange={e => setSearchChat(e.target.value)}
                    style={{ height: 30, fontSize: '0.78rem', paddingLeft: 30 }}
                  />
                </div>
              )}

              {chatSidebarMode === 'find' && (
                <div className="input-group">
                  <Search size={13} className="input-icon" />
                  <input
                    className="input"
                    placeholder="Enter username..."
                    value={searchPeople}
                    onChange={e => setSearchPeople(e.target.value)}
                    autoFocus
                    style={{ height: 30, fontSize: '0.78rem', paddingLeft: 30 }}
                  />
                </div>
              )}

              {chatSidebarMode === 'create-group' && (
                <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      className="input"
                      placeholder="Enter group name..."
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      autoFocus
                      style={{ height: 30, fontSize: '0.78rem', flex: 1 }}
                    />
                    <button
                      className="btn btn-sm"
                      disabled={!groupName.trim() || selectedVolunteers.length < 2}
                      onClick={handleCreateGroup}
                      style={{
                        background: (!groupName.trim() || selectedVolunteers.length < 2) ? 'rgba(239,29,55,0.3)' : 'var(--red-400)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.72rem',
                        padding: '0 10px',
                        height: 30,
                        cursor: (!groupName.trim() || selectedVolunteers.length < 2) ? 'not-allowed' : 'pointer',
                        opacity: (!groupName.trim() || selectedVolunteers.length < 2) ? 0.5 : 1,
                      }}
                    >
                      Create
                    </button>
                  </div>
                  <div style={{ fontSize: '0.65rem', paddingLeft: 2 }}>
                    {!groupName.trim() ? (
                      <span style={{ color: 'var(--orange-400)' }}>⚠ Enter a group name above</span>
                    ) : selectedVolunteers.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>⚠ Select at least 2 people to create a group</span>
                    ) : selectedVolunteers.length === 1 ? (
                      <span style={{ color: 'var(--text-muted)' }}>⚠ Select 1 more person (need at least 2)</span>
                    ) : (
                      <span style={{ color: 'var(--green-400)' }}>✓ {selectedVolunteers.length} people selected — ready to create!</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content: convs or find-people or create-group */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {chatSidebarMode === 'convs' && (
                filteredConvs.map(conv => {
                  const isActive = activeConv?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        background: isActive ? 'rgba(239,29,55,0.06)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--red-400)' : '3px solid transparent',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {renderConvAvatar(conv, 40)}
                        {conv.online && (
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: 'var(--green-400)', border: '2px solid var(--bg-card)' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontWeight: conv.unread > 0 ? 700 : 500, fontSize: '0.83rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.name}</span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', flexShrink: 0 }}>{conv.time}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: conv.unread > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: conv.unread > 0 ? 600 : 400 }}>{conv.lastMsg}</span>
                          {conv.unread > 0 && (
                            <span style={{ minWidth: 18, height: 18, borderRadius: 99, background: 'var(--red-400)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 6 }}>{conv.unread}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}

              {chatSidebarMode === 'find' && (
                <div style={{ padding: '8px 8px', display: 'grid', gap: 4 }}>
                  {isSearchingPeople && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>Searching...</div>
                  )}
                  {!isSearchingPeople && filteredPeople.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No users found</div>
                  )}
                  {!isSearchingPeople && filteredPeople.map(user => {
                    return (
                      <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px', borderRadius: 'var(--r-sm)', background: 'rgba(18,29,40,0.3)', border: '1px solid var(--border-dim)', boxSizing: 'border-box', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {renderAvatar(user, 36)}
                          {user.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: 'var(--green-400)', border: '2px solid var(--bg-card)' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || user.full_name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user.role} · {user.online ? '🟢 Online' : '⚫ Offline'}</div>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => startChat(user)}
                          style={{ flexShrink: 0, padding: '4px 8px', gap: 4, fontSize: '0.7rem', background: 'var(--red-400)', border: 'none', color: '#fff' }}
                        >
                          <MessageSquare size={11} /> Message
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {chatSidebarMode === 'create-group' && (
                <div style={{ padding: '8px 8px', display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: 4, fontWeight: 600 }}>Select volunteers:</div>
                  {isLoadingVolunteers && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>Loading volunteers...</div>
                  )}
                  {!isLoadingVolunteers && volunteersList.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>No other volunteers found</div>
                  )}
                  {!isLoadingVolunteers && volunteersList.map(vol => {
                    const isSelected = selectedVolunteers.includes(vol.id);
                    const hasAvatar = vol.avatar_url && (vol.avatar_url.startsWith('http') || vol.avatar_url.startsWith('/'));
                    return (
                      <div
                        key={vol.id}
                        onClick={() => toggleSelectVolunteer(vol.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-sm)',
                          background: isSelected ? 'rgba(239, 29, 55, 0.08)' : 'rgba(18,29,40,0.3)',
                          border: `1px solid ${isSelected ? 'var(--red-400)' : 'var(--border-dim)'}`,
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Controlled via parent click
                          style={{ accentColor: 'var(--red-400)', cursor: 'pointer' }}
                        />
                        {hasAvatar ? (
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            backgroundImage: `url(${vol.avatar_url})`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            flexShrink: 0, border: `2px solid ${isSelected ? 'var(--red-400)' : 'transparent'}`
                          }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,29,55,0.1)', border: `2px solid ${isSelected ? 'var(--red-400)' : 'rgba(239,29,55,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--red-400)' }}>
                            {vol.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vol.name}</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{vol.online ? '🟢 Online' : '⚫ Offline'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Main chat panel */}
          {activeConv ? (
            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              {/* Chat header */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--bg-card)' }}>
                <div style={{ position: 'relative' }}>
                  {renderConvAvatar(activeConv, 36)}
                  {activeConv.online && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: 'var(--green-400)', border: '2px solid var(--bg-card)' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{activeConv.name}</div>
                  <div style={{ fontSize: '0.68rem', color: activeConv.online ? 'var(--green-400)' : 'var(--text-muted)' }}>
                    {activeConv.online ? "● Active" : '○ Offline'} · {activeConv.role}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentMessages.map(msg => {
                  const isMe = msg.from === 'me';
                  // Render sender avatar per-message (supports both DM and group)
                  const msgAvatarUrl = msg.senderAvatarUrl;
                  const msgInitials = msg.senderName ? msg.senderName.substring(0, 2).toUpperCase() : 'U';
                  const renderMsgAvatar = () => {
                    const hasAv = msgAvatarUrl && (msgAvatarUrl.startsWith('http') || msgAvatarUrl.startsWith('/'));
                    if (hasAv) {
                      return (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          backgroundImage: `url(${msgAvatarUrl})`,
                          backgroundSize: 'cover', backgroundPosition: 'center',
                          flexShrink: 0
                        }} />
                      );
                    }
                    return (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'rgba(239,29,55,0.12)',
                        border: '2px solid rgba(239,29,55,0.3)',
                        color: 'var(--red-400)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.58rem', fontWeight: 800, flexShrink: 0
                      }}>
                        {msgInitials}
                      </div>
                    );
                  };
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                      {!isMe && renderMsgAvatar()}
                      <div style={{ maxWidth: '68%' }}>
                        {!isMe && msg.senderName && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2, paddingLeft: 4 }}>{msg.senderName}</div>
                        )}
                        <div style={{
                          padding: msg.text && msg.text.startsWith('[IMAGE]:') ? 0 : '9px 14px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: msg.text && msg.text.startsWith('[IMAGE]:') ? 'transparent' : (isMe ? 'var(--red-400)' : 'var(--bg-card)'),
                          border: msg.text && msg.text.startsWith('[IMAGE]:') ? 'none' : (isMe ? 'none' : '1px solid var(--border-dim)'),
                          color: isMe ? '#fff' : 'var(--text-primary)',
                          fontSize: '0.85rem',
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                        }}>
                          {msg.text && msg.text.startsWith('[IMAGE]:') ? (
                            <img
                              src={msg.text.substring(8)}
                              alt="Shared"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '240px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                display: 'block'
                              }}
                              onClick={() => window.open(msg.text.substring(8), '_blank')}
                            />
                          ) : (
                            msg.text
                          )}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 3, textAlign: isMe ? 'right' : 'left', paddingInline: 4 }}>
                          {msg.time} {isMe && <Check size={10} style={{ display: 'inline', marginLeft: 2 }} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, background: 'var(--bg-card)', position: 'relative' }}>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="topbar-btn"
                  title="Send photos"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploadingImage}
                  style={{ cursor: 'pointer', opacity: isUploadingImage ? 0.6 : 1 }}
                >
                  {isUploadingImage ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={16} />}
                </button>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="topbar-btn"
                    title="Emoji"
                    onClick={() => setShowEmojiPicker(prev => !prev)}
                    style={{ cursor: 'pointer', color: showEmojiPicker ? 'var(--red-400)' : 'var(--text-muted)' }}
                  >
                    <Smile size={16} />
                  </button>
                  {showEmojiPicker && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      marginBottom: 8,
                      background: 'rgba(10, 16, 26, 0.98)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: 8,
                      width: 180,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: 6,
                      zIndex: 100,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
                    }}>
                      {['😀', '😂', '😊', '😍', '👍', '👎', '❤️', '🔥', '✨', '⭐', '⚡', '🌊', '🚨', '💧', '🚗', '🔧', '🏠', '🌧️', '⛈️', '🙏', '👏', '🙌', '😢', '😭', '😡', '😱', '🤔', '🤫', '🫠', '🤝'].map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setInputText(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            padding: 2,
                            textAlign: 'center',
                            borderRadius: 4,
                            transition: 'background 0.1s'
                          }}
                          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
                          onMouseLeave={e => e.target.style.background = 'none'}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  className="input"
                  placeholder={`Message me ${activeConv.name}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  style={{ flex: 1, borderRadius: 20 }}
                />
                <button
                  className="btn btn-danger btn-sm"
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  style={{ borderRadius: '50%', width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--red-400)', border: 'none' }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Choose a chat to start
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card p-6" style={{ display: 'grid', gap: 14 }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={14} color="var(--red-400)" /> Notification channel
            </div>
            
            <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: preferences.masterPush ? 'rgba(239,29,55,0.06)' : 'rgba(18,29,40,0.5)', border: `1px solid ${preferences.masterPush ? 'var(--red-400)' : 'var(--border-dim)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>All notifications</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Master switch — full on/off</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={preferences.masterPush} onChange={() => setPreferences(p => ({ ...p, masterPush: !p.masterPush }))} />
                <span className="toggle-slider" />
              </label>
            </div>

            {[
              { key: 'pushChannel', label: "Push notifications (Push)", icon: Smartphone, desc: "Receive instant push notifications" },
              { key: 'emailChannel', label: 'Email', icon: Mail, desc: "Receive via email" },
              { key: 'smsChannel', label: 'SMS', icon: Phone, desc: "Receive phone messages" },
            ].map(row => {
              const Icon = row.icon;
              return (
                <div key={row.key} style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: preferences.masterPush ? 1 : 0.4 }}>
                  <div className="flex items-center gap-3">
                    <Icon size={15} color="var(--text-muted)" />
                    <div>
                      <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{row.label}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{row.desc}</div>
                    </div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={preferences[row.key]} onChange={() => setPreferences(p => ({ ...p, [row.key]: !p[row.key] }))} disabled={!preferences.masterPush} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              );
            })}
          </div>

          <div className="card p-6" style={{ display: 'grid', gap: 14 }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={14} color="var(--red-400)" /> Warning type
            </div>
            {[
              { key: 'sos', label: "SOS & Request Rescue", desc: "Emergency notifications", color: 'var(--red-400)' },
              { key: 'flood', label: "Flood warning", desc: "Update water level in warning zone" },
              { key: 'reward', label: "Bonus points & milestones", desc: "Personal rescue achievements" },
              { key: 'team', label: "Groups & Communities", desc: "Rescue group messages" },
            ].map(row => (
              <div key={row.key} style={{ padding: '12px 14px', borderRadius: 'var(--r-sm)', border: `1px solid ${preferences[row.key] ? (row.color || 'var(--cyan-400)') + '44' : 'var(--border-dim)'}`, background: preferences[row.key] ? (row.color || 'var(--cyan-400)') + '08' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', opacity: preferences.masterPush ? 1 : 0.4 }}>
                <div>
                  <div style={{ fontSize: '0.83rem', color: row.color || 'var(--text-primary)', fontWeight: 600 }}>{row.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{row.desc}</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={preferences[row.key]} onChange={() => setPreferences(p => ({ ...p, [row.key]: !p[row.key] }))} disabled={!preferences.masterPush} />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 320,
          background: 'rgba(18, 29, 40, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg), 0 0 20px rgba(239, 29, 55, 0.2)',
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
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(239, 29, 55, 0.1)',
            border: '1px solid rgba(239, 29, 55, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <MessageSquare size={14} color="var(--red-400)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
              {toast.body}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-danger btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.68rem', height: 22, background: 'var(--red-400)', border: 'none', color: '#fff' }}
                onClick={() => {
                  setActiveTab('chat');
                  const targetConv = convList.find(c => c.id === toast.senderId);
                  if (targetConv) {
                    setActiveConv(targetConv);
                  } else {
                    const newConv = {
                      id: toast.senderId,
                      name: toast.senderName,
                      role: toast.senderRole || 'Volunteer',
                      avatar: toast.senderName.substring(0, 2).toUpperCase(),
                      color: 'var(--red-400)',
                      lastMsg: toast.body,
                      time: 'Just now',
                      unread: 0,
                      online: true
                    };
                    setConvList(prev => [newConv, ...prev]);
                    setActiveConv(newConv);
                  }
                  setToast(null);
                }}
              >
                Reply
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.68rem', height: 22 }}
                onClick={() => setToast(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
