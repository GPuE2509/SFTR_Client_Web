import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle, Clock, ShieldCheck,
  ClipboardList, User, Save, FileText, Filter,
} from 'lucide-react';

const initialIncidents = [
  { id: 'INC-2405-017', type: "Community reporting", location: "District 12", severity: 'high', status: 'pending', owner: 'Team A', updated: '14:32', note: "Need to verify field photos" },
  { id: 'INC-2405-018', type: "IoT alerts", location: "Hoc Mon", severity: 'critical', status: 'in_progress', owner: 'Ops 2', updated: '14:27', note: "Water level threshold exceeds red" },
  { id: 'INC-2405-019', type: "Emergency SOS", location: "Thu Duc", severity: 'critical', status: 'pending', owner: 'Volunteer 3', updated: '14:21', note: "Wait for scene confirmation" },
  { id: 'INC-2405-020', type: "Community reporting", location: "District 7", severity: 'medium', status: 'resolved', owner: 'Team B', updated: '13:58', note: "Notice published" },
  { id: 'INC-2405-021', type: "IoT signal error", location: "Binh Thanh", severity: 'low', status: 'in_progress', owner: 'Ops 1', updated: '13:42', note: "Checking device battery" },
];

const operationLogs = [
  { time: '14:36', actor: 'Manager A', action: "Browse reports", target: 'RPT-2024-0891', level: 'INFO' },
  { time: '14:28', actor: 'Manager B', action: "Refuse to report", target: 'RPT-2024-0887', level: 'WARN' },
  { time: '14:12', actor: 'Ops Lead', action: "Turn on the AI ​​module", target: 'mod-ai', level: 'INFO' },
  { time: '13:55', actor: 'Manager A', action: "Account lock", target: 'USR-007', level: 'WARN' },
  { time: '13:32', actor: 'System', action: "Automatic backup", target: 'backup-2405', level: 'INFO' },
  { time: '13:10', actor: 'Manager C', action: "Remove violating posts", target: 'POST-004', level: 'WARN' },
];

