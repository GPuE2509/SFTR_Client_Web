import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, MapPin, Activity, Radio, Navigation, Thermometer, ShieldCheck, Search, CloudRain,
  ShieldAlert, CheckCircle, Clock, Zap, Heart, Users,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import LiveMap from '../../components/common/LiveMap';
import WeatherBanner from '../../components/weather/WeatherBanner';
import DeviceDetailPanel from '../../components/common/DeviceDetailPanel';
import { FloodTrendChart } from '../../components/charts/Charts';
import { sosAlerts, broadcastAdvisories } from '../../data/mockData';

const getWaterLevelBadge = (level, status) => {
  const current = level || 0;
  if (current > 5) {
    return { label: `${Math.round(current * 10) / 10} cm`, className: 'badge-green', color: 'var(--green-400)', mapColor: '#22c55e' };
  }
  return { label: "No water", className: 'badge-gray', color: 'var(--text-muted)', mapColor: '#64748b' };
};

const activeMissions = [
  { id: 'RES-047', type: 'SOS', location: "Ninh Kieu, Can Tho", victim: "Nguyen Van An", severity: 'critical', status: 'in_progress', eta: "~5 minutes", assigned: "Team Alpha", lat: 10.034189, lng: 105.781305 },
  { id: 'RES-048', type: 'SOS', location: "Cai Rang, Can Tho", victim: "Tran Thi Binh", severity: 'high', status: 'pending', eta: "~12 minutes", assigned: "Waiting for routing", lat: 10.009189, lng: 105.753305 },
  { id: 'RES-049', type: 'FLOOD', location: "Binh Thuy, Can Tho", victim: "Le Minh Chau", severity: 'critical', status: 'pending', eta: "~8 minutes", assigned: "Waiting for routing", lat: 10.071189, lng: 105.723305 },
];

const recentActivity = [
  { time: '14:38', label: "Received SOS #RES-047", type: 'accept' },
  { time: '14:32', label: "Complete mission #RES-045", type: 'done' },
  { time: '14:15', label: "Field report #RES-043", type: 'report' },
  { time: '13:50', label: "Confirm safety of victim #RES-041", type: 'safe' },
  { time: '13:22', label: "Start shift", type: 'start' },
];

const activityIcon = {
  accept: { color: 'var(--red-400)', dot: '🆘' },
  done:   { color: 'var(--green-400)', dot: '✅' },
  report: { color: 'var(--cyan-400)', dot: '📋' },
  safe:   { color: 'var(--green-400)', dot: '🛡️' },
  start:  { color: 'var(--text-muted)', dot: '▶️' },
};

