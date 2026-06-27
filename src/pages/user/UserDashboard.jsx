import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ShieldAlert, CloudRain, Clock, AlertTriangle, Search,
  Sun, CloudLightning, CloudDrizzle, Battery, Wifi, Thermometer,
  Layers, Plus, Trash2, Route, Wrench, Star, Phone, Navigation,
  X, ThumbsUp, ChevronDown, ChevronUp, Eye,
} from 'lucide-react';
import LiveMap from '../../components/common/LiveMap';
import WeatherBanner from '../../components/weather/WeatherBanner';
import DeviceDetailPanel from '../../components/common/DeviceDetailPanel';
import { broadcastAdvisories, floodZones, mockDevices } from '../../data/mockData';
import { apiService } from '../../services/apiService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getWaterLevelBadge = (level, status, systemConfig, calib_empty_cm) => {
  if (status === 'offline' || status === 'error')
    return { label: "Lost connection", className: 'badge-gray', color: 'var(--text-muted)', mapColor: '#475569' };
  
  const calib = calib_empty_cm || 100;
  const pct = (level / calib) * 100;
  const l1 = systemConfig?.water_level_l1 ?? 20;
  const l2 = systemConfig?.water_level_l2 ?? 40;
  const l3 = systemConfig?.water_level_l3 ?? 50;
  const l4 = systemConfig?.water_level_l4 ?? 60;

  if (pct >= l4) return { label: "Critical flooding", className: 'badge-purple', color: 'var(--purple-400)', mapColor: '#a855f7' };
  if (pct >= l3) return { label: "Severe flooding", className: 'badge-red', color: 'var(--red-400)', mapColor: '#ef4444' };
  if (pct >= l2) return { label: "Moderate flooding", className: 'badge-orange', color: 'var(--orange-400)', mapColor: '#f97316' };
  if (pct >= l1) return { label: "Slight flooding", className: 'badge-gold', color: 'var(--gold-400)', mapColor: '#eab308' };
  return { label: "Safe", className: 'badge-green', color: 'var(--green-400)', mapColor: '#22c55e' };
};

function collapsedLabel(status) {
  return status === 'offline' || status === 'error';
}

const latLngMap = {
  'IOT-QU12-001': [10.034189, 105.781305],
  'IOT-HM-047':   [10.009189, 105.753305],
  'IOT-BC-023':   [10.071189, 105.723305],
  'IOT-TD-012':   [10.042345, 105.771234],
  'IOT-GV-089':   [10.021234, 105.761234],
  'IOT-BT-034':   [10.052345, 105.743456],
  'IOT-QU7-056':  [10.063456, 105.794567],
  'IOT-QU1-003':  [10.014567, 105.735678],
};

// ── Custom Zone Mock ──────────────────────────────────────────────────────────

const initZones = [
  { id: 'z1', name: "Home",    radius: 2, level: 'high',   active: true,  address: "Ninh Kieu, Can Tho",    lat: 10.034189, lng: 105.781305 },
  { id: 'z2', name: "Workplace", radius: 4, level: 'medium', active: true,  address: "Cai Rang, Can Tho", lat: 10.009189, lng: 105.753305 },
  { id: 'z3', name: "School",   radius: 3, level: 'low',    active: false, address: "Binh Thuy, Can Tho",    lat: 10.071189, lng: 105.723305 },
];

const levelColor = { high: 'var(--red-400)', medium: 'var(--orange-400)', low: 'var(--cyan-400)' };
const levelBadge = { high: 'badge-red', medium: 'badge-orange', low: 'badge-cyan' };

const ZONE_LEVELS = [
  { value: 'high',   label: "High risk" },
  { value: 'medium', label: "Medium"  },
  { value: 'low',    label: "Short"        },
];

const safeRoutes = [
  { id: 'r1', from: "House (District 12)", to: "Binh Thanh", normal: "Nguyen Huu Canh → Xo Viet Nghe Tinh", alt: "National Highway 13 → Bach Dang", reason: "Nguyen Huu Canh was flooded 60cm", saved: "12 minutes" },
  { id: 'r2', from: "House (District 12)", to: "City Center", normal: "Truong Chinh → CMT8", alt: "Highway 22 → Tan Ky Tan Quy → Au Co", reason: "Traffic jam + 40cm flooding", saved: "8 minutes" },
];