function PolicySlider({ label, value, min, max, unit, color, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color, fontSize: '1rem' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, var(--bg-elevated) ${pct}%, var(--bg-elevated) 100%)`,
        }}
      />
      <div className="flex justify-between" style={{ marginTop: 4 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{min}{unit}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function ManagerOps() {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [activeTab, setActiveTab] = useState('incidents');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [policy, setPolicy] = useState({
    reportSubmit: 5,
    reportVerified: 12,
    volunteerAssist: 20,
    workshopAssist: 8,
    falseReportPenalty: -15,
  });

  const setStatus = (id, status) => {
    setIncidents((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
  };

  const statusBadge = {
    pending: <span className="badge badge-orange">Waiting for processing</span>,
    in_progress: <span className="badge badge-blue">Processing</span>,
    resolved: <span className="badge badge-green">Completed</span>,
    confirmed_safe: <span className="badge badge-cyan">Confirmed safe</span>,
  };

  const counts = {
    pending: incidents.filter(i => i.status === 'pending').length,
    in_progress: incidents.filter(i => i.status === 'in_progress').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
  };

  const filteredLogs = operationLogs.filter((log) =>
    logSearch === '' ||
    log.actor.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.target.toLowerCase().includes(logSearch.toLowerCase())
  );

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1200);
  };

  const exportCSV = (rows, filename = 'export.csv') => {
    if (!rows || rows.length === 0) {
      alert("There is no data to export.");
      return;
    }
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
      const v = r[k] == null ? '' : String(r[k]).replace(/"/g, '""');
      return `"${v}"`;
    }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Incident Log & Bonus Points Policy</h1>
            <p>Manage incident lifecycles, contribution points, and administrative operations logs</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              if (activeTab === 'incidents') exportCSV(incidents, 'incidents.csv');
              else exportCSV(operationLogs, 'ops-log.csv');
            }}>
              Export CSV
            </button>
            {saved && (
              <div className="flex items-center gap-2" style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: '0.875rem' }}>
                <CheckCircle size={15} /> Policy saved
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Waiting for processing", value: counts.pending, color: 'var(--orange-400)' },
          { label: "Processing", value: counts.in_progress, color: 'var(--blue-400)' },
          { label: "Completed", value: counts.resolved, color: 'var(--green-400)' },
          { label: "Correct rate AI", value: '96.1%', color: 'var(--cyan-400)', isText: true },
        ].map((s) => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div style={{ fontSize: s.isText ? '1.5rem' : '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 520 }}>
        <button className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`} onClick={() => setActiveTab('incidents')}>
          <ClipboardList size={13} /> Incident Logs
        </button>
        <button className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`} onClick={() => setActiveTab('points')}>
          <ShieldCheck size={13} /> Contribution points
        </button>
        <button className={`tab-btn ${activeTab === 'ops' ? 'active' : ''}`} onClick={() => setActiveTab('ops')}>
          <FileText size={13} /> Administration log
        </button>
      </div>

      {activeTab === 'incidents' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {incidents.map((inc) => (
            <div key={inc.id} className="card" style={{ padding: '16px 20px', borderLeft: inc.severity === 'critical' ? '3px solid var(--red-400)' : inc.severity === 'high' ? '3px solid var(--orange-400)' : '3px solid var(--border-default)' }}>
              <div className="flex items-start justify-between gap-4">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inc.id}</span>
                    {statusBadge[inc.status]}
                    <span className={`badge ${inc.severity === 'critical' ? 'badge-red' : inc.severity === 'high' ? 'badge-orange' : 'badge-green'}`}>{inc.severity.toUpperCase()}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      <Clock size={11} style={{ display: 'inline' }} /> {inc.updated}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 4 }}>{inc.type} · {inc.location}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    <User size={11} style={{ display: 'inline' }} /> {inc.owner}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{inc.note}</div>
                </div>
                <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                  {inc.status !== 'resolved' && (
                    <button className="btn btn-success btn-sm" onClick={() => setStatus(inc.id, 'resolved')}>
                      <CheckCircle size={12} /> Completed
                    </button>
                  )}
                  {inc.status === 'pending' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setStatus(inc.id, 'in_progress')}>
                      <AlertTriangle size={12} /> Receive processing
                    </button>
                  )}
                  {/* Confirm safe action */}
                  {inc.status === 'resolved' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setStatus(inc.id, 'confirmed_safe')}>
                      <ShieldCheck size={12} /> Confirmed safety
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'points' && (
        <div className="grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16 }}>Contribution point policy</div>
            <PolicySlider
              label="New report"
              value={policy.reportSubmit}
              min={1}
              max={10}
              unit="point"
              color="var(--blue-400)"
              onChange={(v) => setPolicy(prev => ({ ...prev, reportSubmit: v }))}
            />
            <PolicySlider
              label="The report is authenticated"
              value={policy.reportVerified}
              min={5}
              max={25}
              unit="point"
              color="var(--green-400)"
              onChange={(v) => setPolicy(prev => ({ ...prev, reportVerified: v }))}
            />
            <PolicySlider
              label="Rescue support"
              value={policy.volunteerAssist}
              min={10}
              max={40}
              unit="point"
              color="var(--orange-400)"
              onChange={(v) => setPolicy(prev => ({ ...prev, volunteerAssist: v }))}
            />
            <PolicySlider
              label="Repair support"
              value={policy.workshopAssist}
              min={5}
              max={20}
              unit="point"
              color="var(--cyan-400)"
              onChange={(v) => setPolicy(prev => ({ ...prev, workshopAssist: v }))}
            />
            <PolicySlider
              label="Penalty for false reporting"
              value={policy.falseReportPenalty}
              min={-30}
              max={0}
              unit="point"
              color="var(--red-400)"
              onChange={(v) => setPolicy(prev => ({ ...prev, falseReportPenalty: v }))}
            />
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : <><Save size={14} /> Save policy</>}
            </button>
          </div>
          <div className="card p-6" style={{ display: 'grid', gap: 12 }}>
            <div className="section-title">Operating notes</div>
            {[
              "Contribution points are updated every 24 hours.",
              "False reports will deduct points and reduce account reputation.",
              "Additional rewards for rescue teams that complete before SLA.",
            ].map((text) => (
              <div key={text} className="alert-banner info" style={{ margin: 0 }}>
                <ShieldCheck size={15} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ops' && (
        <div>
          <div className="input-group" style={{ maxWidth: 320, marginBottom: 16 }}>
            <Filter size={15} className="input-icon" />
            <input className="input" placeholder="Search in admin log..." value={logSearch} onChange={e => setLogSearch(e.target.value)} />
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="live-indicator"><div className="live-dot" />LIVE OPS LOG</div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', maxHeight: 420, overflow: 'auto' }}>
              {filteredLogs.map((log, i) => (
                <div
                  key={`${log.time}-${i}`}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '9px 18px',
                    borderBottom: '1px solid rgba(30,58,138,0.1)',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: '0.75rem' }}>{log.time}</span>
                  <span style={{
                    flexShrink: 0,
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: log.level === 'WARN' ? 'rgba(249,115,22,0.15)' : 'rgba(34,197,94,0.1)',
                    color: log.level === 'WARN' ? 'var(--orange-400)' : 'var(--green-400)',
                  }}>
                    {log.level}
                  </span>
                  <span style={{ color: 'var(--cyan-400)', flexShrink: 0, fontSize: '0.75rem' }}>[{log.actor}]</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.4 }}>{log.action} · {log.target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
