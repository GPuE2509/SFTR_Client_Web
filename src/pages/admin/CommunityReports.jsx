import React, { useState } from 'react';
import {
  Search, Filter, CheckCircle, XCircle, Eye, Megaphone,
  Bot, AlertTriangle, Clock, ChevronRight, Send, X,
  MapPin, Camera, ThumbsUp, ThumbsDown, Radio,
} from 'lucide-react';
import { broadcastAdvisories } from '../../data/mockData';

function AiScoreBadge({ score, verdict }) {
  const color = score >= 80 ? 'var(--green-400)' : score >= 50 ? 'var(--yellow-400)' : 'var(--red-400)';
  const bg = score >= 80 ? 'rgba(34,197,94,0.1)' : score >= 50 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)';
  const border = score >= 80 ? 'rgba(34,197,94,0.3)' : score >= 50 ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)';
  const label = verdict === 'verified' ? "AI: Authentication" : verdict === 'rejected' ? "AI: Refuse" : "AI: Not sure";

  return (
    <div className="flex items-center gap-2">
      <Bot size={13} style={{ color }} />
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, background: bg, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 99 }}>
        {label} ({score}%)
      </span>
    </div>
  );
}

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Recent';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${Math.max(0, diffMins)} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

function ReportModal({ report, onClose, onAction }) {
  if (!report) return null;
  const aiScore = report.ai_confidence_score ? Math.round(report.ai_confidence_score * 100) : 0;
  const aiVerdict = aiScore >= 80 ? 'verified' : aiScore >= 50 ? 'uncertain' : 'rejected';
  const parsedImages = report.images ? JSON.parse(report.images) : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Report details {report._id.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Posted by {report.reporter_id?.full_name || report.reporter_name || 'Anonymous'} at the time {formatRelativeTime(report.created_at)}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 16 }}>
          {/* User info */}
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1a6cff,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>
              {(report.reporter_id?.full_name || report.reporter_name || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{report.reporter_id?.full_name || report.reporter_name || 'Anonymous'}</div>
              <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                <MapPin size={12} color="var(--text-muted)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{report.location?.address || ''}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 8 }}>
              {report.title}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {report.description}
            </div>
          </div>

          {/* Images count */}
          {parsedImages.length > 0 && (
            <div style={{ width: '100%', overflow: 'hidden' }}>
              <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                <Camera size={14} />
                {parsedImages.length} attached image
              </div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                {parsedImages.map((img, i) => (
                  <img key={i} src={img.url} alt={`img-${i}`} style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--border-dim)', cursor: 'zoom-in' }} onClick={() => onAction(img.url, 'fullscreen')} />
                ))}
              </div>
            </div>
          )}

          {/* AI Assessment */}
          <div style={{ background: 'rgba(26,108,255,0.06)', border: '1px solid rgba(26,108,255,0.2)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              🤖 AI Review
            </div>
            <div className="flex items-center gap-3">
              <AiScoreBadge score={aiScore} verdict={aiVerdict} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Trust level: {aiScore}%
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${aiScore}%`,
                  background: aiScore >= 80 ? 'var(--green-500)' : aiScore >= 50 ? 'var(--yellow-500)' : 'var(--red-500)',
                  borderRadius: 99,
                  transition: 'width 1s ease-out',
                }} />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {(!report.status || report.status === 'pending') ? (
            <>
              <button className="btn btn-danger btn-sm" onClick={() => { onAction(report._id, 'rejected'); onClose(); }}>
                <XCircle size={14} /> Reject
              </button>
              <button className="btn btn-success btn-sm" onClick={() => { onAction(report._id, 'approved'); onClose(); }}>
                <CheckCircle size={14} /> Approve
              </button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

function BroadcastModal({ onClose }) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('warning');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setTimeout(onClose, 1500); }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radio size={18} color="var(--orange-400)" />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Make a public announcement</span>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Notification type</label>
            <div className="tabs-nav">
              {[['critical', "🚨 Urgent"], ['warning', "⚠️ Warning"], ['info', "ℹ️ Information"]].map(([v, l]) => (
                <button key={v} className={`tab-btn ${type === v ? 'active' : ''}`} onClick={() => setType(v)} style={{ fontSize: '0.8rem' }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Notification content</label>
            <textarea
              className="input"
              placeholder="Enter the content of the notification sent to all users..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
            ⚡ Notification will be sent <strong style={{ color: 'var(--orange-400)' }}>5,247 users</strong> via Push Notification and Email.
          </div>
          {sent && (
            <div style={{ color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <CheckCircle size={16} /> Sent successfully!
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Sending...</> : <><Send size={14} /> Broadcast notification</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityReports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [loading, setLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  React.useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/incident-reports');
      const data = await res.json();
      if (data.success) {
        const mappedData = data.data.map(r => ({ ...r, status: r.moderation_status ? r.moderation_status.toLowerCase() : 'pending' }));
        setReports(mappedData);
      }
    } catch (err) {
      console.error(err);
    }
  };



  const aiAuditStats = [
    { label: "24h post-check", value: 128, color: 'var(--cyan-400)' },
    { label: "Accurate AI", value: '96.1%', color: 'var(--green-400)' },
    { label: "Manual override", value: 14, color: 'var(--orange-400)' },
    { label: "Deviation", value: 6, color: 'var(--red-400)' },
  ];

  const aiAuditFindings = [
    { id: 'AUD-204', result: "Decrease the level from High → Medium", reason: "Photo lacks context", time: '14:10' },
    { id: 'AUD-203', result: "Reject report", reason: "Spam/duplicate content", time: '13:55' },
    { id: 'AUD-202', result: "Raise the level to High", reason: "Add photo authentication", time: '13:42' },
    { id: 'AUD-201', result: "Leave the AI decision intact", reason: "Enough evidence", time: '13:20' },
  ];

  const filtered = reports.filter((r) => {
    const user = r.reporter_id?.full_name || r.reporter_name || 'Anonymous';
    const location = r.location?.address || '';
    const description = r.description || '';
    const title = r.title || '';
    const matchSearch = user.toLowerCase().includes(search.toLowerCase()) ||
      location.toLowerCase().includes(search.toLowerCase()) ||
      description.toLowerCase().includes(search.toLowerCase()) ||
      title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleAction = async (id, action) => {
    if (action === 'fullscreen') {
      setFullscreenImage(id); // id is image url in this case
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/incident-reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        setReports((prev) => prev.map((r) => r._id === id ? { ...r, status: action } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const severityLabel = { high: "Serious", medium: "Medium", low: "Light", none: 'N/A' };
  const statusBadge = {
    pending: <span className="badge badge-orange">Waiting for approval</span>,
    approved: <span className="badge badge-green">Approved</span>,
    rejected: <span className="badge badge-red">Rejected</span>,
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Moderation of Community Reports</h1>
            <p>AI automatically classifies – Manual moderation – Public notification management</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowBroadcast(true)}>
            <Radio size={15} /> Broadcast notification
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Waiting for approval", value: reports.filter(r => r.status === 'pending' || !r.status).length, color: 'var(--orange-400)' },
          { label: "AI Authentication", value: reports.filter(r => r.ai_confidence_score >= 0.8).length, color: 'var(--green-400)' },
          { label: "Need to consider", value: reports.filter(r => r.ai_confidence_score < 0.8 && r.ai_confidence_score >= 0.5).length, color: 'var(--yellow-400)' },
          { label: "Processed today", value: reports.filter(r => r.status === 'approved' || r.status === 'rejected').length, color: 'var(--blue-400)' },
        ].map((s) => (
          <div key={s.label} className="card p-5" style={{ borderLeft: `3px solid ${s.color}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs and Filters */}
      <div className="flex items-center justify-between gap-4" style={{ marginBottom: 20 }}>
        <div className="tabs-nav" style={{ width: 'auto' }}>
          <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <FileIcon size={14} /> Report ({reports.length})
          </button>
          <button className={`tab-btn ${activeTab === 'advisories' ? 'active' : ''}`} onClick={() => setActiveTab('advisories')}>
            <Megaphone size={14} /> Notification ({broadcastAdvisories.length})
          </button>
        </div>
        
        {activeTab === 'reports' && (
          <div className="flex items-center gap-3">
            <div className="input-group" style={{ width: 280 }}>
              <Search size={15} className="input-icon" />
              <input
                className="input"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="input" style={{ width: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All status</option>
              <option value="pending">Waiting for approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === 'reports' && (
        <>

          <div className="grid grid-2" style={{ marginBottom: 16 }}>
            <div className="card p-5">
              <div className="section-title" style={{ marginBottom: 12 }}>Post-check AI</div>
              <div className="grid grid-4" style={{ gap: 10 }}>
                {aiAuditStats.map((s) => (
                  <div key={s.label} style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'rgba(61,125,176,0.08)', border: '1px solid var(--border-dim)' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="alert-banner info" style={{ marginTop: 12 }}>
                <Bot size={15} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Post-hoc results are used to refine AI thresholds and warning rules.
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="section-title" style={{ marginBottom: 12 }}>Recent post-test results</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {aiAuditFindings.map((item) => (
                  <div key={item.id} className="flex items-start justify-between" style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'rgba(18,29,40,0.7)', border: '1px solid var(--border-dim)' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.result}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{item.reason}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reports list */}
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((report) => {
              const rStatus = report.status || 'pending';
              const aiScore = report.ai_confidence_score ? Math.round(report.ai_confidence_score * 100) : 0;
              const aiVerdict = aiScore >= 80 ? 'verified' : aiScore >= 50 ? 'uncertain' : 'rejected';
              const parsedImages = report.images ? JSON.parse(report.images) : [];
              return (
                <div
                  key={report._id}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    borderLeft: rStatus === 'pending'
                      ? '3px solid var(--orange-400)'
                      : rStatus === 'approved'
                      ? '3px solid var(--green-400)'
                      : '3px solid var(--red-400)',
                    animation: 'slide-in-up 0.3s ease-out',
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#1a6cff,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'white', flexShrink: 0 }}>
                      {(report.reporter_id?.full_name || report.reporter_name || 'A').charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{report.reporter_id?.full_name || report.reporter_name || 'Anonymous'}</span>
                        {statusBadge[rStatus]}
                        <AiScoreBadge score={aiScore} verdict={aiVerdict} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />{formatRelativeTime(report.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                        <MapPin size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{report.title} - {report.location?.address || ''}</span>
                        {parsedImages.length > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--cyan-400)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Camera size={11} /> {parsedImages.length} image
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: parsedImages.length > 0 ? 12 : 0 }}>
                        {report.description}
                      </div>

                      {parsedImages.length > 0 && (
                        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                          {parsedImages.slice(0, 4).map((img, i) => (
                            <div key={i} style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                              <img src={img.url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-dim)', cursor: 'zoom-in' }} onClick={(e) => { e.stopPropagation(); setFullscreenImage(img.url); }} />
                              {i === 3 && parsedImages.length > 4 && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', pointerEvents: 'none' }}>
                                  +{parsedImages.length - 4}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {rStatus === 'pending' && (
                      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReport(report)}>
                          <Eye size={13} /> Detail
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(report._id, 'rejected')}>
                          <ThumbsDown size={13} /> Reject
                        </button>
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(report._id, 'approved')}>
                          <ThumbsUp size={13} /> Approve
                        </button>
                      </div>
                    )}
                    {rStatus !== 'pending' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReport(report)}>
                        <Eye size={13} /> Detail
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'advisories' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {broadcastAdvisories.map((adv) => (
            <div key={adv.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ fontSize: '1.25rem' }}>
                    {adv.type === 'critical' ? '🚨' : adv.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{adv.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Send at {adv.sentAt} · Approached {adv.reach.toLocaleString('vi-VN')} User
                    </div>
                  </div>
                </div>
                <span className="badge badge-green">Sent</span>
              </div>
            </div>
          ))}

          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => setShowBroadcast(true)}>
            <Send size={14} /> Create new notification
          </button>
        </div>
      )}

      {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} onAction={handleAction} />}
      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}

      {/* 🖼️ FULLSCREEN IMAGE LIGHTBOX */}
      {fullscreenImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }} onClick={() => setFullscreenImage(null)}>
          <button style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#fff' }} onClick={() => setFullscreenImage(null)}>
            <X size={24} />
          </button>
          <img src={fullscreenImage} alt="fullscreen" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
        </div>
      )}
    </div>
  );
}

function FileIcon({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
