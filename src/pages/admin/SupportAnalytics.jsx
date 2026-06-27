import React, { useState } from 'react';
import {
  HeadphonesIcon, MessageCircle, FileText, Download, Send,
  Clock, CheckCircle, AlertTriangle, X, ChevronRight,
  BarChart2, Activity, FileDown, Loader,
  TrendingUp, Users, Cpu, Droplets,
} from 'lucide-react';
import { supportTickets } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const dailyTickets = [
  { day: 'T2', open: 12, resolved: 9 },
  { day: 'T3', open: 18, resolved: 15 },
  { day: 'T4', open: 8, resolved: 11 },
  { day: 'T5', open: 22, resolved: 19 },
  { day: 'T6', open: 15, resolved: 12 },
  { day: 'T7', open: 6, resolved: 8 },
  { day: 'CN', open: 4, resolved: 5 },
];

const systemLogs = [
  { time: '14:39:02', level: 'INFO', service: 'IoT-Gateway', message: 'Received data from 248 stations successfully' },
  { time: '14:38:55', level: 'WARN', service: 'Alert-Engine', message: 'Water level threshold exceeded at QU12-001: 91cm' },
  { time: '14:38:12', level: 'INFO', service: 'API-Server', message: 'User authentication successful: USR-1203' },
  { time: '14:37:48', level: 'ERROR', service: 'IoT-Gateway', message: 'Connection lost to device IOT-TD-012, retrying...' },
  { time: '14:37:20', level: 'INFO', service: 'Report-Processor', message: 'AI moderation completed for RPT-2024-0891: score=94%' },
  { time: '14:36:55', level: 'WARN', service: 'Push-Notify', message: 'High queue depth: 1,204 pending notifications' },
  { time: '14:36:30', level: 'INFO', service: 'Database', message: 'Backup completed: 2.3GB, duration: 4m 12s' },
  { time: '14:35:18', level: 'INFO', service: 'Alert-Engine', message: 'Broadcast advisory sent to 12,450 users in Quan 12' },
];

function PriorityBadge({ priority }) {
  switch (priority) {
    case 'high': return <span className="badge badge-red">🔴 High</span>;
    case 'medium': return <span className="badge badge-orange">🟡 Medium</span>;
    case 'low': return <span className="badge badge-green">🟢 Low</span>;
    default: return null;
  }
}

function CategoryBadge({ category }) {
  const map = {
    technical: { label: "⚙️ Technical", cls: 'badge-blue' },
    account: { label: "👤 Account", cls: 'badge-cyan' },
    data: { label: "📊 Data", cls: 'badge-yellow' },
    hardware: { label: "🔧 Hardware", cls: 'badge-orange' },
  };
  const cfg = map[category] || { label: category, cls: 'badge-gray' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function TicketModal({ ticket, onClose }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!reply.trim()) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setTimeout(onClose, 1500); }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{ticket.id}: {ticket.subject}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Posted by {ticket.user} · {ticket.time}</div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 16 }}>
          {/* Category & Priority */}
          <div className="flex gap-3">
            <PriorityBadge priority={ticket.priority} />
            <CategoryBadge category={ticket.category} />
            {ticket.status === 'open' && <span className="badge badge-orange">Open</span>}
            {ticket.status === 'in_progress' && <span className="badge badge-blue">Processing</span>}
            {ticket.status === 'resolved' && <span className="badge badge-green">Resolved</span>}
          </div>

          {/* User info */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--border-subtle)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <div style={{ marginBottom: 4 }}><strong style={{ color: 'var(--text-primary)' }}>Sender:</strong> {ticket.user}</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {ticket.email}</div>
          </div>

          {/* Message */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Content</div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {ticket.message}
            </div>
          </div>

          {/* Reply */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Feedback</div>
            <textarea
              className="input"
              placeholder="Enter technical feedback for users..."
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={4}
            />
          </div>

          {sent && <div style={{ color: 'var(--green-400)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={15} /> Feedback sent!</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={sending || !reply.trim()}>
            {sending ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Sending...</> : <><Send size={13} /> Send feedback</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExportSkeleton({ label, onDone }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); setTimeout(() => setDone(false), 2000); }, 2500);
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between" style={{ marginBottom: loading ? 16 : 0 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleExport}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {loading ? (
            <><div className="spinner" style={{ width: 13, height: 13 }} /> Exporting...</>
          ) : done ? (
            <><CheckCircle size={13} color="var(--green-400)" /> Done!</>
          ) : (
            <><FileDown size={13} /> Export files</>
          )}
        </button>
      </div>

      {/* Skeleton loading */}
      {loading && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
        </div>
      )}
    </div>
  );
}

