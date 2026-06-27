import React, { useState } from 'react';
import {
  AlertTriangle, Navigation, PhoneCall, ShieldCheck,
  MapPin, Clock, Send, LifeBuoy, Plus, Trash2, Edit2,
  CheckCircle, Radio, Car, Crosshair, Building2, Pill,
  Heart, Phone, X, Save, Bell, Activity,
} from 'lucide-react';

// ── Mock Data ────────────────────────────────────────────────────────────────

const trackingSteps = [
  { time: '14:32', label: "Receiving SOS", desc: "The system has recorded the rescue request", status: 'done' },
  { time: '14:34', label: "Rescue route", desc: "Volunteer coordinator Nguyen Van An", status: 'done' },
  { time: '14:38', label: "The ambulance is on the move", desc: "ETA: 4 minutes — Arriving at your location", status: 'active' },
  { time: '14:55', label: "Field support", desc: "Waiting for volunteers to arrive", status: 'pending' },
  { time: '—', label: "Complete rescue", desc: "Confirm safety to complete", status: 'pending' },
];

const emergencyServices = [
  { name: "District 12 Hospital", type: 'hospital', address: "14 To Ky, Trung My Tay Ward", phone: '028 3891 1234', dist: '1.2 km', icon: Building2, color: 'var(--red-400)' },
  { name: "Thanh Xuan Ward Medical Station", type: 'clinic', address: "52 Quang Trung, Thanh Xuan", phone: '028 3891 5678', dist: '0.8 km', icon: Heart, color: 'var(--orange-400)' },
  { name: "Minh Tam Pharmacy", type: 'pharmacy', address: "88 Nguyen Oanh, Go Vap", phone: '028 3891 9012', dist: '2.1 km', icon: Pill, color: 'var(--cyan-400)' },
  { name: "Hoc Mon Rescue Station", type: 'rescue', address: "Highway 22, Hoc Mon", phone: '028 3891 3456', dist: '3.5 km', icon: LifeBuoy, color: 'var(--green-400)' },
  { name: "Community shelter Q12", type: 'shelter', address: "People's Committee of Thoi An Ward, District 12", phone: '028 3891 7890', dist: '1.9 km', icon: Building2, color: 'var(--blue-400)' },
];

const initContacts = [
  { id: 'ct1', name: "Nguyen Thi Mother", relation: "Mom", phone: '0901234567', notify: true },
  { id: 'ct2', name: "Tran Van Ba", relation: 'Anh', phone: '0912345678', notify: true },
];

const SOS_TYPES = [
  { id: 'flood', label: "The car stalled due to flooding", icon: Car },
  { id: 'stuck', label: "Stuck, can't escape", icon: AlertTriangle },
  { id: 'medical', label: "Need medical assistance", icon: Heart },
  { id: 'other', label: "Other", icon: LifeBuoy },
];

// ── SVG Map: User + Rescue Vehicle ──────────────────────────────────────────

