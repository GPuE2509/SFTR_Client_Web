import React, { useState } from 'react';
import {
  Users, Plus, Edit3, Trash2, Save, CheckCircle,
  Clock, Star, Phone, Wrench, Calendar, ToggleRight, XCircle,
} from 'lucide-react';

const SHIFTS = ["Morning (6am–2pm)", "Afternoon (2pm–10pm)", "Night (10pm–6am)", "All day"];
const SKILLS = ["Basic motorbike", "Car flooded", "Electricity & electronics", "Replace tire", "Towing the car", "Battery", "Tram"];

const initialMechanics = [
  {
    id: 'M01', name: "Nguyen Van Tuan", phone: '0901111111', age: 28,
    experience: "4 years", skills: ["Basic motorbike", "Car flooded", "Replace tire"],
    shift: "Morning (6am–2pm)", status: 'active', onDuty: true,
    tasks: 245, rating: 4.8, joinDate: '01/03/2024', salary: '8.500.000',
    currentTask: 'WO-042',
  },
  {
    id: 'M02', name: "Le Quoc Hung", phone: '0902222222', age: 35,
    experience: "8 years", skills: ["Basic motorbike", "Electricity & electronics", "Battery", "Tram"],
    shift: "Afternoon (2pm–10pm)", status: 'active', onDuty: true,
    tasks: 389, rating: 4.9, joinDate: '15/01/2023', salary: '11.000.000',
    currentTask: 'WO-044',
  },
  {
    id: 'M03', name: "Pham Thanh Long", phone: '0903333333', age: 24,
    experience: "2 years", skills: ["Basic motorbike", "Replace tire", "Towing the car"],
    shift: "All day", status: 'active', onDuty: false,
    tasks: 98, rating: 4.5, joinDate: '10/07/2025', salary: '7.000.000',
    currentTask: null,
  },
  {
    id: 'M04', name: "Tran Van Binh", phone: '0904444444', age: 30,
    experience: "5 years", skills: ["Basic motorbike", "Car flooded", "Towing the car", "Battery"],
    shift: "Night (10pm–6am)", status: 'inactive', onDuty: false,
    tasks: 162, rating: 4.6, joinDate: '20/06/2024', salary: '9.000.000',
    currentTask: null,
  },
];