export default function SupportAnalytics() {
  const [tickets, setTickets] = useState(supportTickets);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('tickets');
  const [logSearch, setLogSearch] = useState('');

  const filteredLogs = systemLogs.filter(l =>
    logSearch === '' ||
    l.message.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.service.toLowerCase().includes(logSearch.toLowerCase())
  );

  const resolveTicket = (id) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
    setSelectedTicket(null);
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Systems Support & Analysis</h1>
        <p>Handle technical tickets, produce analysis reports and monitor system logs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Tickets Open", value: tickets.filter(t => t.status === 'open').length, color: 'var(--orange-400)' },
          { label: "Processing", value: tickets.filter(t => t.status === 'in_progress').length, color: 'var(--blue-400)' },
          { label: "Resolved", value: tickets.filter(t => t.status === 'resolved').length, color: 'var(--green-400)' },
          { label: "Average time", value: '2.4h', color: 'var(--cyan-400)', isText: true },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div style={{ fontSize: s.isText ? '1.5rem' : '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 500 }}>
        <button className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
          <HeadphonesIcon size={13} /> Tickets ({tickets.filter(t => t.status !== 'resolved').length})
        </button>
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <BarChart2 size={13} /> Analysis
        </button>
        <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <Activity size={13} /> System Log
        </button>
        <button className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}>
          <Download size={13} /> Export report
        </button>
      </div>

      {/* TICKETS */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card" style={{ padding: '16px 20px', borderLeft: `3px solid ${ticket.status === 'resolved' ? 'var(--green-500)' : ticket.priority === 'high' ? 'var(--red-500)' : 'var(--border-default)'}` }}>
              <div className="flex items-start justify-between gap-4">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ticket.id}</span>
                    <PriorityBadge priority={ticket.priority} />
                    <CategoryBadge category={ticket.category} />
                    {ticket.status === 'open' && <span className="badge badge-orange">Open</span>}
                    {ticket.status === 'in_progress' && <span className="badge badge-blue">Processing</span>}
                    {ticket.status === 'resolved' && <span className="badge badge-green">Resolved</span>}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      <Clock size={11} style={{ display: 'inline' }} /> {ticket.time}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 4 }}>{ticket.subject}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    {ticket.user} · {ticket.email}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {ticket.message}
                  </div>
                </div>
                <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTicket(ticket)}>
                    <MessageCircle size={13} /> Feedback
                  </button>
                  {ticket.status !== 'resolved' && (
                    <button className="btn btn-success btn-sm" onClick={() => resolveTicket(ticket.id)}>
                      <CheckCircle size={13} /> Mark done
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="grid grid-2">
            {/* Weekly tickets chart */}
            <div className="card p-6">
              <div className="section-title" style={{ marginBottom: 16 }}>Tickets weekly</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyTickets} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(37,99,235,0.1)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111d33', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 8 }} />
                  <Bar dataKey="open" name="Open" fill="rgba(249,115,22,0.7)" radius={[4,4,0,0]} maxBarSize={20} />
                  <Bar dataKey="resolved" name="Handle" fill="rgba(34,197,94,0.7)" radius={[4,4,0,0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* System uptime */}
            <div className="card p-6">
              <div className="section-title" style={{ marginBottom: 16 }}>System Uptime (7 days)</div>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { name: 'API Server', uptime: 99.8, color: 'var(--green-500)' },
                  { name: 'IoT Gateway', uptime: 98.2, color: 'var(--blue-primary)' },
                  { name: 'Push Notifications', uptime: 97.5, color: 'var(--cyan-500)' },
                  { name: 'AI Engine', uptime: 99.1, color: 'var(--orange-500)' },
                  { name: 'Database', uptime: 100, color: 'var(--green-500)' },
                ].map(s => (
                  <div key={s.name}>
                    <div className="flex justify-between" style={{ marginBottom: 5 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.name}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.uptime}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.uptime}%`, background: s.color, borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KPI summary */}
          <div className="grid grid-4">
            {[
              { icon: Users, label: "DAU (Today)", value: '1,247', trend: '+8%', color: '#1a6cff' },
              { icon: TrendingUp, label: "Report / date", value: '234', trend: '+15%', color: '#22c55e' },
              { icon: Cpu, label: 'CPU Usage', value: '34%', trend: '-5%', color: '#f97316' },
              { icon: Droplets, label: "Flooded spot today", value: '89', trend: '+45%', color: '#ef4444' },
            ].map(k => {
              const Icon = k.icon;
              const isUp = k.trend.startsWith('+');
              return (
                <div key={k.label} className="card p-5">
                  <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${k.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={k.color} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{k.label}</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{k.value}</div>
                  <div style={{ fontSize: '0.75rem', color: isUp ? 'var(--green-400)' : 'var(--red-400)', fontWeight: 600, marginTop: 4 }}>{k.trend} compared to yesterday</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LOGS */}
      {activeTab === 'logs' && (
        <div>
          <div className="input-group" style={{ maxWidth: 320, marginBottom: 16 }}>
            <Activity size={15} className="input-icon" />
            <input className="input" placeholder="Search in logs..." value={logSearch} onChange={e => setLogSearch(e.target.value)} />
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="live-indicator"><div className="live-dot" />LIVE LOG</div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', maxHeight: 420, overflow: 'auto' }}>
              {filteredLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '9px 18px',
                    borderBottom: '1px solid rgba(30,58,138,0.1)',
                    alignItems: 'flex-start',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,108,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: '0.75rem' }}>{log.time}</span>
                  <span style={{
                    flexShrink: 0,
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: log.level === 'ERROR' ? 'rgba(239,68,68,0.15)' : log.level === 'WARN' ? 'rgba(249,115,22,0.15)' : 'rgba(34,197,94,0.1)',
                    color: log.level === 'ERROR' ? 'var(--red-400)' : log.level === 'WARN' ? 'var(--orange-400)' : 'var(--green-400)',
                  }}>
                    {log.level}
                  </span>
                  <span style={{ color: 'var(--cyan-400)', flexShrink: 0, fontSize: '0.75rem' }}>[{log.service}]</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.4 }}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXPORT */}
      {activeTab === 'export' && (
        <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
          <div className="alert-banner info">
            <Download size={16} color="var(--blue-400)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              All reports are exported as PDF or Excel files and will be sent to admin email.
            </div>
          </div>

          {[
            "Flood Summary Report (PDF)",
            "User List (Excel)",
            "IoT Device Log - 30 days (CSV)",
            "Community Report Statistics (Excel)",
            "Support Ticket Analysis (PDF)",
            "System Uptime Report (PDF)",
          ].map((label) => (
            <ExportSkeleton key={label} label={label} />
          ))}
        </div>
      )}

      {selectedTicket && <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
    </div>
  );
}
