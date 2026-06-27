import React, { useState, useEffect } from 'react';
import {
  Wrench, Star, TrendingUp, CheckCircle, Clock,
  Users, BarChart2, MapPin, Search, CloudRain, AlertTriangle,
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { broadcastAdvisories, mockDevices } from '../../data/mockData';
import { StatCard } from '../../components/common/StatCard';
import { FloodTrendChart } from '../../components/charts/Charts';
import LiveMap from '../../components/common/LiveMap';
import WeatherBanner from '../../components/weather/WeatherBanner';
import DeviceDetailPanel from '../../components/common/DeviceDetailPanel';

const getWaterLevelBadge = (level, status) => {
  if (status === 'offline' || status === 'error')
    return { label: "Lost connection", className: 'badge-gray', color: 'var(--text-muted)', mapColor: '#475569' };
  if (level >= 80) return { label: "Severe flooding", className: 'badge-red', color: 'var(--red-400)', mapColor: '#ef4444' };
  if (level >= 40) return { label: "Moderate flooding", className: 'badge-orange', color: 'var(--orange-400)', mapColor: '#f97316' };
  if (level > 0)  return { label: "Slight flooding", className: 'badge-blue', color: 'var(--cyan-400)', mapColor: '#06b6d4' };
  return { label: "Safe", className: 'badge-green', color: 'var(--green-400)', mapColor: '#22c55e' };
};

const pendingTasks = [
  { id: 'WO-041', customer: "Nguyen Van An", phone: '0901234567', service: "Motorcycle flooded - dry engine", location: "District 12 – Hiep Thanh", priority: 'urgent', time: '14:32', mechanic: null },
  { id: 'WO-042', customer: "Tran Thi Binh", phone: '0912345678', service: "Change electric bike tires", location: "Hoc Mon – Nguyen Van Qua", priority: 'normal', time: '14:28', mechanic: "Workshop Staff Tuan" },
  { id: 'WO-043', customer: "Le Minh Chau", phone: '0923456789', service: "Check battery & power", location: "Thu Duc – Go Dua", priority: 'urgent', time: '14:15', mechanic: null },
  { id: 'WO-044', customer: "Pham Quoc Dung", phone: '0934567890', service: "Tow the car to the workshop", location: "Go Vap – Nguyen Kiem", priority: 'normal', time: '13:55', mechanic: "Workshop Staff Hung" },
];

const recentCompleted = [
  { id: 'WO-038', customer: "Dinh Thi Hoa", service: "Dry the flooded car", time: '13:40', rating: 5, points: 25 },
  { id: 'WO-037', customer: "Hoang Minh Tuan", service: "Replace tire", time: '13:10', rating: 4, points: 20 },
  { id: 'WO-036', customer: "Nguyen Thi Lan", service: "General check", time: '12:45', rating: 5, points: 20 },
];

const mechanics = [
  { name: "Workshop Staff Tuan", status: 'busy', task: 'WO-042', tasks: 3 },
  { name: "Workshop Staff Hung", status: 'busy', task: 'WO-044', tasks: 4 },
  { name: "Workshop Staff Long", status: 'available', task: null, tasks: 2 },
  { name: "Workshop Staff Binh", status: 'off', task: null, tasks: 0 },
];

export default function WorkshopDashboard({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [devices, setDevices] = useState(mockDevices);
  const [detailDeviceId, setDetailDeviceId] = useState(null);

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
        }
      } catch (error) {
        console.error('Failed to fetch devices, using mock data:', error);
      }
    };
    fetchDevices();
    const intervalId = setInterval(fetchDevices, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const pendingCount = pendingTasks.filter(t => !t.mechanic).length;
  const busyMechanics = mechanics.filter(m => m.status === 'busy').length;
  const todayRevenue = 3850000;

  return (
    <div className="page-enter">
      <WeatherBanner />

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: '1.35rem', marginBottom: 4 }}>Car workshop dashboard</h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Track orders, mechanics and shop performance in real time
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 'var(--r-md)',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--green-400)',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green-400)', boxShadow: '0 0 8px var(--green-400)', animation: 'blink 2s ease-in-out infinite' }} />
            THE SHOP IS OPEN
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          title="Application awaiting assignment"
          value={pendingCount}
          icon={Wrench}
          iconColor="#f59e0b"
          iconBg="rgba(217,119,6,0.12)"
          trend={1.2}
          variant="warning"
        />
        <StatCard
          title="Workshop Staff is working"
          value={busyMechanics}
          icon={Users}
          iconColor="var(--cyan-400)"
          iconBg="rgba(69,179,192,0.12)"
          trend={0}
        />
        <StatCard
          title="Completed today"
          value={recentCompleted.length + 4}
          icon={CheckCircle}
          iconColor="var(--green-400)"
          iconBg="rgba(34,197,94,0.12)"
          trend={14.5}
          variant="success"
        />
        <StatCard
          title="Revenue today"
          value={todayRevenue}
          icon={TrendingUp}
          iconColor="var(--orange-400)"
          iconBg="rgba(249,115,22,0.12)"
          trend={8.2}
          suffix="D"
        />
      </div>

      {/* Flood Map synced with UserDashboard */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 480, overflow: 'hidden', marginBottom: 20 }}>
        <LiveMap height={480} hideWrapper onNavigate={onNavigate} onClickDetail={(device) => setDetailDeviceId(device.id || device.device_code)}>
          {detailDeviceId && <DeviceDetailPanel deviceId={detailDeviceId} onClose={() => setDetailDeviceId(null)} />}
        </LiveMap>
      </div>

      {/* Main Grid */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 0.6fr', gap: 16, marginBottom: 20 }}>
        {/* Pending tasks */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title">Vehicle repair order is pending</div>
            <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>{pendingTasks.length} single</span>
          </div>
          <div style={{ display: 'grid', gap: 0 }}>
            {pendingTasks.map((task, i) => (
              <div key={task.id} style={{
                padding: '12px 18px',
                borderBottom: i < pendingTasks.length - 1 ? '1px solid var(--border-dim)' : 'none',
                borderLeft: task.priority === 'urgent' ? '3px solid #f59e0b' : '3px solid var(--border-default)',
              }}>
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{task.id}</span>
                      {task.priority === 'urgent' && (
                        <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(217,119,6,0.15)', color: '#f59e0b', border: 'none' }}>URGENT</span>
                      )}
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{task.time}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 2 }}>{task.service}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />{task.location} · {task.customer}
                    </div>
                    {task.mechanic && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--green-400)', marginTop: 2 }}>
                        ✓ Assignment: {task.mechanic}
                      </div>
                    )}
                  </div>
                  {!task.mechanic && (
                    <button className="btn btn-sm" style={{ flexShrink: 0, background: 'rgba(217,119,6,0.15)', color: '#f59e0b', border: '1px solid rgba(217,119,6,0.3)' }}>
                      <Users size={12} /> Assignment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mechanics status */}
        <div className="card p-5">
          <div className="section-title" style={{ marginBottom: 14 }}>Workshop Staff status</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {mechanics.map((m) => (
              <div key={m.name} style={{
                padding: '10px 12px', borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border-dim)',
                borderLeft: m.status === 'available' ? '3px solid var(--green-400)' : m.status === 'busy' ? '3px solid #f59e0b' : '3px solid var(--border-dim)',
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{m.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {m.status === 'busy' ? `Working: ${m.task}` : m.status === 'available' ? "Ready" : "Shift break"}
                    </div>
                  </div>
                  <span className={`badge ${m.status === 'available' ? 'badge-green' : m.status === 'busy' ? 'badge-orange' : ''}`} style={{ fontSize: '0.62rem', ...(m.status === 'off' ? { background: 'rgba(71,85,105,0.3)', color: 'var(--text-muted)' } : {}) }}>
                    {m.status === 'available' ? "Idle" : m.status === 'busy' ? "Busy" : 'Off'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts + Recent */}
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card p-6">
          <div className="section-title" style={{ marginBottom: 16 }}>Water level trends (affecting vehicle repair needs)</div>
          <FloodTrendChart />
        </div>
        <div className="card p-6">
          <div className="section-title" style={{ marginBottom: 12 }}>Recently completed application</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {recentCompleted.map(t => (
              <div key={t.id} style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-dim)', background: 'rgba(34,197,94,0.04)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{t.customer} – {t.service}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{t.time}
                      <span style={{ margin: '0 6px' }}>·</span>
                      {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={s <= t.rating ? '#f59e0b' : 'none'} color={s <= t.rating ? '#f59e0b' : 'var(--border-default)'} style={{ display: 'inline' }} />)}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--orange-400)', fontSize: '0.88rem' }}>+{t.points}pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="card p-6">
        <div className="section-title" style={{ marginBottom: 12 }}>Flood warning - affecting Workshop operations</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {broadcastAdvisories.map(adv => (
            <div key={adv.id} className="alert-banner" style={{ margin: 0, background: adv.type === 'critical' ? 'rgba(239,29,55,0.06)' : 'rgba(61,125,176,0.06)', border: `1px solid ${adv.type === 'critical' ? 'rgba(239,29,55,0.2)' : 'var(--border-dim)'}` }}>
              <AlertTriangle size={14} color={adv.type === 'critical' ? 'var(--red-400)' : 'var(--orange-400)'} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{adv.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{adv.sentAt} · {adv.reach.toLocaleString('vi-VN')} receiver</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
