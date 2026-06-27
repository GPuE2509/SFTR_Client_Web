import React, { useState } from 'react';
import {
  Wrench, MapPin, Clock, CheckCircle, Phone,
  Filter, ChevronRight, XCircle, Navigation, User,
  AlertTriangle, Send, MessageSquare,
} from 'lucide-react';

const MECHANICS = ["Workshop Staff Tuan", "Workshop Staff Hung", "Workshop Staff Long"];

const initialTasks = [
  {
    id: 'WO-041', customer: "Nguyen Van An", phone: '0901234567',
    service: "Motorcycle flooded - dry engine",
    location: "District 12 – 45 To Ky", distance: '1.2 km', eta: "8 minutes",
    priority: 'urgent', status: 'pending', time: '14:32',
    mechanic: null, note: "Passenger was stuck in the middle of the road, the car did not start.",
  },
  {
    id: 'WO-042', customer: "Tran Thi Binh", phone: '0912345678',
    service: "Change electric bike tires",
    location: "Hoc Mon – Nguyen Van Qua", distance: '3.5 km', eta: "15 minutes",
    priority: 'normal', status: 'assigned', time: '14:28',
    mechanic: "Workshop Staff Tuan", note: "The front tire is flat and needs to be replaced with a 16 inch tire.",
  },
  {
    id: 'WO-043', customer: "Le Minh Chau", phone: '0923456789',
    service: "Check motorbike battery & electricity",
    location: "Thu Duc – Go Dua", distance: '4.8 km', eta: "18 minutes",
    priority: 'urgent', status: 'pending', time: '14:15',
    mechanic: null, note: "The battery can die after the car is flooded.",
  },
  {
    id: 'WO-044', customer: "Pham Quoc Dung", phone: '0934567890',
    service: "Tow the car to the workshop",
    location: "Go Vap – Nguyen Kiem", distance: '6.1 km', eta: "22 minutes",
    priority: 'normal', status: 'in_progress', time: '13:55',
    mechanic: "Workshop Staff Hung", note: "Honda car won't start, needs to be towed back for repair.",
  },
  {
    id: 'WO-045', customer: "Dinh Thi Hoa", phone: '0945678901',
    service: "Periodic maintenance",
    location: "Binh Thanh – No Trang Long", distance: '0.8 km', eta: "5 minutes",
    priority: 'normal', status: 'completed', time: '13:40',
    mechanic: "Workshop Staff Long", note: "Change oil + check brakes.", rating: 5,
  },
];