function RescueMap({ eta }) {
  return (
    <div style={{ position: 'relative', height: 320, background: '#080d16', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      {/* Grid roads */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
        {[60, 120, 180, 240, 300, 360].map(x => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={320} stroke="#3d7db0" strokeWidth={0.5} />)}
        {[60, 120, 180, 240, 300].map(y => <line key={`h${y}`} x1={0} y1={y} x2={480} y2={y} stroke="#3d7db0" strokeWidth={0.5} />)}
        {/* Main roads */}
        <line x1={0} y1={160} x2={480} y2={160} stroke="#3d7db0" strokeWidth={2} />
        <line x1={240} y1={0} x2={240} y2={320} stroke="#3d7db0" strokeWidth={2} />
        <text x={12} y={156} fontSize={8} fill="#45b3c0" fontFamily="monospace">To Ky</text>
        <text x={244} y={20} fontSize={8} fill="#45b3c0" fontFamily="monospace">Quang Trung</text>
      </svg>

      {/* Rescue route dotted line */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <line x1={100} y1={90} x2={220} y2={160} stroke="var(--orange-400)" strokeWidth={2} strokeDasharray="6,4" opacity={0.7} />
      </svg>

      {/* User location */}
      <div style={{ position: 'absolute', left: 220, top: 160, transform: 'translate(-50%,-50%)', zIndex: 10 }}>
        <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', background: 'var(--cyan-400)', opacity: 0.15, animation: 'pulse-ring 1.8s infinite ease-out' }} />
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--cyan-400)', border: '2px solid white', boxShadow: '0 0 12px var(--cyan-400)' }} />
        <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', background: 'rgba(6,182,212,0.9)', color: 'white', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
          YOUR LOCATION
        </div>
      </div>

      {/* Rescue vehicle */}
      <div style={{ position: 'absolute', left: 100, top: 90, transform: 'translate(-50%,-50%)', zIndex: 10, animation: 'pulse-ring 1.2s infinite ease-out' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--orange-400)', border: '2px solid white', boxShadow: '0 0 14px var(--orange-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Car size={10} color="white" />
        </div>
        <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', background: 'rgba(249,115,22,0.9)', color: 'white', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
          RESCUE VEHICLE
        </div>
      </div>

      {/* ETA label */}
      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.65)', border: '1px solid var(--orange-400)', borderRadius: 6, padding: '6px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>ETA</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--orange-400)', fontFamily: 'var(--font-mono)' }}>{eta}</div>
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 12 }}>
        {[
          { color: 'var(--cyan-400)', label: "Friend" },
          { color: 'var(--orange-400)', label: "Rescue vehicle" },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.45)', padding: '3px 8px', borderRadius: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function UserSOS() {
  const [activeTab, setActiveTab] = useState('send');
  const [contacts, setContacts] = useState(initContacts);
  const [sent, setSent] = useState(false);
  const [safe, setSafe] = useState(false);
  const [sosType, setSosType] = useState('flood');
  const [sosDesc, setSosDesc] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', relation: '', phone: '', notify: true });
  const [eta] = useState("4 minutes");
  const [safeChecked, setSafeChecked] = useState(false);

  const toggleContact = (id) => setContacts(prev => prev.map(c => c.id === id ? { ...c, notify: !c.notify } : c));
  const removeContact = (id) => setContacts(prev => prev.filter(c => c.id !== id));

  const handleSendSOS = () => {
    if (!sosDesc.trim()) return;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const handleSafeCheck = () => {
    setSafeChecked(true);
    setSafe(true);
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return;
    setContacts(prev => [...prev, { id: `ct${Date.now()}`, ...newContact }]);
    setNewContact({ name: '', relation: '', phone: '', notify: true });
    setShowAddContact(false);
  };

  const tabs = [
    { id: 'send', label: "Send SOS", icon: AlertTriangle },
    { id: 'track', label: "Rescue tracking", icon: Navigation },
    { id: 'safety', label: "Confirmed safety", icon: ShieldCheck },
    { id: 'contacts', label: "Contact urgently", icon: PhoneCall },
    { id: 'info', label: "Emergency information", icon: LifeBuoy },
  ];

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>SOS & Rescue Center</h1>
        <p>Submit rescue requests, track rescue vehicles in real time, and manage emergency contacts</p>
      </div>

      <div className="tabs-nav" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── GỬI SOS ── */}
      {activeTab === 'send' && (
        <div className="grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16, color: 'var(--red-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} /> Submit an emergency rescue request
            </div>

            {/* SOS type */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Incident type</div>
              <div className="grid grid-2" style={{ gap: 8 }}>
                {SOS_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSosType(t.id)}
                      style={{
                        padding: '10px 12px', borderRadius: 'var(--r-md)', border: `1px solid ${sosType === t.id ? 'var(--red-400)' : 'var(--border-dim)'}`,
                        background: sosType === t.id ? 'rgba(239,68,68,0.08)' : 'transparent',
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={14} color={sosType === t.id ? 'var(--red-400)' : 'var(--text-muted)'} />
                      <span style={{ fontSize: '0.78rem', color: sosType === t.id ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: sosType === t.id ? 700 : 400 }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GPS */}
            <div style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(6,182,212,0.06)', border: '1px solid var(--border-dim)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Crosshair size={14} color="var(--cyan-400)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>GPS location determined</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>10.8564° N, 106.6234° E · To Ky Street, District 12, HCMC</div>
              </div>
              <span className="badge badge-green" style={{ fontSize: '0.58rem' }}>GPS ✓</span>
            </div>

            <textarea
              className="input"
              rows={4}
              placeholder="Describe your emergency situation (car stalled, traffic jam, need medical aid...)..."
              value={sosDesc}
              onChange={e => setSosDesc(e.target.value)}
              style={{ marginBottom: 12 }}
            />

            <button
              className="btn btn-danger"
              onClick={handleSendSOS}
              style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, padding: '14px', letterSpacing: '0.06em' }}
            >
              <Radio size={18} /> SEND AN EMERGENCY SOS SIGNAL
            </button>

            {sent && (
              <div className="alert-banner success" style={{ marginTop: 12 }}>
                <CheckCircle size={14} color="var(--green-400)" />
                <span style={{ fontSize: '0.82rem', color: 'var(--green-400)', fontWeight: 600 }}>
                  ✓ SOS signal has been sent! The nearest volunteer is being notified.
                </span>
              </div>
            )}
          </div>

          <div className="card p-5" style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <div className="section-title">Emergency instructions</div>
            {[
              { step: '1', text: "Choose the issue type that's appropriate for your situation" },
              { step: '2', text: "The system automatically retrieves the device's GPS location" },
              { step: '3', text: "Briefly describe the situation for faster rescue" },
              { step: '4', text: "Click SEND SOS — volunteers will be dispatched immediately" },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid var(--red-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.68rem', fontWeight: 800, color: 'var(--red-400)' }}>{s.step}</div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.text}</span>
              </div>
            ))}
            <div className="alert-banner warning" style={{ marginTop: 4 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem' }}>Rescue information will be publicly displayed on the map so other users and volunteers can assist.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── THEO DÕI CỨU HỘ ── */}
      {activeTab === 'track' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="flex items-center gap-2">
                <Navigation size={14} color="var(--orange-400)" />
                <div className="section-title">Real-time rescue vehicle tracking map</div>
              </div>
              <div className="live-indicator"><div className="live-dot" /> REALTIME</div>
            </div>
            <div style={{ padding: 16 }}>
              <RescueMap eta={eta} />
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="section-title">Request processing status</div>
              <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>PROCESSING</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ position: 'relative' }}>
                {trackingSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < trackingSteps.length - 1 ? 4 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: step.status === 'done' ? 'var(--green-400)' : step.status === 'active' ? 'var(--orange-400)' : 'var(--bg-elevated)',
                        border: step.status === 'pending' ? '1px solid var(--border-dim)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: step.status === 'active' ? '0 0 12px var(--orange-400)' : 'none',
                      }}>
                        {step.status === 'done' ? <CheckCircle size={14} color="white" /> :
                          step.status === 'active' ? <Activity size={14} color="white" style={{ animation: 'pulse 1s infinite' }} /> :
                          <Clock size={12} color="var(--text-muted)" />}
                      </div>
                      {i < trackingSteps.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 28, background: step.status === 'done' ? 'var(--green-400)' : 'var(--border-dim)', margin: '4px 0' }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < trackingSteps.length - 1 ? 20 : 0, paddingTop: 2 }}>
                      <div style={{ fontWeight: step.status === 'active' ? 700 : 500, fontSize: '0.88rem', color: step.status === 'active' ? 'var(--orange-400)' : step.status === 'done' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{step.desc}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {step.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── XÁC NHẬN AN TOÀN ── */}
      {activeTab === 'safety' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16, color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={15} /> Check-in safely after the incident
            </div>

            {!safeChecked ? (
              <>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                  Once you have escaped the emergency situation and are in a safe state, confirm the system to close the rescue session, stop monitoring, and notify your emergency contacts.
                </p>

                <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    When confirming safety, the system will:
                    <ul style={{ paddingLeft: 16, marginTop: 8, display: 'grid', gap: 4 }}>
                      <li>Record SOS/rescue session completed</li>
                      <li>Stop real-time location tracking</li>
                      <li>Update incident status to "Finished"</li>
                      <li>Notify your emergency contact</li>
                      <li>Save history and last check-in location</li>
                    </ul>
                  </div>
                </div>

                <button
                  className="btn btn-success"
                  onClick={handleSafeCheck}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700, padding: '12px' }}
                >
                  <ShieldCheck size={16} /> I'M SAFE
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '3px solid var(--green-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={32} color="var(--green-400)" />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-400)', marginBottom: 8 }}>Confirmed safe!</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  The rescue session has been closed. Your emergency contact has been notified.
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Statistics of rescue sessions</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { label: "When to send SOS", value: "14:32 today" },
                { label: "Volunteer support", value: "Nguyen Van An" },
                { label: "Response time", value: "< 3 minutes" },
                { label: "Current status", value: safeChecked ? "Finished ✓" : "Processing" },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--r-sm)', background: 'rgba(18,29,40,0.5)', border: '1px solid var(--border-dim)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LIÊN HỆ KHẨN CẤP ── */}
      {activeTab === 'contacts' && (
        <div style={{ maxWidth: 680 }}>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="section-title">Emergency contact list</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddContact(p => !p)}>
                <Plus size={13} /> Add contact
              </button>
            </div>

            {showAddContact && (
              <div style={{ padding: '14px 18px', background: 'rgba(6,182,212,0.04)', borderBottom: '1px solid var(--border-dim)', display: 'grid', gap: 10 }}>
                <div className="grid grid-2" style={{ gap: 10 }}>
                  <input className="input" placeholder="Full name *" value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} />
                  <input className="input" placeholder="Relationship (Example: Mom, Brother...)" value={newContact.relation} onChange={e => setNewContact(p => ({ ...p, relation: e.target.value }))} />
                </div>
                <input className="input" placeholder="Phone number *" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newContact.notify} onChange={() => setNewContact(p => ({ ...p, notify: !p.notify }))} />
                    Get notified when I send an SOS or check-in safely
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAddContact(false)}><X size={12} /> Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={addContact}><Save size={12} /> Save</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding: '12px 16px', display: 'grid', gap: 10 }}>
              {contacts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No emergency contact yet. Add your family phone number to receive notifications when there is a problem.
                </div>
              )}
              {contacts.map(c => (
                <div key={c.id} style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PhoneCall size={15} color="var(--cyan-400)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.relation && `${c.relation} · `}{c.phone}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bell size={12} color={c.notify ? 'var(--cyan-400)' : 'var(--text-muted)'} />
                      <label className="toggle">
                        <input type="checkbox" checked={c.notify} onChange={() => toggleContact(c.id)} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 6px' }} onClick={() => removeContact(c.id)}>
                      <Trash2 size={13} color="var(--red-400)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="alert-banner info">
            <Bell size={14} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Contacts with notifications enabled will receive an automatic SMS/email when you send an SOS or safety confirmation, with last location (if sharing is allowed).
            </span>
          </div>
        </div>
      )}

      {/* ── TRUNG TÂM THÔNG TIN KHẨN CẤP ── */}
      {activeTab === 'info' && (
        <div>
          <div className="alert-banner info" style={{ marginBottom: 16 }}>
            <MapPin size={14} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              List of essential services closest to you — data from OpenStreetMap · Overpass API
            </span>
          </div>

          {[
            { group: "Hospitals & Healthcare", types: ['hospital', 'clinic'] },
            { group: "Pharmacy", types: ['pharmacy'] },
            { group: "Rescue & Shelter", types: ['rescue', 'shelter'] },
          ].map(g => {
            const items = emergencyServices.filter(s => g.types.includes(s.type));
            return (
              <div key={g.group} style={{ marginBottom: 20 }}>
                <div className="section-title" style={{ marginBottom: 12 }}>{g.group}</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {items.map(svc => {
                    const Icon = svc.icon;
                    return (
                      <div key={svc.name} style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(18,29,40,0.5)' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: svc.color + '15', border: `1px solid ${svc.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={18} color={svc.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>{svc.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{svc.address}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: svc.color }}>{svc.dist}</div>
                          <a href={`tel:${svc.phone}`} style={{ fontSize: '0.7rem', color: 'var(--cyan-400)', textDecoration: 'none' }}>
                            <Phone size={10} style={{ display: 'inline', marginRight: 3 }} />{svc.phone}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
