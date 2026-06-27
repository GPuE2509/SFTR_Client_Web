import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, MapPin, CloudRain, Zap, ShieldAlert, ArrowRight,
  TrendingUp, Radio, Droplets, Wind, AlertTriangle, Users, Navigation,
  ChevronRight, Activity, Thermometer, ShieldCheck, Search, Sun, CloudLightning, CloudDrizzle, Battery, Wifi, User, Star, Award, CheckCircle2 } from 'lucide-react';
import LiveMap from '../../components/common/LiveMap';
import DeviceDetailPanel from '../../components/common/DeviceDetailPanel';
import WeatherBanner from '../../components/weather/WeatherBanner';
import 'leaflet/dist/leaflet.css';
import { broadcastAdvisories } from '../../data/mockData';
import { apiService } from '../../services/apiService';

export default function GuestHome({ onLoginToUser, onRegister }) {
  const [systemConfig, setSystemConfig] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [detailDeviceId, setDetailDeviceId] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await apiService.get('/iot/config');
        if (res.success && res.data) {
          setSystemConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch system config in GuestHome:', err);
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

  // Weather forecast data
  const weatherData = {
    today: { temp: '29°C', condition: "Heavy thunderstorm", alert: "Warning of heavy tidal flooding", icon: CloudLightning, color: 'var(--red-400)' },
    forecast: [
      { day: "Tomorrow", temp: '28°C', condition: "Scattered rain", icon: CloudDrizzle },
      { day: "Day after tomorrow", temp: '30°C', condition: "Cloudy", icon: Sun },
    ]
  };

  // Helper to get water level badge and styling
  const getWaterLevelBadge = (level, status, calib_empty_cm) => {
    if (status === 'offline' || status === 'error') {
      return { label: "Lost connection", className: 'badge-gray', color: 'var(--text-muted)', mapColor: '#475569' };
    }
    
    const calib = calib_empty_cm || 100;
    const pct = (level / calib) * 100;
    const l1 = systemConfig?.water_level_l1 ?? 20;
    const l2 = systemConfig?.water_level_l2 ?? 40;
    const l3 = systemConfig?.water_level_l3 ?? 50;
    const l4 = systemConfig?.water_level_l4 ?? 60;

    if (pct >= l4) {
      return { label: "Critical flooding", className: 'badge-purple', color: 'var(--purple-400)', mapColor: '#a855f7' };
    }
    if (pct >= l3) {
      return { label: "Severe flooding", className: 'badge-red', color: 'var(--red-400)', mapColor: '#ef4444' };
    }
    if (pct >= l2) {
      return { label: "Moderate flooding", className: 'badge-orange', color: 'var(--orange-400)', mapColor: '#f97316' };
    }
    if (pct >= l1) {
      return { label: "Slight flooding", className: 'badge-gold', color: 'var(--gold-400)', mapColor: '#eab308' };
    }
    return { label: "Safe", className: 'badge-green', color: 'var(--green-400)', mapColor: '#22c55e' };
  };

  // Filter sensors based on search box input
  const filteredDevices = devices.filter(d => 
    (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-enter">
      
      {/* ── WEATHER FORECAST HEADER (Xem dự báo thời tiết) ── */}
      <WeatherBanner />

      {/* ── INTERACTIVE FLOOD MAP (Xem bản đồ, vị trí trạm, mực nước cm, chi tiết điểm ngập) ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 520, overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
        <LiveMap hideWrapper height={520} onClickDetail={(device) => setDetailDeviceId(device.id || device.device_code)}>
          {detailDeviceId && <DeviceDetailPanel deviceId={detailDeviceId} onClose={() => setDetailDeviceId(null)} />}
        </LiveMap>
      </div>

      {/* ── REAL-TIME BULLETIN TABLE LIST (Xem điểm ngập công khai) ── */}
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
                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Station code</th>
                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Station location</th>
                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>The water level is flooded</th>
                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Risk level</th>
                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device, index) => {
                const badge = getWaterLevelBadge(device.waterLevel, device.status, device.calib_empty_cm);
                const isSelected = selectedSensor?.id === device.id;

                return (
                  <tr 
                    key={device.id} 
                    style={{ 
                      borderBottom: index < filteredDevices.length - 1 ? '1px solid var(--border-dim)' : 'none',
                      background: isSelected ? 'rgba(6,182,212,0.06)' : index % 2 === 1 ? 'rgba(18,29,40,0.2)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setSelectedSensor(device)}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {device.id}
                    </td>

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
                      <span className={`badge ${badge.className}`} style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                        {badge.label}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {device.lastReading}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Safety Tips Cards */}
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
            <div key={i} style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: 'rgba(18,29,40,0.7)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {tip}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// Small helper to quickly hide labels on offline/error sensors
function collapsedLabel(status) {
  return status === 'offline' || status === 'error';
}
