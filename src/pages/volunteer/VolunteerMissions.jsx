import React, { useState } from 'react';
import {
  ShieldAlert, CheckCircle, Clock, MapPin, User, Navigation,
  AlertTriangle, Filter, Phone, MessageSquare, Send, LifeBuoy,
  ChevronRight, XCircle,
} from 'lucide-react';

const initialSOSList = [
  {
    id: 'SOS-001', severity: 'critical', location: "Ninh Kieu, Can Tho",
    victim: "Nguyen Van An", phone: '0901234567',
    message: "Water flooded the first floor, it was impossible to move. There are 3 elders and 1 child.",
    time: '14:32', status: 'pending', type: 'SOS', coords: '10.034189, 105.781305',
    waterLevel: '95 cm', distance: '1.2 km', eta: "6 minutes",
  },
  {
    id: 'SOS-002', severity: 'high', location: "Cai Rang, Can Tho",
    victim: "Tran Thi Binh", phone: '0912345678',
    message: "The road was flooded 80cm deep, the car was stuck in the middle of the road. Need urgent relief.",
    time: '14:28', status: 'accepted', type: 'SOS', coords: '10.009189, 105.753305',
    waterLevel: '80 cm', distance: '3.5 km', eta: "14 minutes",
  },
  {
    id: 'SOS-003', severity: 'critical', location: "Binh Thuy, Can Tho",
    victim: "Le Minh Chau", phone: '0923456789',
    message: "Traffic jam, water rising quickly. 5 people were trapped. Children need priority.",
    time: '14:15', status: 'pending', type: 'SOS', coords: '10.071189, 105.723305',
    waterLevel: '110 cm', distance: '4.8 km', eta: "18 minutes",
  },
  {
    id: 'SOS-004', severity: 'high', location: "Phong Dien, Can Tho",
    victim: "Pham Quoc Dung", phone: '0934567890',
    message: "The road was heavily flooded, elderly people could not move.",
    time: '14:08', status: 'in_progress', type: 'FLOOD', coords: '10.042345, 105.771234',
    waterLevel: '65 cm', distance: '6.1 km', eta: "22 minutes",
  },
  {
    id: 'SOS-005', severity: 'medium', location: "O Mon, Can Tho",
    victim: "Hoang Minh Tuan", phone: '0945678901',
    message: "The family needs to evacuate the flooded area, including 2 children.",
    time: '13:55', status: 'resolved', type: 'SOS', coords: '10.021234, 105.761234',
    waterLevel: '40 cm', distance: '8.2 km', eta: "Complete",
  },
];

const trackingSteps = [
  { time: '14:32', label: "Receive SOS requests", status: 'done' },
  { time: '14:34', label: "Nearest distribution system", status: 'done' },
  { time: '14:36', label: "The volunteer confirmed accepting the assignment", status: 'done' },
  { time: '14:38', label: "Moving to the scene", status: 'active' },
  { time: '14:52', label: "Arrive and assist the victim", status: 'pending' },
  { time: '15:05', label: "Confirm task completion", status: 'pending' },
];

const statusBadge = {
  pending:     <span className="badge badge-orange">Waiting for routing</span>,
  accepted:    <span className="badge badge-blue">Received</span>,
  in_progress: <span className="badge badge-blue" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Processing</span>,
  resolved:    <span className="badge badge-green">Complete</span>,
};

const severityBg = {
  critical: '3px solid var(--red-400)',
  high:     '3px solid var(--orange-400)',
  medium:   '3px solid var(--cyan-400)',
};