// ── Weather ───────────────────────────────────────────────────────────────────

const weatherData = {
  today: { temp: '29°C', condition: "Heavy thunderstorm", alert: "Warning of heavy tidal flooding", icon: CloudLightning },
  forecast: [
    { day: "Tomorrow", temp: '28°C', condition: "Scattered rain", icon: CloudDrizzle },
    { day: "Day after tomorrow", temp: '30°C', condition: "Cloudy",   icon: Sun },
  ],
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function UserDashboard({ role = 'user', workshopName = null, onNavigate }) {
  const [searchQuery, setSearchQuery]   = useState('');
  const [devices, setDevices]           = useState(mockDevices);
  const [selectedSensor, setSelectedSensor] = useState(mockDevices[0]);
  const [zones, setZones]               = useState(initZones);
  const [showAddZone, setShowAddZone]   = useState(false);
  const [newZone, setNewZone]           = useState({ name: '', address: '', radius: 2, level: 'medium' });
  const [activeNavRoute, setActiveNavRoute] = useState(null);
  const [detailDeviceId, setDetailDeviceId] = useState(null);
  const [systemConfig, setSystemConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await apiService.get('/iot/config');
        if (res.success && res.data) {
          setSystemConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch system config in UserDashboard:', err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await apiService.get('/iot/devices');
        if (res.success && res.data && res.data.length > 0) {
          const formatted = res.data.map(d => ({
            ...d,
            id: d.device_code || d._id,
            waterLevel: d.waterLevel || 0,
            status: d.status || 'active',
          }));
          setDevices(formatted);
          setSelectedSensor(prev => prev || formatted[0]);
        }
      } catch (error) {
        console.error('Failed to fetch devices, using mock data:', error);
      }
    };
    fetchDevices();
    const intervalId = setInterval(fetchDevices, 5000);
    return () => clearInterval(intervalId);
  }, []);


  const filteredDevices = devices.filter(d =>
    (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateZone = (id, changes) => setZones(prev => prev.map(z => z.id === id ? { ...z, ...changes } : z));
  const removeZone = (id) => setZones(prev => prev.filter(z => z.id !== id));
  const addZone = () => {
    if (!newZone.name) return;
    setZones(prev => [...prev, { id: `z${Date.now()}`, ...newZone, active: true, lat: 10.03711 + (Math.random() - 0.5) * 0.1, lng: 105.78825 + (Math.random() - 0.5) * 0.1 }]);
    setNewZone({ name: '', address: '', radius: 2, level: 'medium' });
    setShowAddZone(false);
  };

  return (
    <div className="page-enter">

      {/* ── WEATHER HEADER ── */}
      <WeatherBanner />

      {/* ── BẢN ĐỒ NGẬP LỤT — full-width, 1 hàng riêng ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 520, overflow: 'hidden', marginBottom: 20, position: 'relative' }}>
        <LiveMap height={520} hideWrapper onNavigate={onNavigate} onClickDetail={(device) => setDetailDeviceId(device.id || device.device_code)}>
          {detailDeviceId && <DeviceDetailPanel deviceId={detailDeviceId} onClose={() => setDetailDeviceId(null)} />}
        </LiveMap>
      </div>

      {/* Removed IoT telemetry & alerts card per request */}

      {/* ── BẢNG TRẠM CẢM BIẾN ── */}
      <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2">
            <CloudRain size={16} color="var(--cyan-400)" />
            <div className="section-title">List of sensor stations throughout the area</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="input-group" style={{ width: 180 }}>
              <Search size={12} className="input-icon" style={{ left: 10 }} />
              <input 
                className="input" 
                placeholder="Find station..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: 26, fontSize: '0.72rem', paddingLeft: 28, borderRadius: 14 }}
              />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Updated every 5 seconds</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'rgba(61,125,176,0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                {["Station code", "Station location", "The water level is flooded", "Risk level", "Update"].map(th => (
                  <th key={th} style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device, index) => {
                const badge = getWaterLevelBadge(device.waterLevel, device.status, systemConfig, device.calib_empty_cm);
                const isSelected = selectedSensor?.id === device.id;
                return (
                  <tr
                    key={device.id}
                    style={{ borderBottom: index < filteredDevices.length - 1 ? '1px solid var(--border-dim)' : 'none', background: isSelected ? 'rgba(6,182,212,0.06)' : index % 2 === 1 ? 'rgba(18,29,40,0.2)' : 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => setSelectedSensor(device)}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-secondary)' }}>{device.id}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{device.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{device.location} ({device.district})</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: badge.color, fontFamily: 'var(--font-mono)' }}>
                      {device.status === 'offline' || device.status === 'error' ? '---' : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div>{device.waterLevel} cm <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>({((device.waterLevel / (device.calib_empty_cm || 100)) * 100).toFixed(0)}%)</span></div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${badge.className}`} style={{ fontSize: '0.65rem', padding: '3px 8px' }}>{badge.label}</span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{device.lastReading}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── VÙNG CẢNH BÁO TÙY CHỈNH — full-width ── */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2">
            <Layers size={14} color="var(--orange-400)" />
            <div className="section-title">Custom warning area (circle with radius)</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddZone(p => !p)}>
            <Plus size={12} /> Add region
          </button>
        </div>

        {showAddZone && (
          <div style={{ padding: '14px 18px', background: 'rgba(6,182,212,0.04)', borderBottom: '1px solid var(--border-dim)', display: 'grid', gridTemplateColumns: '1fr 1fr 0.7fr 0.7fr auto', gap: 10, alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>Region name *</div>
              <input className="input" placeholder="Example: Private house" value={newZone.name} onChange={e => setNewZone(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>Area</div>
              <input className="input" placeholder="For example: District 12" value={newZone.address} onChange={e => setNewZone(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>Radius: <strong style={{ color: 'var(--cyan-400)' }}>{newZone.radius}km</strong></div>
              <input type="range" min={1} max={10} value={newZone.radius} onChange={e => setNewZone(p => ({ ...p, radius: Number(e.target.value) }))} style={{ width: '100%', marginTop: 8 }} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>Level</div>
              <select className="input" value={newZone.level} onChange={e => setNewZone(p => ({ ...p, level: e.target.value }))} style={{ fontSize: '0.78rem' }}>
                {ZONE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddZone(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={addZone}>Save</button>
            </div>
          </div>
        )}

        <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {zones.map(z => (
            <div key={z.id} style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', border: `1px solid ${z.active ? levelColor[z.level] + '55' : 'var(--border-dim)'}`, background: z.active ? levelColor[z.level] + '06' : 'transparent', opacity: z.active ? 1 : 0.55 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{z.name}</span>
                  <span className={`badge ${levelBadge[z.level]}`} style={{ fontSize: '0.58rem' }}>{ZONE_LEVELS.find(l => l.value === z.level)?.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label className="toggle">
                    <input type="checkbox" checked={z.active} onChange={() => updateZone(z.id, { active: !z.active })} />
                    <span className="toggle-slider" />
                  </label>
                  <button onClick={() => removeZone(z.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <Trash2 size={13} color="var(--red-400)" />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8 }}>{z.address}</div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Radius</span>
                  <strong style={{ color: levelColor[z.level] }}>{z.radius} km</strong>
                </div>
                <input type="range" min={1} max={10} value={z.radius} onChange={e => updateZone(z.id, { radius: Number(e.target.value) })} style={{ width: '100%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Removed 'Điều hướng an toàn' navigation suggestions per request */}

      {/* ── KHUYẾN CÁO AN TOÀN ── */}
      <div className="card p-6">
        <div className="section-title" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={15} color="var(--orange-400)" style={{ flexShrink: 0 }} />
          <span>Quick safety advice</span>
        </div>
        <div className="grid grid-3" style={{ gap: 14 }}>
          {[
            "Absolutely do not go through roads that are deeply flooded or have strong currents.",
            "Cut off household power sources that are flooded with water to avoid electrical leakage.",
            "Save a directory of local emergency rescue hotlines.",
          ].map((tip, i) => (
            <div key={i} style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: 'rgba(18,29,40,0.7)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