const statusBadge = {
  pending:     <span className="badge badge-orange" style={{ fontSize: '0.62rem' }}>Waiting for assignment</span>,
  assigned:    <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>Assigned</span>,
  in_progress: <span className="badge" style={{ fontSize: '0.62rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Processing</span>,
  completed:   <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>Complete</span>,
};

const trackingSteps = [
  { time: '14:32', label: "The customer sent a request to repair the car", done: true },
  { time: '14:34', label: "The workshop confirms & assigns workers", done: true },
  { time: '14:36', label: "The Workshop Staff is moving to the customer", done: true, active: true },
  { time: '14:55', label: "The Workshop Staff arrived and inspected the car", done: false },
  { time: '15:20', label: "Complete repair", done: false },
  { time: '15:25', label: "Guest confirms & pays", done: false },
];

export default function WorkshopTasks() {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [assignModal, setAssignModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter);

  const assign = (taskId, mechanic) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'assigned', mechanic } : t));
    if (selected?.id === taskId) setSelected(prev => ({ ...prev, status: 'assigned', mechanic }));
    setAssignModal(null);
  };

  const startTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'in_progress' } : t));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'in_progress' }));
  };

  const completeTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'completed' }));
  };

  const counts = { pending: tasks.filter(t => t.status === 'pending').length, assigned: tasks.filter(t => t.status === 'assigned').length, in_progress: tasks.filter(t => t.status === 'in_progress').length, completed: tasks.filter(t => t.status === 'completed').length };

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Manage vehicle repair orders</h1>
        <p>Receive, assign Workshop Staff and monitor the status of mobile vehicle repair orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Waiting for assignment", value: counts.pending, color: '#f59e0b', anim: true },
          { label: "Assigned", value: counts.assigned, color: 'var(--blue-400)' },
          { label: "Processing", value: counts.in_progress, color: 'var(--cyan-400)' },
          { label: "Completed Hanoi", value: counts.completed, color: 'var(--green-400)' },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)', ...(s.anim ? { animation: 'blink 2s ease-in-out infinite' } : {}) }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 350 }}>
        <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          <Wrench size={13} /> Menu list
        </button>
        <button className={`tab-btn ${activeTab === 'reply' ? 'active' : ''}`} onClick={() => setActiveTab('reply')}>
          <MessageSquare size={13} /> Guest feedback
        </button>
      </div>

      {/* Tab: List */}
      {activeTab === 'list' && (
        <div className="grid" style={{ gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
          <div>
            {/* Filters */}
            <div className="flex items-center gap-3" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
              <Filter size={15} color="var(--text-muted)" />
              {[
                { key: 'all', label: "All" },
                { key: 'pending', label: "Waiting for assignment" },
                { key: 'assigned', label: "Assigned" },
                { key: 'in_progress', label: "Processing" },
                { key: 'completed', label: "Complete" },
              ].map(f => (
                <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {filtered.map(task => (
                <div key={task.id} className="card" style={{ padding: '14px 18px', borderLeft: task.priority === 'urgent' ? '3px solid #f59e0b' : '3px solid var(--border-default)', cursor: 'pointer', background: selected?.id === task.id ? 'rgba(217,119,6,0.06)' : undefined, transition: 'background 0.15s' }} onClick={() => setSelected(task)}>
                  <div className="flex items-start justify-between gap-3">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 5 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{task.id}</span>
                        {statusBadge[task.status]}
                        {task.priority === 'urgent' && <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(217,119,6,0.15)', color: '#f59e0b', border: 'none' }}>URGENT</span>}
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{task.time}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 2 }}>{task.service}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <User size={10} style={{ display: 'inline', marginRight: 3 }} />{task.customer} · <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />{task.location} · {task.distance}
                      </div>
                      {task.mechanic && <div style={{ fontSize: '0.72rem', color: 'var(--green-400)', marginTop: 3 }}>✓ Workers: {task.mechanic}</div>}
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="card p-6" style={{ position: 'sticky', top: 20 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="section-title">Single detail</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><XCircle size={14} /></button>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ padding: '10px 14px', background: 'rgba(217,119,6,0.06)', borderRadius: 'var(--r-md)', border: '1px solid rgba(217,119,6,0.2)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 4 }}>{selected.id}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>"{selected.note}"</div>
                </div>
                {[
                  { icon: Wrench, label: "Service", value: selected.service },
                  { icon: User, label: "Client", value: selected.customer },
                  { icon: Phone, label: "Phone number", value: selected.phone },
                  { icon: MapPin, label: "Location", value: selected.location },
                  { icon: Navigation, label: "Distance", value: `${selected.distance} (ETA ${selected.eta})` },
                  { icon: Clock, label: "Set time", value: selected.time },
                ].map(row => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-start gap-3">
                      <Icon size={14} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 1 }}>{row.label}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</div>
                      </div>
                    </div>
                  );
                })}
                {selected.mechanic && (
                  <div className="alert-banner" style={{ margin: 0, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <CheckCircle size={14} color="var(--green-400)" />
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>Assignment: <strong>{selected.mechanic}</strong></div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-dim)', display: 'grid', gap: 8 }}>
                  {selected.status === 'pending' && (
                    <button className="btn btn-sm" style={{ background: 'rgba(217,119,6,0.15)', color: '#f59e0b', border: '1px solid rgba(217,119,6,0.3)' }} onClick={() => setAssignModal(selected.id)}>
                      <User size={13} /> Assigning workers
                    </button>
                  )}
                  {selected.status === 'assigned' && (
                    <button className="btn btn-primary btn-sm" onClick={() => startTask(selected.id)}>
                      <Navigation size={13} /> Start moving
                    </button>
                  )}
                  {(selected.status === 'assigned' || selected.status === 'in_progress') && (
                    <button className="btn btn-success btn-sm" onClick={() => completeTask(selected.id)}>
                      <CheckCircle size={13} /> Confirm completion
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm"><Phone size={12} /> Call guests</button>
                </div>

                {/* Assign Modal */}
                {assignModal === selected.id && (
                  <div style={{ padding: '12px', background: 'rgba(217,119,6,0.06)', borderRadius: 'var(--r-md)', border: '1px solid rgba(217,119,6,0.25)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>Choose an assigner:</div>
                    {MECHANICS.map(m => (
                      <button key={m} className="btn btn-ghost btn-sm" style={{ marginRight: 6, marginBottom: 6 }} onClick={() => assign(selected.id, m)}>
                        {m}
                      </button>
                    ))}
                    <button className="btn btn-ghost btn-sm" onClick={() => setAssignModal(null)}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Reply */}
      {activeTab === 'reply' && (
        <div className="grid grid-2" style={{ gap: 16 }}>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Customer feedback</div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
              {[
                { customer: "Nguyen Van An", review: "Workshop Staff arrived quickly, handled professionally. Very satisfied!", rating: 5, time: '14:50', taskId: 'WO-040' },
                { customer: "Tran Thi Binh", review: "The price is a bit high but the service is good and the Workshop Staff are enthusiastic.", rating: 4, time: '13:20', taskId: 'WO-038' },
              ].map((rev, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: 'rgba(61,125,176,0.04)' }}>
                  <div className="flex items-start justify-between" style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{rev.customer} – {rev.taskId}</div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= rev.rating ? '#f59e0b' : 'var(--border-default)', fontSize: '0.85rem' }}>★</span>)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8, fontStyle: 'italic' }}>"{rev.review}"</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 10 }}><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{rev.time}</div>
                  <textarea className="input" rows={2} placeholder="Customer feedback..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                  <button className="btn btn-sm" style={{ marginTop: 8, background: 'rgba(217,119,6,0.15)', color: '#f59e0b', border: '1px solid rgba(217,119,6,0.3)' }} onClick={() => { setReplySent(true); setReplyText(''); setTimeout(() => setReplySent(false), 2000); }}>
                    <Send size={12} /> Send feedback
                  </button>
                  {replySent && <div style={{ fontSize: '0.75rem', color: 'var(--green-400)', marginTop: 4, fontWeight: 600 }}><CheckCircle size={11} style={{ display: 'inline', marginRight: 3 }} />Sent</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Feedback instructions</div>
            {[
              "Respond within 24 hours to maintain high scores.",
              "Thank customers for good reviews.",
              "Explain clearly if there is a complaint about price or service.",
              "We invite you to return to the workshop next time.",
              "Don't argue harshly - resolve peacefully.",
            ].map((tip, i) => (
              <div key={i} className="alert-banner info" style={{ margin: '0 0 8px' }}>
                <AlertTriangle size={13} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
