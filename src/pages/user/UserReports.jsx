import React, { useState, useRef } from 'react';
import {
  Camera, MapPin, Upload, CheckCircle, XCircle,
  Search, Bot, ThumbsUp, ThumbsDown, FileText,
  AlertTriangle, Image as ImageIcon, X, Flag,
  Crosshair, Clock, Eye, MessageSquare,
} from 'lucide-react';
import { communityReports } from '../../data/mockData';

// ── AI Score Badge ───────────────────────────────────────────────────────────

function AiScoreBadge({ score }) {
  const color = score >= 80 ? 'var(--red-400)' : score >= 50 ? 'var(--yellow-400)' : 'var(--green-400)';
  const bg = score >= 80 ? 'rgba(239,68,68,0.1)' : score >= 50 ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)';
  return (
    <span style={{ fontSize: '0.7rem', fontWeight: 600, color, background: bg, border: `1px solid ${color}55`, padding: '2px 8px', borderRadius: 99 }}>
      AI {score}%
    </span>
  );
}

// ── Status Config ─────────────────────────────────────────────────────────────

const verifyStatusConfig = {
  verified: { label: "Verified", className: 'badge-green', border: 'var(--green-400)', confirmCount: 8, denyCount: 1 },
  unverified: { label: "Not verified", className: 'badge-orange', border: 'var(--orange-400)', confirmCount: 2, denyCount: 0 },
  invalid: { label: "No longer valid", className: 'badge-gray', border: 'var(--text-muted)', confirmCount: 1, denyCount: 5 },
};

