import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import {
  Power, Database, Bell, Radio, Shield, Save, RefreshCw,
  AlertTriangle, CheckCircle, Clock, Sliders, ChevronRight,
  Send, Info, Zap,
} from 'lucide-react';
import { systemModules } from '../../data/mockData';

function ModuleCard({ mod, onToggle }) {
  return (
    <div
      className="card p-5"
      style={{
        borderLeft: `3px solid ${mod.status ? 'var(--green-500)' : 'var(--text-muted)'}`,
        transition: 'all 0.3s',
        ...(mod.status && mod.critical ? { boxShadow: '0 0 16px rgba(34,197,94,0.12)' } : {}),
      }}
    >
      <div className="flex items-start justify-between">
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
              {mod.name}
            </span>
            {mod.critical && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--red-400)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1px 7px', borderRadius: 99 }}>
                CRITICAL
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mod.description}</div>
          <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
            <div className={`pulse-dot ${mod.status ? 'green' : ''}`} style={{ width: 8, height: 8, background: mod.status ? 'var(--green-500)' : 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.75rem', color: mod.status ? 'var(--green-400)' : 'var(--text-muted)', fontWeight: 600 }}>
              {mod.status ? "Active" : "Turn off"}
            </span>
          </div>
        </div>
        <label className="toggle" style={{ marginLeft: 16 }}>
          <input type="checkbox" checked={mod.status} onChange={() => onToggle(mod.id)} />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  );
}

function AlertThresholdSlider({ label, value, onChange, min, max, unit, colorClass }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: `var(--${colorClass}-400)`, fontSize: '1rem' }}>
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
          background: `linear-gradient(to right, var(--${colorClass}-500) 0%, var(--${colorClass}-500) ${((value - min) / (max - min)) * 100}%, var(--bg-elevated) ${((value - min) / (max - min)) * 100}%, var(--bg-elevated) 100%)`,
        }}
      />
      <div className="flex justify-between" style={{ marginTop: 4 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{min}{unit}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function SystemConfig() {
  const [modules, setModules] = useState(systemModules);
  const [thresholds, setThresholds] = useState({
    waterLevelL1: 20,
    waterLevelL2: 40,
    waterLevelL3: 50,
    waterLevelL4: 60,
  });
  const [retention, setRetention] = useState({
    iotData: '90',
    reports: '365',
    logs: '30',
    backupFreq: 'daily',
  });
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 'ec1', name: "District 12 Rescue Center", phone: '0123456789', note: "24/7 hotline" },
  ]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await apiService.get('/iot/config');
        if (res.success && res.data) {
          const c = res.data;
          setThresholds({
            waterLevelL1: c.water_level_l1 ?? 20,
            waterLevelL2: c.water_level_l2 ?? 40,
            waterLevelL3: c.water_level_l3 ?? 50,
            waterLevelL4: c.water_level_l4 ?? 60,
          });
        }
      } catch (err) {
        console.error('Failed to fetch system config:', err);
      }
    };
    fetchConfig();
  }, []);

  const toggleModule = (id) => {
    setModules((prev) => prev.map((m) => m.id === id ? { ...m, status: !m.status } : m));
  };

  const handleWaterLevelChange = (levelIndex, value) => {
    setThresholds(prev => {
      const current = [
        prev.waterLevelL1,
        prev.waterLevelL2,
        prev.waterLevelL3,
        prev.waterLevelL4
      ];
      
      // Validation: lower level must be strictly less than higher level
      if (levelIndex === 0 && value >= current[1]) return prev;
      if (levelIndex === 1 && (value <= current[0] || value >= current[2])) return prev;
      if (levelIndex === 2 && (value <= current[1] || value >= current[3])) return prev;
      if (levelIndex === 3 && value <= current[2]) return prev;
      
      const keys = ['waterLevelL1', 'waterLevelL2', 'waterLevelL3', 'waterLevelL4'];
      return {
        ...prev,
        [keys[levelIndex]]: value
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiService.put('/auth/admin/config', {
        water_level_l1: thresholds.waterLevelL1,
        water_level_l2: thresholds.waterLevelL2,
        water_level_l3: thresholds.waterLevelL3,
        water_level_l4: thresholds.waterLevelL4,
      });
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>System Configuration</h1>
            <p>Module management, warning thresholds, data storage and system notifications</p>
          </div>
          <div className="flex gap-3">
            {saved && (
              <div className="flex items-center gap-2" style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: '0.875rem' }}>
                <CheckCircle size={15} /> Saved successfully!
              </div>
            )}
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : <><Save size={14} /> Save configuration</>}
            </button>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Module toggles */}
        <div>
          <div className="section-header">
            <div className="section-title">
              <Power size={15} style={{ color: 'var(--blue-400)' }} />
              System Module Management
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {modules.filter(m => m.status).length}/{modules.length} running
            </span>
          </div>

          {/* Warning */}
          <div className="alert-banner warning" style={{ marginBottom: 16 }}>
            <AlertTriangle size={16} color="var(--orange-400)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Turn off the module <strong>CRITICAL</strong> will seriously affect system operation.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {modules.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} onToggle={toggleModule} />
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Alert Thresholds */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 20 }}>
              <Sliders size={15} style={{ color: 'var(--blue-400)' }} />
              Automatic Warning Thresholds
            </div>
            <AlertThresholdSlider
              label="🌊 Water Level Warning (Level 1 - Slight)"
              value={thresholds.waterLevelL1}
              onChange={(v) => handleWaterLevelChange(0, v)}
              min={1} max={100} unit="%" colorClass="gold"
            />
            <AlertThresholdSlider
              label="🌊 Water Level Warning (Level 2 - Moderate)"
              value={thresholds.waterLevelL2}
              onChange={(v) => handleWaterLevelChange(1, v)}
              min={1} max={100} unit="%" colorClass="orange"
            />
            <AlertThresholdSlider
              label="🌊 Water Level Warning (Level 3 - Severe)"
              value={thresholds.waterLevelL3}
              onChange={(v) => handleWaterLevelChange(2, v)}
              min={1} max={100} unit="%" colorClass="red"
            />
            <AlertThresholdSlider
              label="🌊 Water Level Warning (Level 4 - Critical)"
              value={thresholds.waterLevelL4}
              onChange={(v) => handleWaterLevelChange(3, v)}
              min={1} max={100} unit="%" colorClass="purple"
            />
          </div>

          {/* Data Retention */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 20 }}>
              <Database size={15} style={{ color: 'var(--blue-400)' }} />
              Data Storage Calendar
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                { label: "IoT data", key: 'iotData', suffix: " day" },
                { label: "Community reporting", key: 'reports', suffix: " day" },
                { label: "System log", key: 'logs', suffix: " day" },
              ].map(({ label, key, suffix }) => (
                <div key={key} className="flex items-center justify-between">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="input"
                      style={{ width: 80, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                      value={retention[key]}
                      onChange={(e) => setRetention(p => ({ ...p, [key]: e.target.value }))}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{suffix}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Backup frequency</span>
                <select
                  className="input"
                  style={{ width: 140 }}
                  value={retention.backupFreq}
                  onChange={(e) => setRetention(p => ({ ...p, backupFreq: e.target.value }))}
                >
                  <option value="hourly">Per hour</option>
                  <option value="daily">Every day</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Push Provider Configuration (FE stub) */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 12 }}>
              <Radio size={15} style={{ color: 'var(--orange-400)' }} />
              Configure Push Provider
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Supplier</label>
                <select className="input" value={retention.pushProvider || 'fcm'} onChange={(e) => setRetention(p => ({ ...p, pushProvider: e.target.value }))}>
                  <option value="none">Do not use</option>
                  <option value="fcm">Firebase Cloud Messaging (FCM)</option>
                  <option value="apns">Apple Push (APNs)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Server Key / Auth Token</label>
                <input className="input" placeholder="Enter key or token (FE only)" value={retention.pushKey || ''} onChange={(e) => setRetention(p => ({ ...p, pushKey: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Note: This is a simulated interface; need backend to send actual push.</div>
                <button className="btn btn-primary btn-sm" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>Save</button>
              </div>
            </div>
          </div>

          {/* System Broadcast */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16 }}>
              <Radio size={15} style={{ color: 'var(--orange-400)' }} />
              Broadcast system-wide announcements
            </div>
            <textarea
              className="input"
              placeholder="Enter the text of the emergency notification to send to all users and devices..."
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              rows={3}
              style={{ marginBottom: 12 }}
            />
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Will send to 5,247 users and 248 IoT devices
              </span>
              <button className="btn btn-danger btn-sm" disabled={!broadcastMsg.trim()}>
                <Zap size={13} /> Play now
              </button>
            </div>
          </div>

          {/* Emergency Contacts (FE-only) */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 12 }}>
              <Info size={15} style={{ color: 'var(--blue-400)' }} />
              Emergency contact
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {emergencyContacts.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.phone} · {c.note}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEmergencyContacts(prev => prev.filter(x => x.id !== c.id))}>Erase</button>
                </div>
              ))}

              <EmergencyContactForm onAdd={(name, phone, note) => {
                const id = `ec-${Date.now()}`;
                setEmergencyContacts(prev => [{ id, name, phone, note }, ...prev]);
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmergencyContactForm({ onAdd }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
      <input className="input" placeholder="Contact name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className="input" placeholder="Notes (e.g. 24/7)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { if (!name || !phone) return alert("Enter your name and phone number"); onAdd(name, phone, note); setName(''); setPhone(''); setNote(''); }}>Add contact</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setName(''); setPhone(''); setNote(''); }}>Cancel</button>
      </div>
    </div>
  );
}