export default function VolunteerMissions() {
  const [sos, setSos] = useState(initialSOSList);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('list');
  const [reportText, setReportText] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const filtered = sos.filter(s => filter === 'all' || s.status === filter);

  const acceptMission = (id) => {
    setSos(prev => prev.map(s => s.id === id ? { ...s, status: 'accepted' } : s));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'accepted' }));
  };

  const completeMission = (id) => {
    setSos(prev => prev.map(s => s.id === id ? { ...s, status: 'resolved' } : s));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'resolved' }));
  };

  const startMission = (id) => {
    setSos(prev => prev.map(s => s.id === id ? { ...s, status: 'in_progress' } : s));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'in_progress' }));
  };

  const handleSendReport = () => {
    setReportSent(true);
    setTimeout(() => { setReportSent(false); setReportText(''); }, 2000);
  };

  const counts = {
    pending: sos.filter(s => s.status === 'pending').length,
    in_progress: sos.filter(s => s.status === 'in_progress' || s.status === 'accepted').length,
    resolved: sos.filter(s => s.status === 'resolved').length,
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>SOS Request & Rescue Mission</h1>
        <p>Receive, monitor and complete emergency rescue requests</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Waiting for routing", value: counts.pending, color: 'var(--red-400)', anim: true },
          { label: "Processing",     value: counts.in_progress, color: 'var(--orange-400)' },
          { label: "Completed Hanoi",  value: counts.resolved, color: 'var(--green-400)' },
          { label: "Total SOS",       value: sos.length, color: 'var(--cyan-400)' },
        ].map((s) => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)', ...(s.anim ? { animation: 'blink 2s ease-in-out infinite' } : {}) }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 560 }}>
        <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          <ShieldAlert size={13} /> SOS List
        </button>
        <button className={`tab-btn ${activeTab === 'track' ? 'active' : ''}`} onClick={() => setActiveTab('track')}>
          <Navigation size={13} /> Mission tracking
        </button>
        <button className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
          <MessageSquare size={13} /> Field report
        </button>
        <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          <LifeBuoy size={13} /> Emergency instructions
        </button>
      </div>

      {/* Tab: SOS List */}
      {activeTab === 'list' && (
        <div className="grid" style={{ gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
          {/* List Panel */}
          <div>
            {/* Filter */}
            <div className="flex items-center gap-3" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
              <Filter size={15} color="var(--text-muted)" />
              {[
                { key: 'all', label: "All" },
                { key: 'pending', label: "Waiting for routing" },
                { key: 'accepted', label: "Received" },
                { key: 'in_progress', label: "Processing" },
                { key: 'resolved', label: "Complete" },
              ].map(f => (
                <button
                  key={f.key}
                  className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {filtered.map(s => (
                <div
                  key={s.id}
                  className="card"
                  style={{
                    padding: '14px 18px',
                    borderLeft: severityBg[s.severity] || '3px solid var(--border-default)',
                    cursor: 'pointer',
                    background: selected?.id === s.id ? 'rgba(61,125,176,0.1)' : undefined,
                    transition: 'background 0.15s',
                  }}
                  onClick={() => setSelected(s)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.id}</span>
                        {statusBadge[s.status]}
                        <span className={`badge ${s.severity === 'critical' ? 'badge-red' : s.severity === 'high' ? 'badge-orange' : 'badge-green'}`} style={{ fontSize: '0.62rem' }}>
                          {s.severity.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />{s.time}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                        <MapPin size={13} style={{ display: 'inline', marginRight: 4, color: 'var(--text-muted)' }} />
                        {s.location}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Victim: {s.victim} · Way: {s.distance} · ETA: {s.eta}
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="card p-6" style={{ position: 'sticky', top: 20 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="section-title">Request details</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
                  <XCircle size={14} /> Close
                </button>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ padding: '10px 14px', background: selected.severity === 'critical' ? 'rgba(239,29,55,0.08)' : 'rgba(249,115,22,0.08)', borderRadius: 'var(--r-md)', border: `1px solid ${selected.severity === 'critical' ? 'rgba(239,29,55,0.2)' : 'rgba(249,115,22,0.2)'}` }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                    {selected.id} · {selected.type}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    "{selected.message}"
                  </div>
                </div>

                {[
                  { icon: MapPin, label: "Location", value: selected.location },
                  { icon: User, label: "Victim", value: selected.victim },
                  { icon: Phone, label: "Phone", value: selected.phone },
                  { icon: AlertTriangle, label: "Water level", value: selected.waterLevel },
                  { icon: Navigation, label: "Distance", value: `${selected.distance} (ETA ${selected.eta})` },
                  { icon: Clock, label: "Time", value: selected.time },
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

                {/* Action Buttons */}
                <div style={{ display: 'grid', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-dim)' }}>
                  {selected.status === 'pending' && (
                    <button className="btn btn-danger" onClick={() => acceptMission(selected.id)}>
                      <ShieldAlert size={14} /> Get the quest
                    </button>
                  )}
                  {selected.status === 'accepted' && (
                    <button className="btn btn-primary" onClick={() => startMission(selected.id)}>
                      <Navigation size={14} /> Start moving
                    </button>
                  )}
                  {(selected.status === 'accepted' || selected.status === 'in_progress') && (
                    <button className="btn btn-success" onClick={() => completeMission(selected.id)}>
                      <CheckCircle size={14} /> Confirm completion
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm">
                    <Phone size={13} /> Call now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Track Mission */}
      {activeTab === 'track' && (
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 0.6fr', gap: 16 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-dim)' }}>
              <div className="section-title">Mission tracking map · SOS-001</div>
            </div>
            <div style={{ height: 380, background: 'radial-gradient(circle at 35% 40%, rgba(239,29,55,0.25), transparent 45%), radial-gradient(circle at 65% 60%, rgba(249,115,22,0.2), transparent 40%), linear-gradient(135deg, rgba(18,29,40,0.95), rgba(9,18,26,0.9))', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, left: 16, padding: '4px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239,29,55,0.3)', fontSize: '0.68rem', color: 'var(--red-400)', fontWeight: 700 }}>
                🚨 VOLUNTEER TRACKING LIVE
              </div>
              {/* Simulated blinking volunteer marker */}
              <div style={{ position: 'absolute', top: '42%', left: '35%', width: 14, height: 14, borderRadius: '50%', background: 'var(--red-400)', boxShadow: '0 0 20px var(--red-400)', animation: 'blink 1s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', top: '40%', left: '33%', fontSize: '0.65rem', color: 'var(--red-400)', fontWeight: 700, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>
                SOS-001 Victim
              </div>
              {/* Simulated volunteer marker */}
              <div style={{ position: 'absolute', top: '54%', left: '50%', width: 12, height: 12, borderRadius: '50%', background: 'var(--green-400)', boxShadow: '0 0 15px var(--green-400)' }} />
              <div style={{ position: 'absolute', top: '57%', left: '48%', fontSize: '0.65rem', color: 'var(--green-400)', fontWeight: 700, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>
                Your location
              </div>
              <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'grid', gap: 6 }}>
                {[
                  { label: "SOS victims", color: 'var(--red-400)' },
                  { label: "Volunteer", color: 'var(--green-400)' },
                  { label: "Safe route", color: 'var(--cyan-400)' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Mission progress</div>
            <div style={{ display: 'grid', gap: 14 }}>
              {trackingSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                    background: step.status === 'done' ? 'var(--green-400)' : step.status === 'active' ? 'var(--orange-400)' : 'var(--bg-elevated)',
                    border: step.status === 'pending' ? '2px solid var(--border-dim)' : 'none',
                    boxShadow: step.status === 'active' ? '0 0 10px var(--orange-400)' : 'none',
                    animation: step.status === 'active' ? 'blink 1.5s ease-in-out infinite' : 'none',
                  }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: step.status === 'active' ? 700 : 500, color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{step.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-dim)' }}>
              <button className="btn btn-success" style={{ width: '100%' }}>
                <CheckCircle size={14} /> Confirm task completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Report */}
      {activeTab === 'report' && (
        <div className="grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16 }}>Field report</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="input-group">
                <MapPin size={15} className="input-icon" />
                <input className="input" placeholder="Site location..." defaultValue="District 12 – Hiep Thanh" />
              </div>
              <div className="flex gap-3">
                <select className="input" style={{ maxWidth: 200 }}>
                  <option>On the move</option>
                  <option>Arrive</option>
                  <option>Supporting</option>
                  <option>Complete</option>
                  <option>Need more force</option>
                </select>
                <input className="input" placeholder="SOS ID (VD: SOS-001)" defaultValue="SOS-001" />
              </div>
              <textarea
                className="input"
                rows={5}
                placeholder="Describe the scene situation, number of victims, what additional resources are needed..."
                value={reportText}
                onChange={e => setReportText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost btn-sm">📷 Add photo</button>
                <button className="btn btn-ghost btn-sm">📍 Automatic GPS</button>
              </div>
              <button className="btn btn-primary" onClick={handleSendReport}>
                <Send size={14} /> Submit report
              </button>
              {reportSent && (
                <div className="flex items-center gap-2" style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: '0.85rem' }}>
                  <CheckCircle size={14} /> Report sent successfully
                </div>
              )}
            </div>
          </div>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 12 }}>Reporting instructions</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                "Update status as soon as you arrive at the scene.",
                "Clearly state the number of victims and health status.",
                "Take photos to document the situation if possible.",
                "Report immediately if additional support is needed.",
                "Confirmation is complete after the victim is brought to safety.",
              ].map((tip, i) => (
                <div key={i} className="alert-banner info" style={{ margin: 0 }}>
                  <AlertTriangle size={14} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tip}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Info Hub */}
      {activeTab === 'info' && (
        <div className="grid grid-2" style={{ gap: 16 }}>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Rescue procedure</div>
            {[
              { step: '01', title: "Get the quest", desc: "View SOS requests, assess urgency, and receive appropriate tasks." },
              { step: '02', title: "Move to the scene", desc: "Use the tactical map to find safe routes and avoid deeply flooded areas." },
              { step: '03', title: "Assess the situation", desc: "Check the number of victims, the level of danger and call for additional assistance if necessary." },
              { step: '04', title: "Victim support", desc: "Basic medical first aid, take the victim to a safe place or hand over to medical attention." },
              { step: '05', title: "Confirmation & Reporting", desc: "Submit field reports and confirm task completion on the system." },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4" style={{ marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,29,55,0.12)', border: '1px solid rgba(239,29,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--red-400)', fontFamily: 'var(--font-mono)' }}>{item.step}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Emergency phone number</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { label: "Rescue coordination center", phone: '1800 599 920', color: 'var(--red-400)' },
                { label: "Ambulance – Emergency medical care", phone: '115', color: 'var(--orange-400)' },
                { label: "Fire & Fire Prevention", phone: '114', color: 'var(--orange-400)' },
                { label: "Police", phone: '113', color: 'var(--cyan-400)' },
                { label: "Ho Chi Minh City Disaster Prevention and Control Steering Committee", phone: '028 3930 2524', color: 'var(--blue-400)' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-dim)', background: 'rgba(61,125,176,0.04)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: item.color, fontSize: '0.9rem' }}>{item.phone}</div>
                </div>
              ))}
            </div>
            <div className="alert-banner" style={{ marginTop: 16, background: 'rgba(239,29,55,0.08)', border: '1px solid rgba(239,29,55,0.2)' }}>
              <ShieldAlert size={15} color="var(--red-400)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                In case of danger to life, priority should be given to contacting the dispatch center before acting independently.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