export default function VolunteerDashboard({ onNavigate }) {
  const pendingCount = activeMissions.filter(m => m.status === 'pending').length;
  const inProgressCount = activeMissions.filter(m => m.status === 'in_progress').length;
  const [detailDeviceId, setDetailDeviceId] = useState(null);

  return (
    <div className="page-enter">
      <WeatherBanner />

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: '1.35rem', marginBottom: 4 }}>Rescue Volunteer Dashboard</h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Monitor rescue missions, SOS status and personal activities in real time
            </p>
          </div>
          <div className="live-indicator" style={{ color: 'var(--red-400)', borderColor: 'rgba(239,29,55,0.3)' }}>
            <div className="live-dot" style={{ background: 'var(--red-400)', boxShadow: '0 0 8px var(--red-400)' }} />
            UPDATE 5s
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          title="SOS waiting for routing"
          value={pendingCount}
          icon={ShieldAlert}
          iconColor="var(--red-400)"
          iconBg="rgba(239,29,55,0.12)"
          trend={1.5}
          variant="alert"
          glowing
        />
        <StatCard
          title="Task in progress"
          value={inProgressCount}
          icon={Navigation}
          iconColor="var(--orange-400)"
          iconBg="rgba(249,115,22,0.12)"
          trend={0.8}
          variant="warning"
        />
        <StatCard
          title="Completed today"
          value={7}
          icon={CheckCircle}
          iconColor="var(--green-400)"
          iconBg="rgba(34,197,94,0.12)"
          trend={12.5}
          variant="success"
        />
        <StatCard
          title="Volunteer points this week"
          value={380}
          icon={Heart}
          iconColor="var(--cyan-400)"
          iconBg="rgba(69,179,192,0.12)"
          trend={8.3}
        />
      </div>

      {/* ── BẢN ĐỒ LIVE ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 620, overflow: 'hidden', marginBottom: 20 }}>
        <LiveMap activeMissions={activeMissions} height={620} hideWrapper onNavigate={onNavigate} onClickDetail={(device) => setDetailDeviceId(device.id || device.device_code)}>
          {detailDeviceId && <DeviceDetailPanel deviceId={detailDeviceId} onClose={() => setDetailDeviceId(null)} />}
        </LiveMap>
      </div>

      {/* Main Grid */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 0.6fr', gap: 16, marginBottom: 20 }}>
        {/* Active Missions */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title">SOS request is active</div>
            <span className="badge badge-red" style={{ animation: 'blink 2s ease-in-out infinite' }}>{activeMissions.length} WAITING</span>
          </div>
          <div style={{ display: 'grid', gap: 0 }}>
            {activeMissions.map((mission, i) => (
              <div key={mission.id} style={{
                padding: '14px 18px',
                borderBottom: i < activeMissions.length - 1 ? '1px solid var(--border-dim)' : 'none',
                borderLeft: mission.severity === 'critical' ? '3px solid var(--red-400)' : '3px solid var(--orange-400)',
              }}>
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mission.id}</span>
                      <span className={`badge ${mission.severity === 'critical' ? 'badge-red' : 'badge-orange'}`} style={{ fontSize: '0.62rem' }}>
                        {mission.severity.toUpperCase()}
                      </span>
                      <span className={`badge ${mission.status === 'in_progress' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: '0.62rem' }}>
                        {mission.status === 'in_progress' ? "Processing" : "Waiting for routing"}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                      <MapPin size={13} style={{ display: 'inline', marginRight: 4, color: 'var(--text-muted)' }} />
                      {mission.location}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Victim: {mission.victim} · ETA: {mission.eta} · {mission.assigned}
                    </div>
                  </div>
                  {mission.status === 'pending' && (
                    <button className="btn btn-danger btn-sm" style={{ flexShrink: 0 }}>
                      <ShieldAlert size={12} /> Get the quest
                    </button>
                  )}
                  {mission.status === 'in_progress' && (
                    <button className="btn btn-success btn-sm" style={{ flexShrink: 0 }}>
                      <Navigation size={12} /> Monitor
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <div className="section-title" style={{ marginBottom: 14 }}>Recent activity</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {recentActivity.map((item, i) => {
              const style = activityIcon[item.type];
              return (
                <div key={i} className="flex items-start gap-3">
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                    background: style.color, boxShadow: `0 0 6px ${style.color}`,
                  }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: 3 }} /> {item.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Flood Trend + Broadcast */}
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card p-6">
          <div className="section-title" style={{ marginBottom: 16 }}>Water level trend (12h)</div>
          <FloodTrendChart />
        </div>
        <div className="card p-6">
          <div className="section-title" style={{ marginBottom: 12 }}>Broadcast announcement</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {broadcastAdvisories.map((adv) => (
              <div key={adv.id} style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-dim)', background: adv.type === 'critical' ? 'rgba(239,29,55,0.06)' : 'rgba(61,125,176,0.06)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{adv.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {adv.sentAt} · {adv.reach.toLocaleString('vi-VN')} receiver
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-3">
        {[
          { icon: ShieldAlert, title: "Get new SOS", desc: "View the SOS list waiting for routes and receive missions.", color: 'var(--red-400)', bg: 'rgba(239,29,55,0.1)' },
          { icon: Activity, title: "Field report", desc: "Update status and send mission reports.", color: 'var(--cyan-400)', bg: 'rgba(69,179,192,0.1)' },
          { icon: Users, title: "Volunteer support", desc: "View group information and coordinate rescue efforts.", color: 'var(--orange-400)', bg: 'rgba(249,115,22,0.1)' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="card p-5" style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={item.color} />
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
