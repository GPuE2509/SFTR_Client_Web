import React, { useState, useRef, useEffect } from 'react';
import {
  Bell, CheckCircle, MessageSquare, Search, Send, Clock,
  Mail, Smartphone, ShieldCheck, Settings, Circle, Check,
  Image as ImageIcon, Smile, Phone, Video, MoreHorizontal,
  AlertTriangle, Zap, Users, ChevronRight, X, UserPlus, UserCheck, Loader
} from 'lucide-react';
import { broadcastAdvisories } from '../../data/mockData';
import { apiService } from '../../services/apiService';

// ── Mock Data ────────────────────────────────────────────────────────────────

const initialNotifications = [
  { id: 'n1', title: "Flood warning in District 12", body: "The water level at station IOT-QU12-001 has exceeded the threshold of 80cm", time: '14:32', type: 'critical', read: true },
  { id: 'n2', title: "SOS has been received", body: "Your rescue request has been accepted by a volunteer", time: '13:58', type: 'sos', read: true },
  { id: 'n3', title: "The report has been authenticated", body: "Your report of flooding in Hoc Mon was confirmed by 12 people", time: '11:20', type: 'info', read: true },
  { id: 'n4', title: "Trigger warning zone", body: "The flooding event occurred in the \"Home\" zone you set up", time: '10:05', type: 'warning', read: true },
  ...broadcastAdvisories.slice(0, 3).map((adv, i) => ({
    id: `adv-${i}`,
    title: adv.title,
    body: "Notifications from the FloodSense system",
    time: adv.sentAt,
    type: adv.type,
    read: true,
  })),
];

const conversations = [];

const mockMessages = {};

// ── Mock user directory for search ────────────────────────────────────────────
const allUsers = [];