export default function WorkshopMechanics({ linkRequests = [], onApproveLink, onRejectLink }) {
  const [mechanics, setMechanics] = useState(initialMechanics);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null); // mechanic ID being edited
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [newMechanic, setNewMechanic] = useState({
    name: '', phone: '', age: '', experience: '', skills: [], shift: "Morning (6am–2pm)", salary: '',
  });

  const toggleSkill = (mechId, skill) => {
    setMechanics(prev => prev.map(m => m.id === mechId
      ? { ...m, skills: m.skills.includes(skill) ? m.skills.filter(s => s !== skill) : [...m.skills, skill] }
      : m
    ));
  };

  const toggleNewSkill = (skill) => {
    setNewMechanic(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill],
    }));
  };

  const toggleOnDuty = (id) => {
    setMechanics(prev => prev.map(m => m.id === id ? { ...m, onDuty: !m.onDuty } : m));
  };

  const toggleStatus = (id) => {
    setMechanics(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active', onDuty: false } : m));
  };

  const deleteMechanic = (id) => {
    setMechanics(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const addMechanic = () => {
    if (!newMechanic.name.trim() || !newMechanic.phone.trim()) return;
    const m = { ...newMechanic, id: `M${Date.now()}`, status: 'active', onDuty: false, tasks: 0, rating: 5.0, joinDate: new Date().toLocaleDateString('vi-VN'), currentTask: null };
    setMechanics(prev => [m, ...prev]);
    setNewMechanic({ name: '', phone: '', age: '', experience: '', skills: [], shift: "Morning (6am–2pm)", salary: '' });
    setAdding(false);
  };

  const saveEdit = () => {
    setSaved(true);
    setEditing(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const onDutyCount = mechanics.filter(m => m.onDuty).length;
  const activeCount = mechanics.filter(m => m.status === 'active').length;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Vehicle repairman manager</h1>
            <p>Add, manage Workshop Staff, shifts and track performance</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <div className="flex items-center gap-2" style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: '0.875rem' }}><CheckCircle size={15} /> Saved</div>}
            <button className="btn btn-primary" onClick={() => setAdding(true)}>
              <Plus size={14} /> Add new workers
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "General Workshop Staff", value: mechanics.length, color: 'var(--cyan-400)' },
          { label: "Active", value: activeCount, color: 'var(--green-400)' },
          { label: "On duty", value: onDutyCount, color: '#f59e0b' },
          { label: "TB Review", value: (mechanics.reduce((s, m) => s + m.rating, 0) / mechanics.length).toFixed(1) + '★', color: 'var(--gold-400)' },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 600 }}>
        <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          <Users size={13} /> List of workers
        </button>
        <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          <Calendar size={13} /> Shift
        </button>
        <button className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
          <Clock size={13} /> Browse links
          {linkRequests.filter(r => r.status === 'pending').length > 0 && (
            <span style={{ marginLeft: 6, padding: '2px 6px', background: 'var(--red-500)', color: 'white', borderRadius: 10, fontSize: '0.62rem', fontWeight: 700 }}>
              {linkRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Add mechanic form */}
      {adding && (
        <div className="card p-6" style={{ marginBottom: 20, border: '1px solid rgba(217,119,6,0.3)' }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Add new Workshop Staff</div>
          <div className="grid grid-2" style={{ gap: 12, marginBottom: 12 }}>
            {[
              { key: 'name', label: "Full name", placeholder: "Nguyen Van X" },
              { key: 'phone', label: "Phone number", placeholder: '09xxxxxxxx' },
              { key: 'age', label: "Year old", placeholder: '25' },
              { key: 'experience', label: "Experience", placeholder: "Example: 3 years" },
              { key: 'salary', label: "Salary (VND)", placeholder: 'VD: 8.000.000' },
              { key: 'shift', label: "Shift", type: 'select' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                {f.type === 'select' ? (
                  <select className="input" value={newMechanic.shift} onChange={e => setNewMechanic(p => ({ ...p, shift: e.target.value }))}>
                    {SHIFTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <input className="input" placeholder={f.placeholder} value={newMechanic[f.key]} onChange={e => setNewMechanic(p => ({ ...p, [f.key]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>Professional skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SKILLS.map(skill => {
                const isActive = newMechanic.skills.includes(skill);
                return (
                  <button key={skill} onClick={() => toggleNewSkill(skill)} style={{
                    padding: '4px 10px', fontSize: '0.75rem', borderRadius: 999, cursor: 'pointer',
                    border: isActive ? '1px solid rgba(217,119,6,0.4)' : '1px solid var(--border-dim)',
                    background: isActive ? 'rgba(217,119,6,0.12)' : 'transparent',
                    color: isActive ? '#f59e0b' : 'var(--text-muted)',
                  }}>
                    {isActive ? '✓ ' : ''}{skill}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-success" onClick={addMechanic}><CheckCircle size={14} /> More workers</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tab: List */}
      {activeTab === 'list' && (
        <div className="grid" style={{ gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {mechanics.map(m => (
              <div key={m.id} className="card" style={{
                padding: '16px 18px',
                borderLeft: m.onDuty ? '3px solid #f59e0b' : m.status === 'inactive' ? '3px solid var(--border-dim)' : '3px solid var(--border-default)',
                opacity: m.status === 'inactive' ? 0.6 : 1,
                cursor: 'pointer',
                background: selected?.id === m.id ? 'rgba(217,119,6,0.06)' : undefined,
                transition: 'background 0.15s',
              }} onClick={() => setSelected(m)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3" style={{ flex: 1 }}>
                    <div className="user-avatar" style={{ width: 44, height: 44, fontSize: '0.85rem', flexShrink: 0, background: m.onDuty ? 'linear-gradient(135deg, #d97706, #f59e0b)' : undefined }}>
                      {m.name.split(' ').slice(-2).map(n => n[0]).join('')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{m.name}</span>
                        <span className={`badge ${m.status === 'active' ? (m.onDuty ? 'badge-orange' : 'badge-green') : ''}`} style={{ fontSize: '0.62rem', ...(m.status === 'inactive' ? { background: 'rgba(71,85,105,0.3)', color: 'var(--text-muted)' } : {}) }}>
                          {m.status === 'inactive' ? "Quit one's job" : m.onDuty ? "On duty" : "Waiting for work"}
                        </span>
                        {m.currentTask && <span className="badge badge-blue" style={{ fontSize: '0.6rem' }}>{m.currentTask}</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        <Phone size={11} style={{ display: 'inline', marginRight: 3 }} />{m.phone} · {m.experience} · {m.shift}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {m.skills.slice(0, 3).map(s => (
                          <span key={s} className="badge" style={{ fontSize: '0.6rem', background: 'rgba(217,119,6,0.1)', color: '#f59e0b', border: 'none', padding: '1px 6px' }}>{s}</span>
                        ))}
                        {m.skills.length > 3 && <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(71,85,105,0.2)', color: 'var(--text-muted)', border: 'none' }}>+{m.skills.length - 3}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginBottom: 4 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={s <= Math.round(m.rating) ? '#f59e0b' : 'none'} color={s <= Math.round(m.rating) ? '#f59e0b' : 'var(--border-default)'} />)}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.tasks} single</div>
                    <div className="flex gap-2" style={{ marginTop: 6 }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px' }} onClick={e => { e.stopPropagation(); setEditing(m.id); setSelected(m); }}>
                        <Edit3 size={12} />
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', color: 'var(--red-400)' }} onClick={e => { e.stopPropagation(); deleteMechanic(m.id); }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="card p-6" style={{ position: 'sticky', top: 20 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="section-title">Workshop Staff information</div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(null); setEditing(null); }}><XCircle size={14} /></button>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div className="user-avatar" style={{ width: 56, height: 56, fontSize: '1.1rem', margin: '0 auto 10px', background: selected.onDuty ? 'linear-gradient(135deg, #d97706, #f59e0b)' : undefined }}>
                  {selected.name.split(' ').slice(-2).map(n => n[0]).join('')}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{selected.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selected.experience} experience</div>
              </div>

              <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Phone number", value: selected.phone },
                  { label: "Year old", value: selected.age + " year old" },
                  { label: "Shift", value: selected.shift },
                  { label: "Day of work", value: selected.joinDate },
                  { label: "Wage", value: `${parseInt(selected.salary?.toString().replace(/\D/g, '') || '0').toLocaleString('vi-VN')}d/month` },
                  { label: "Total order", value: `${selected.tasks} single` },
                  { label: "Evaluate", value: `${selected.rating} ★` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-dim)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>Skill {editing === selected.id && "(click to edit)"}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {SKILLS.map(skill => {
                    const isActive = mechanics.find(m => m.id === selected.id)?.skills.includes(skill);
                    return (
                      <button key={skill} onClick={() => editing === selected.id && toggleSkill(selected.id, skill)} style={{
                        padding: '3px 8px', fontSize: '0.68rem', borderRadius: 999,
                        cursor: editing === selected.id ? 'pointer' : 'default',
                        border: isActive ? '1px solid rgba(217,119,6,0.4)' : '1px solid var(--border-dim)',
                        background: isActive ? 'rgba(217,119,6,0.12)' : 'transparent',
                        color: isActive ? '#f59e0b' : 'var(--text-muted)',
                      }}>{isActive ? '✓ ' : ''}{skill}</button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle controls */}
              <div style={{ display: 'grid', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-dim)' }}>
                <div className="flex items-center justify-between" style={{ padding: '8px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-dim)', background: 'rgba(61,125,176,0.04)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>On duty</span>
                  <label className="toggle">
                    <input type="checkbox" checked={mechanics.find(m => m.id === selected.id)?.onDuty || false} onChange={() => toggleOnDuty(selected.id)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--orange-400)', borderColor: 'var(--orange-400)' }} onClick={() => toggleStatus(selected.id)}>
                  <ToggleRight size={13} /> {mechanics.find(m => m.id === selected.id)?.status === 'active' ? "Suspension of Workshop Staff" : "Reactivate"}
                </button>
                {editing === selected.id ? (
                  <button className="btn btn-success btn-sm" onClick={saveEdit}><Save size={13} /> Save changes</button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(selected.id)}><Edit3 size={13} /> Edit</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Schedule */}
      {activeTab === 'schedule' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="section-title">Schedule for this week</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Workshop Staff</th>
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <th key={d} style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mechanics.filter(m => m.status === 'active').map((m, ri) => {
                  const shifts = [true, true, false, true, true, true, false];
                  return (
                    <tr key={m.id} style={{ borderBottom: ri < mechanics.length - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.shift}</div>
                      </td>
                      {shifts.map((on, di) => (
                        <td key={di} style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: 'var(--r-sm)',
                            background: on ? 'rgba(217,119,6,0.12)' : 'transparent',
                            border: on ? '1px solid rgba(217,119,6,0.3)' : '1px solid var(--border-dim)',
                            fontSize: '0.6rem', fontWeight: 700,
                            color: on ? '#f59e0b' : 'var(--text-dim)',
                          }}>
                            {on ? '✓' : '—'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Tab: Link Approvals */}
      {activeTab === 'approvals' && (
        <div className="card p-6">
          <div className="section-title" style={{ marginBottom: 16 }}>List of Workshop Staff link requirements</div>
          {linkRequests.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No affiliation required.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {linkRequests.map((req) => (
                <div key={req.id} className="card p-4" style={{ border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        {req.userName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Request a link to work as a helper at: <strong>{req.requestedShop}</strong> · Date sent: {req.date}
                      </div>
                    </div>
                    <div>
                      {req.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-success btn-sm" 
                            onClick={() => {
                              if (onApproveLink) onApproveLink(req.id);
                              // Add to mechanics list for visual simulation
                              const isExist = mechanics.some(m => m.name === req.userName);
                              if (!isExist) {
                                setMechanics(prev => [
                                  {
                                    id: `M-${Date.now()}`,
                                    name: req.userName,
                                    phone: '0988777666',
                                    age: 26,
                                    experience: "3 years",
                                    skills: ["Basic motorbike", "Car flooded"],
                                    shift: "Morning (6am–2pm)",
                                    status: 'active',
                                    onDuty: false,
                                    tasks: 0,
                                    rating: 5.0,
                                    joinDate: new Date().toLocaleDateString('vi-VN'),
                                    salary: '8.000.000',
                                    currentTask: null
                                  },
                                  ...prev
                                ]);
                              }
                            }}
                          >
                            Browse
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => onRejectLink && onRejectLink(req.id)}
                          >
                            Refuse
                          </button>
                        </div>
                      ) : (
                        <span className={`badge ${req.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                          {req.status === 'approved' ? "Approved" : "Refused"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