const REPORT_TYPES = [
  { id: 'flood', label: "Flooding", color: 'var(--cyan-400)' },
  { id: 'accident', label: "Traffic accident", color: 'var(--orange-400)' },
  { id: 'tree', label: "Tree falling", color: 'var(--green-400)' },
  { id: 'traffic', label: "Serious traffic jam", color: 'var(--yellow-400)' },
  { id: 'infra', label: "Infrastructure failure", color: 'var(--red-400)' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function UserReports() {
  const [activeTab, setActiveTab] = useState('submit');
  const [reportType, setReportType] = useState('flood');
  const [form, setForm] = useState({ location: '', description: '', severity: 'medium', consent: false });
  const [images, setImages] = useState([]);
  const [toast, setToast] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [searchVerify, setSearchVerify] = useState('');
  const [votes, setVotes] = useState({});
  const [gps, setGps] = useState(null);
  const [reports, setReports] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [pageMy, setPageMy] = useState(1);
  const [pageVerify, setPageVerify] = useState(1);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      fetchReports();
    }, 180000); // 3 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/incident-reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
        
        let userId = getUserIdFromToken() || localStorage.getItem('guest_id');
        
        const initialVotes = {};
        if (userId) {
          data.data.forEach(report => {
            if (report.voters && report.voters.length > 0) {
              const userVote = report.voters.find(v => v.user_id === userId);
              if (userVote) {
                initialVotes[report._id] = userVote.vote_type;
              }
            }
          });
        }
        setVotes(initialVotes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'submit') {
      requestLocation();
    } else if (activeTab === 'verify') {
      localStorage.setItem('lastVisitedCommunityVerification', Date.now().toString());
      window.dispatchEvent(new Event('communityVerificationVisited'));
    }
  }, [activeTab]);

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

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocation permission denied or error', err)
      );
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = [];
      for (const f of files) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(f);
        });
        newImages.push({
          url: base64,
          name: f.name
        });
      }
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const aiScore = Math.min(85, Math.max(15, 20 + Math.round(form.description.length / 5) + images.length * 5));

  const getUserIdFromToken = () => {
    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.id || payload._id || null;
      }
    } catch (e) {}
    return null;
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!reportType) newErrors.type = 'Please select an incident type!';
    if (!form.location.trim()) newErrors.location = 'Please enter detailed location!';
    if (!form.description.trim()) newErrors.description = 'Please describe the incident!';
    if (images.length === 0) newErrors.images = 'Please attach at least 1 image!';
    if (!form.consent) newErrors.consent = 'Please confirm that the information is true and photos were taken at the scene.';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      let userId = getUserIdFromToken();
      if (!userId) {
        userId = localStorage.getItem('guest_id');
        if (!userId) {
          userId = 'guest_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('guest_id', userId);
        }
      }

      const payload = {
        reporter_id: userId,
        title: form.location,
        description: form.description,
        images: JSON.stringify(images),
        lng: gps?.lng || null,
        lat: gps?.lat || null,
        report_type: reportType,
        ai_confidence_score: aiScore / 100,
        is_approved_by_ai: aiScore >= 50
      };

      const res = await fetch('http://localhost:5000/api/incident-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setToast({ type: 'success', message: 'The report has been sent successfully!' });
        setSubmitted(true);
        const submitUserId = getUserIdFromToken() || localStorage.getItem('guest_id');
        const storageKey = `my_reports_${submitUserId}`;
        const myReports = JSON.parse(localStorage.getItem(storageKey) || '[]');
        myReports.push(data.data._id);
        localStorage.setItem(storageKey, JSON.stringify(myReports));
        setImages([]);
        setForm({ location: '', description: '', severity: 'medium', consent: false });
        setErrors({});
        fetchReports();
        setTimeout(() => { setToast(null); setSubmitted(false); }, 3000);
      } else {
        setToast({ type: 'error', message: 'Failed to submit report' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Server error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const vote = async (reportId, type) => {
    let userId = getUserIdFromToken();
    if (!userId) {
      userId = localStorage.getItem('guest_id');
      if (!userId) {
        userId = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guest_id', userId);
      }
    }
    
    const storageKey = `my_reports_${userId}`;
    const myReports = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const legacyReports = [...JSON.parse(localStorage.getItem('my_reports') || '[]'), ...JSON.parse(localStorage.getItem('my_reports_guest') || '[]')];
    
    const report = reports.find(r => r._id === reportId);
    
    if (myReports.includes(reportId) || legacyReports.includes(reportId) || (report && report.reporter_id === userId && userId !== 'guest')) {
      setToast({ type: 'error', message: 'You cannot verify your own report!' });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    const prevVote = votes[reportId] || null;
    const newVoteType = prevVote === type ? null : type;

    try {
      const res = await fetch(`http://localhost:5000/api/incident-reports/${reportId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: newVoteType, previous_vote: prevVote, user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        setVotes(prev => ({ ...prev, [reportId]: newVoteType }));
        setReports(prev => prev.map(r => r._id === reportId ? data.data : r));
        if (selectedReport && selectedReport._id === reportId) setSelectedReport(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statusBadge = {
    pending: <span className="badge badge-orange">Waiting for approval</span>,
    approved: <span className="badge badge-green">Approved</span>,
    rejected: <span className="badge badge-red">Refuse</span>,
  };

  const filteredVerify = reports.filter(r => {
    const isApproved = r.moderation_status === 'Approved' || r.status === 'approved';
    return isApproved;
  }).filter(r =>
    r.title?.toLowerCase().includes(searchVerify.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchVerify.toLowerCase())
  );

  let currentUserId = getUserIdFromToken() || localStorage.getItem('guest_id');
  const myReportsStored = JSON.parse(localStorage.getItem(`my_reports_${currentUserId}`) || '[]');
  const legacyReportsStored = [...JSON.parse(localStorage.getItem('my_reports') || '[]'), ...JSON.parse(localStorage.getItem('my_reports_guest') || '[]')];
  
  const myReportsFiltered = reports.filter(r => 
    r.reporter_id === currentUserId || 
    myReportsStored.includes(r._id) || 
    legacyReportsStored.includes(r._id)
  );

  const totalMyPages = Math.ceil(myReportsFiltered.length / 5);
  const paginatedMy = myReportsFiltered.slice((pageMy - 1) * 5, pageMy * 5);

  const totalVerifyPages = Math.ceil(filteredVerify.length / 5);
  const paginatedVerify = filteredVerify.slice((pageVerify - 1) * 5, pageVerify * 5);

  const renderThumbnails = (images) => {
    if (!images || images.length === 0) return null;
    const visible = images.slice(0, 4);
    const remaining = images.length - 4;
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {visible.map((img, i) => (
          <div key={i} onClick={(e) => { e.stopPropagation(); setFullscreenImage(img.url); }} style={{ width: 55, height: 55, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-dim)', position: 'relative', cursor: 'zoom-in' }}>
            <img src={img.url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {i === 3 && remaining > 0 && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>
                +{remaining}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Community reporting</h1>
        <p>Submit reports with actual photos and participate in community information verification</p>
      </div>

      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 600 }}>
        {[
          { id: 'submit', label: "Submit report", icon: Upload },
          { id: 'my', label: "My report", icon: FileText },
          { id: 'verify', label: "Community verification", icon: AlertTriangle },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── GỬI BÁO CÁO ── */}
      {activeTab === 'submit' && (
        <div className="grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16 }}>Report information</div>

            {/* Report type */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>Incident type</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {REPORT_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setReportType(t.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${reportType === t.id ? t.color : 'var(--border-dim)'}`,
                      background: reportType === t.id ? t.color + '18' : 'transparent',
                      color: reportType === t.id ? t.color : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {errors.type && <div style={{ color: 'var(--red-400)', fontSize: '0.75rem', marginTop: 8 }}>* {errors.type}</div>}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {/* Location + GPS */}
              <div className="input-group">
                <MapPin size={15} className="input-icon" />
                <input
                  className="input"
                  placeholder="Enter detailed location..."
                  value={form.location}
                  onChange={e => { setForm(p => ({ ...p, location: e.target.value })); setErrors(p => ({ ...p, location: null })); }}
                />
              </div>
              {errors.location && <div style={{ color: 'var(--red-400)', fontSize: '0.75rem', marginTop: -6 }}>* {errors.location}</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <Crosshair size={12} color={gps ? "var(--cyan-400)" : "var(--text-muted)"} />
                  <span>Automatic GPS: <strong style={{ color: gps ? 'var(--cyan-400)' : 'var(--text-muted)' }}>
                    {gps ? `${gps.lat.toFixed(4)}° N, ${gps.lng.toFixed(4)}° E` : 'Locating...'}
                  </strong></span>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={requestLocation}
                  title="Get current location"
                  style={{ padding: '6px', height: 'auto' }}
                >
                  <MapPin size={14} color="var(--cyan-400)" />
                </button>
              </div>

              <textarea
                className="input"
                rows={4}
                placeholder="Describe the flood or incident (the more details, the higher the AI ​​score)..."
                value={form.description}
                onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setErrors(p => ({ ...p, description: null })); }}
              />
              {errors.description && <div style={{ color: 'var(--red-400)', fontSize: '0.75rem', marginTop: -6 }}>* {errors.description}</div>}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select
                  className="input"
                  value={form.severity}
                  onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                  style={{ maxWidth: 160 }}
                >
                  <option value="high">Serious</option>
                  <option value="medium">Medium</option>
                  <option value="low">Light</option>
                </select>
                <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
                  <Camera size={13} /> Attach photos
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => { handleImageUpload(e); setErrors(p => ({ ...p, images: null })); }} style={{ display: 'none' }} />
                {images.length > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--cyan-400)', fontWeight: 600 }}>{images.length} image</span>}
              </div>
              {errors.images && <div style={{ color: 'var(--red-400)', fontSize: '0.75rem', marginTop: -6 }}>* {errors.images}</div>}

              {/* Image previews */}
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 72, height: 72 }}>
                      <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-dim)' }} />
                      <button
                        onClick={() => removeImage(idx)}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--red-400)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={10} color="white" />
                      </button>
                    </div>
                  ))}
                  {/* Placeholder add more */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ width: 72, height: 72, borderRadius: 'var(--r-sm)', border: '1px dashed var(--border-dim)', background: 'rgba(18,29,40,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}
                  >
                    <ImageIcon size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>More</span>
                  </button>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.consent} onChange={() => { setForm(p => ({ ...p, consent: !p.consent })); setErrors(p => ({ ...p, consent: null })); }} />
                  I confirm that the information is true and the photos were taken at the scene
                </label>
                {errors.consent && <div style={{ color: 'var(--red-400)', fontSize: '0.75rem', marginTop: 6 }}>* {errors.consent}</div>}
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 12, opacity: isSubmitting ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: 8 }}></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Upload size={16} /> Submit report to the system
                  </>
                )}
              </button>

              {submitted && (
                <div className="alert-banner success">
                  <CheckCircle size={14} color="var(--green-400)" />
                  <span style={{ fontWeight: 600, color: 'var(--green-400)' }}>AI is reviewing...</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Score panel */}
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <div className="card p-5">
              <div className="section-title" style={{ marginBottom: 12 }}>AI review (real time)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Bot size={16} color="var(--cyan-400)" />
                <AiScoreBadge score={aiScore} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>reliability</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${aiScore}%`, background: aiScore >= 80 ? 'var(--red-400)' : aiScore >= 50 ? 'var(--yellow-400)' : 'var(--green-400)', transition: 'width 0.4s ease', borderRadius: 99 }} />
              </div>
              <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
                {[
                  { label: "Description content", done: form.description.length > 20 },
                  { label: "Address location", done: form.location.length > 5 },
                  { label: "Attached images", done: images.length > 0 },
                  { label: "Select incident type", done: !!reportType },
                ].map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                    {c.done ? <CheckCircle size={12} color="var(--green-400)" /> : <XCircle size={12} color="var(--text-muted)" />}
                    <span style={{ color: c.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="section-title" style={{ marginBottom: 10, fontSize: '0.8rem' }}>Moderation Note</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'rgba(6,182,212,0.06)', border: '1px solid var(--border-dim)', lineHeight: 1.5 }}>
                  🤖 <strong>Flood images</strong> automatically moderated by AI — results in seconds.
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'rgba(249,115,22,0.06)', border: '1px solid var(--border-dim)', lineHeight: 1.5 }}>
                  👤 <strong>Other incidents</strong> (accidents, fallen trees...) will be manually reviewed by the Manager.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BÁO CÁO CỦA TÔI ── */}
      {activeTab === 'my' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              You haven't posted any reports yet.
            </div>
          ) : (
            paginatedMy.map(report => {
              const parsedImages = report.images ? JSON.parse(report.images) : [];
              const typeCfg = REPORT_TYPES.find(t => t.id === report.report_type) || REPORT_TYPES[0];
              const statusKey = report.moderation_status?.toLowerCase() || 'pending';
              return (
                <div key={report._id} className="card" style={{ padding: '16px 20px', borderLeft: `3px solid ${typeCfg.color}`, cursor: 'pointer' }} onClick={() => setSelectedReport(report)}>
                  <div className="flex items-start justify-between gap-4">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-3" style={{ marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{report._id.slice(-6).toUpperCase()}</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: typeCfg.color, background: typeCfg.color + '18', padding: '2px 8px', borderRadius: 99 }}>{typeCfg.label}</span>
                        {statusBadge[statusKey] || statusBadge.pending}
                        <AiScoreBadge score={report.ai_confidence_score ? Math.round(report.ai_confidence_score * 100) : 0} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                            <MapPin size={12} color="var(--text-muted)" />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{report.title}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{report.description}</div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {renderThumbnails(parsedImages)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {formatRelativeTime(report.created_at)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--green-400)' }}>↑ {report.vote_still_exist || 0} confirm</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--red-400)' }}>↓ {report.vote_no_more || 0} deny</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {reports.length > 5 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" disabled={pageMy === 1} onClick={() => setPageMy(p => Math.max(1, p - 1))}>Previous</button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Page {pageMy} of {totalMyPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={pageMy === totalMyPages} onClick={() => setPageMy(p => Math.min(totalMyPages, p + 1))}>Next</button>
            </div>
          )}
        </div>
      )}

      {/* ── XÁC MINH CỘNG ĐỒNG ── */}
      {activeTab === 'verify' && (
        <div>
          <div className="alert-banner info" style={{ marginBottom: 16 }}>
            <Eye size={14} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Participate in verifying reports from the community. Your feedback helps the system automatically update the correct status on the map.
            </span>
          </div>

          <div className="input-group" style={{ maxWidth: 360, marginBottom: 16 }}>
            <Search size={14} className="input-icon" />
            <input className="input" placeholder="Find reports that need verification..." value={searchVerify} onChange={e => setSearchVerify(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {paginatedVerify.map(report => {
              const parsedImages = report.images ? JSON.parse(report.images) : [];
              const myVote = votes[report._id] || null;
              const confirmCount = report.vote_still_exist || 0;
              const denyCount = report.vote_no_more || 0;
              const wrongCount = report.vote_wrong_report || 0;
              const totalVotes = confirmCount + denyCount;
              const confirmPct = totalVotes > 0 ? Math.round((confirmCount / totalVotes) * 100) : 0;

              return (
                <div key={report._id} className="card" style={{ padding: '16px 20px', borderLeft: `3px solid ${myVote ? (myVote === 'confirm' ? 'var(--green-400)' : 'var(--red-400)') : 'var(--orange-400)'}`, cursor: 'pointer' }} onClick={() => setSelectedReport(report)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-3" style={{ marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>User</span>
                        <AiScoreBadge score={report.ai_confidence_score ? Math.round(report.ai_confidence_score * 100) : 0} />
                        {myVote === 'confirm' && <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>You: Still exists</span>}
                        {myVote === 'deny' && <span className="badge badge-red" style={{ fontSize: '0.62rem' }}>You: Not anymore</span>}
                        {myVote === 'false' && <span className="badge badge-gray" style={{ fontSize: '0.62rem' }}>You: Wrong report</span>}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <Clock size={10} /> {formatRelativeTime(report.created_at)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                            <MapPin size={12} color="var(--text-muted)" />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{report.title}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{report.description}</div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {renderThumbnails(parsedImages)}
                        </div>
                      </div>
                    </div>

                    {/* Vote buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      <button
                        className={`btn btn-sm ${myVote === 'confirm' ? 'btn-success' : 'btn-ghost'}`}
                        onClick={(e) => { e.stopPropagation(); vote(report._id, 'confirm'); }}
                        style={{ gap: 6 }}
                      >
                        <ThumbsUp size={13} /> Still exists
                      </button>
                      <button
                        className={`btn btn-sm ${myVote === 'deny' ? 'btn-danger' : 'btn-ghost'}`}
                        onClick={(e) => { e.stopPropagation(); vote(report._id, 'deny'); }}
                        style={{ gap: 6 }}
                      >
                        <ThumbsDown size={13} /> No more
                      </button>
                      <button
                        className={`btn btn-sm ${myVote === 'false' ? 'btn-warning' : 'btn-ghost'}`}
                        onClick={(e) => { e.stopPropagation(); vote(report._id, 'false'); }}
                        style={{ gap: 6, fontSize: '0.7rem' }}
                      >
                        <Flag size={11} /> Wrong report
                      </button>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Community trust</span>
                      <span>{confirmCount} confirm · {denyCount} deny</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${confirmPct}%`, background: confirmPct >= 60 ? 'var(--green-400)' : 'var(--orange-400)', borderRadius: 99, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredVerify.length > 5 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" disabled={pageVerify === 1} onClick={() => setPageVerify(p => Math.max(1, p - 1))}>Previous</button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Page {pageVerify} of {totalVerifyPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={pageVerify === totalVerifyPages} onClick={() => setPageVerify(p => Math.min(totalVerifyPages, p + 1))}>Next</button>
            </div>
          )}
        </div>
      )}

      {/* Top Right Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 80, // Accounts for top navbar if any
          right: 24,
          zIndex: 9999,
          background: toast.type === 'success' ? 'var(--green-400)' : 'var(--red-400)',
          color: toast.type === 'success' ? '#064e3b' : '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
          fontSize: '0.85rem',
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {toast.message}
        </div>
      )}

      {/* ── REPORT DETAILS MODAL ── */}
      {selectedReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedReport(null)}>
          <div style={{ background: '#111821', borderRadius: 12, width: '100%', maxWidth: 680, border: '1px solid var(--border-dim)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>Report Details</div>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{selectedReport._id.slice(-6).toUpperCase()}</span>
                <AiScoreBadge score={selectedReport.ai_confidence_score ? Math.round(selectedReport.ai_confidence_score * 100) : 0} />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                <strong>Location:</strong> {selectedReport.title}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                <strong>Description:</strong> {selectedReport.description}
              </div>

              {selectedReport.images && JSON.parse(selectedReport.images).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Attached Photos</div>
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                    {JSON.parse(selectedReport.images).map((img, i) => (
                      <img key={i} src={img.url} alt={`img-${i}`} onClick={(e) => { e.stopPropagation(); setFullscreenImage(img.url); }} style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--border-dim)', cursor: 'zoom-in' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN IMAGE LIGHTBOX ── */}
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