const notifTypeConfig = {
  critical: { color: 'var(--red-400)', bg: 'rgba(239,68,68,0.08)', icon: AlertTriangle, label: "Urgent" },
  sos: { color: 'var(--orange-400)', bg: 'rgba(249,115,22,0.08)', icon: Zap, label: 'SOS' },
  warning: { color: 'var(--orange-400)', bg: 'rgba(249,115,22,0.06)', icon: AlertTriangle, label: "Warning" },
  info: { color: 'var(--cyan-400)', bg: 'rgba(6,182,212,0.06)', icon: Bell, label: "Information" },
  chat: { color: 'var(--cyan-400)', bg: 'rgba(6,182,212,0.08)', icon: MessageSquare, label: "Message" },
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
    themeColor = '#e1843c';
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

export default function UserNotifications() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState(initialNotifications);
  const [searchChat, setSearchChat] = useState('');
  const [searchPeople, setSearchPeople] = useState('');
  const [chatSidebarMode, setChatSidebarMode] = useState('convs'); // 'convs' | 'find'
  const [convList, setConvList] = useState(conversations);
  const [activeConv, setActiveConv] = useState(conversations[0]);
  const [messages, setMessages] = useState(mockMessages);
  const [inputText, setInputText] = useState('');
  const [preferences, setPreferences] = useState({
    masterPush: true,
    flood: true,
    sos: true,
    community: true,
    pushChannel: true,
    emailChannel: false,
    smsChannel: false,
  });
  const messagesEndRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [peopleList, setPeopleList] = useState(allUsers);
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);
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
        console.error('Failed to load profile for user chat:', err);
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

  // Handle pending chat target from other pages (e.g. clicking Chat on a workshop detail)
  useEffect(() => {
    if (!currentUser) return;
    const pendingStr = localStorage.getItem('pending_chat_user');
    if (pendingStr) {
      try {
        const pendingUser = JSON.parse(pendingStr);
        localStorage.removeItem('pending_chat_user');
        setActiveTab('chat');
        startChat(pendingUser);
      } catch (err) {
        console.error('Failed to parse pending chat user:', err);
      }
    }
  }, [currentUser]); // Only depends on currentUser — startChat handles both existing and new convs


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

    // Use current location origin to determine WS port, default to localhost:5000
    const wsUrl = `ws://localhost:5000`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('User WebSocket connected');
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
          
          // Create conversation in list if not exists
          setConvList(convs => {
            const exists = convs.some(c => c.id === threadId);
            if (!exists) {
              const newConv = {
                id: threadId,
                name: msg.senderName,
                role: msg.senderRole || "Member",
                avatar: msg.senderName ? msg.senderName.substring(0, 2).toUpperCase() : "U",
                avatar_url: msg.senderAvatarUrl || '',
                color: 'var(--cyan-400)',
                lastMsg: msg.text,
                time: msg.time,
                unread: isViewingThisChat ? 0 : 1,
                online: true
              };
              return [newConv, ...convs];
            }
            return convs.map(c => c.id === threadId ? { ...c, lastMsg: msg.text, time: msg.time, avatar_url: msg.senderAvatarUrl || c.avatar_url || '', unread: isViewingThisChat ? 0 : c.unread + 1 } : c);
          });

          // Add message to thread
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
      console.log('User WebSocket disconnected');
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

  // Start a new chat with a user from directory
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
        color: user.color || 'var(--cyan-400)',
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
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: chatUnreadCount },
    { id: 'settings', label: "Customize", icon: Settings },
  ];

  return (
    <div className="page-enter" style={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', gap: 0 }}>
      
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 16, flexShrink: 0 }}>
        <h1>Notifications & Chat</h1>
        <p>Personal notification center and real-time chat</p>
      </div>

      {/* Tab nav */}
      <div className="tabs-nav" style={{ marginBottom: 16, maxWidth: 480, flexShrink: 0 }}>
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
              {unreadCount > 0 && <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>{unreadCount} haven't read yet</span>}
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
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>{n.body}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={10} /> {n.time}
                      <span className={`badge badge-${n.type === 'critical' ? 'red' : n.type === 'sos' ? 'orange' : 'cyan'}`} style={{ fontSize: '0.58rem', marginLeft: 6 }}>{cfg.label}</span>
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
                  {chatSidebarMode === 'convs' ? "Message" : "Find users"}
                </div>
                <button
                  onClick={() => { setChatSidebarMode(m => m === 'convs' ? 'find' : 'convs'); setSearchChat(''); setSearchPeople(''); }}
                  className="btn btn-ghost btn-sm"
                  style={{ gap: 4, fontSize: '0.72rem', padding: '4px 8px' }}
                  title={chatSidebarMode === 'convs' ? "Find friends to chat with" : "Come back"}
                >
                  {chatSidebarMode === 'convs' ? <><UserPlus size={13} /> Find friends</> : <><X size={12} /> Close</>}
                </button>
              </div>

              {chatSidebarMode === 'convs' ? (
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
              ) : (
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
            </div>

            {/* Content: convs or find-people */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {chatSidebarMode === 'convs' ? (
                filteredConvs.map(conv => {
                  const isActive = activeConv?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        background: isActive ? 'rgba(6,182,212,0.1)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--cyan-400)' : '3px solid transparent',
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
                            <span style={{ minWidth: 18, height: 18, borderRadius: 99, background: 'var(--cyan-400)', color: 'var(--bg-app)', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 6 }}>{conv.unread}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                /* ── FIND PEOPLE PANEL ── */
                <div style={{ padding: '8px 8px', display: 'grid', gap: 6 }}>
                  {filteredPeople.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No users found</div>
                  )}
                  {filteredPeople.map(user => {
                    return (
                      <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px', borderRadius: 'var(--r-sm)', background: 'rgba(18,29,40,0.3)', border: '1px solid var(--border-dim)', boxSizing: 'border-box', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {renderAvatar(user, 36)}
                          {user.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: 'var(--green-400)', border: '2px solid var(--bg-card)' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user.role} · {user.online ? '🟢 Online' : '⚫ Offline'}</div>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => startChat(user)}
                          style={{ flexShrink: 0, padding: '4px 8px', gap: 4, fontSize: '0.7rem' }}
                        >
                          <MessageSquare size={11} /> Message
                        </button>
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
                  // Render sender avatar per-message
                  const msgAvatarUrl = msg.senderAvatarUrl;
                  const msgInitials = msg.senderName
                    ? msg.senderName.substring(0, 2).toUpperCase()
                    : (activeConv.avatar || 'U');
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
                    // Fallback: initials with theme color
                    let themeColor = '#45b3c0';
                    if (activeConv.role === 'Volunteer') themeColor = '#e1843c';
                    else if (activeConv.role === 'Workshop') themeColor = '#d9b35c';
                    return (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: `${themeColor}22`,
                        border: `2px solid ${themeColor}44`,
                        color: themeColor,
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
                        <div style={{
                          padding: msg.text && msg.text.startsWith('[IMAGE]:') ? 0 : '9px 14px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: msg.text && msg.text.startsWith('[IMAGE]:') ? 'transparent' : (isMe ? 'var(--cyan-400)' : 'var(--bg-card)'),
                          border: msg.text && msg.text.startsWith('[IMAGE]:') ? 'none' : (isMe ? 'none' : '1px solid var(--border-dim)'),
                          color: isMe ? 'var(--bg-app)' : 'var(--text-primary)',
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
                    style={{ cursor: 'pointer', color: showEmojiPicker ? 'var(--cyan-400)' : 'var(--text-muted)' }}
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
                  className="btn btn-primary btn-sm"
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  style={{ borderRadius: '50%', width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
          {/* Master toggle + channel */}
          <div className="card p-6" style={{ display: 'grid', gap: 14 }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={14} color="var(--cyan-400)" /> Notification channel
            </div>
            
            {/* Master toggle */}
            <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: preferences.masterPush ? 'rgba(6,182,212,0.06)' : 'rgba(18,29,40,0.5)', border: `1px solid ${preferences.masterPush ? 'var(--cyan-400)' : 'var(--border-dim)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

          {/* Notification types */}
          <div className="card p-6" style={{ display: 'grid', gap: 14 }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={14} color="var(--cyan-400)" /> Warning type
            </div>
            {[
              { key: 'flood', label: "Flooding & warnings", desc: "Notification when there is a flooding event in the area", icon: AlertTriangle, color: 'var(--cyan-400)' },
              { key: 'sos', label: "SOS & Rescue", desc: "Status of your rescue request", icon: Zap, color: 'var(--orange-400)' },
              { key: 'community', label: "Community & Forum", desc: "Comment, like and respond to posts", icon: Users, color: 'var(--green-400)' },
            ].map(row => {
              const Icon = row.icon;
              return (
                <div key={row.key} style={{ padding: '12px 14px', borderRadius: 'var(--r-sm)', border: `1px solid ${preferences[row.key] ? row.color + '44' : 'var(--border-dim)'}`, background: preferences[row.key] ? row.color + '08' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', opacity: preferences.masterPush ? 1 : 0.4 }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: row.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} color={row.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 600 }}>{row.label}</div>
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

            <div className="alert-banner info" style={{ marginTop: 4 }}>
              <Bell size={14} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Receive only necessary notifications to help reduce noise and improve your experience.
              </span>
            </div>
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
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(69, 179, 192, 0.1)',
            border: '1px solid rgba(69, 179, 192, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <MessageSquare size={14} color="var(--cyan-400)" />
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
                className="btn btn-primary btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.68rem', height: 22 }}
                onClick={() => {
                  setActiveTab('chat');
                  const targetConv = convList.find(c => c.id === toast.senderId);
                  if (targetConv) {
                    setActiveConv(targetConv);
                  } else {
                    const newConv = {
                      id: toast.senderId,
                      name: toast.senderName,
                      role: toast.senderRole || 'Member',
                      avatar: toast.senderName.substring(0, 2).toUpperCase(),
                      color: 'var(--cyan-400)',
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
