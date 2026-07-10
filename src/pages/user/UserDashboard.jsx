import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ShieldAlert, CloudRain, Clock, AlertTriangle, Search,
  Sun, CloudLightning, CloudDrizzle, Battery, Wifi, Thermometer,
  Layers, Plus, Trash2, Route, Wrench, Star, Phone, Navigation,
  X, ThumbsUp, ChevronDown, ChevronUp, Eye,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import LiveMap from '../../components/common/LiveMap';
import WeatherBanner from '../../components/weather/WeatherBanner';
import DeviceDetailPanel from '../../components/common/DeviceDetailPanel';
import { broadcastAdvisories, floodZones, mockDevices } from '../../data/mockData';
import { apiService } from '../../services/apiService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getWaterLevelBadge = (level, status, systemConfig, calib_empty_cm) => {
  const current = level || 0;
  if (current > 5) {
    return { label: `${Math.round(current * 10) / 10} cm`, className: 'badge-green', color: 'var(--green-400)', mapColor: '#22c55e' };
  }
  return { label: "No water", className: 'badge-gray', color: 'var(--text-muted)', mapColor: '#64748b' };
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
  const [zones, setZones]               = useState([]);
  const [showAddZone, setShowAddZone]   = useState(false);
  const [newZone, setNewZone]           = useState({ name: '', address: '', radius: 2, level: 'medium', lat: null, lng: null });
  const [activeNavRoute, setActiveNavRoute] = useState(null);
  const [detailDeviceId, setDetailDeviceId] = useState(null);
  const [systemConfig, setSystemConfig] = useState(null);
  const [focusWorkshopId, setFocusWorkshopId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.pinWorkshopId) {
      setFocusWorkshopId(location.state.pinWorkshopId);
      // Optional: Clear state after handling it so it doesn't trigger again on reload
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const fetchZones = async () => {
    try {
      const res = await apiService.get('/warning-zones');
      if (res && res.success && res.data && res.data.length > 0) {
        const formatted = res.data.map(z => ({
          id: z._id,
          name: z.zone_name,
          radius: (z.radius_meters || 2000) / 1000,
          level: z.level || 'medium',
          active: z.is_active,
          address: z.address || 'Custom Coordinates',
          lat: z.location?.coordinates ? z.location.coordinates[1] : 10.03711,
          lng: z.location?.coordinates ? z.location.coordinates[0] : 105.78825
        }));
        setZones(formatted);
      } else {
        setZones(initZones);
      }
    } catch (err) {
      console.error('Failed to load warning zones from backend:', err);
      setZones(initZones);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    if (token) {
      fetchZones();
    } else {
      setZones(initZones);
    }
  }, []);

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

  const updateZone = async (id, changes) => {
    const current = zones.find(z => z.id === id);
    if (!current) return;

    const payload = {};
    if (changes.name !== undefined) payload.zone_name = changes.name;
    if (changes.active !== undefined) payload.is_active = changes.active;
    if (changes.radius !== undefined) payload.radius_meters = changes.radius * 1000;
    if (changes.level !== undefined) payload.level = changes.level;

    try {
      const res = await apiService.put(`/warning-zones/${id}`, payload);
      if (res && res.success) {
        fetchZones();
      }
    } catch (err) {
      console.error('Failed to update warning zone:', err);
    }
  };

  const removeZone = async (id) => {
    try {
      const res = await apiService.delete(`/warning-zones/${id}`);
      if (res && res.success) {
        fetchZones();
      }
    } catch (err) {
      console.error('Failed to delete warning zone:', err);
    }
  };

  const handleMapClick = (latlng) => {
    setNewZone(prev => ({
      ...prev,
      lat: latlng.lat,
      lng: latlng.lng,
      address: `Coordinates: ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`
    }));
  };

  const addZone = async () => {
    if (!newZone.name) return;
    const lat = newZone.lat !== null ? newZone.lat : 10.03711 + (Math.random() - 0.5) * 0.1;
    const lng = newZone.lng !== null ? newZone.lng : 105.78825 + (Math.random() - 0.5) * 0.1;
    const radius_meters = (newZone.radius || 2) * 1000;

    try {
      const res = await apiService.post('/warning-zones', {
        zone_name: newZone.name,
        lat,
        lng,
        radius_meters,
        address: newZone.address || `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        is_active: true
      });
      if (res && res.success) {
        fetchZones();
      }
    } catch (err) {
      console.error('Failed to create warning zone:', err);
    }

    setNewZone({ name: '', address: '', radius: 2, level: 'medium', lat: null, lng: null });
    setShowAddZone(false);
  };

  return (
    <div className="page-enter">

      {/* ── WEATHER HEADER ── */}
      <WeatherBanner />

      {/* ── BẢN ĐỒ NGẬP LỤT — full-width, 1 hàng riêng ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 620, overflow: 'hidden', marginBottom: 20, position: 'relative' }}>
        <LiveMap height={620} hideWrapper onNavigate={onNavigate} onMapClick={handleMapClick} onClickDetail={(device) => setDetailDeviceId(device.id || device.device_code)} focusWorkshopId={focusWorkshopId}>
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

      {/* Warning Zones are managed directly inside the map sidebar panel */}

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
