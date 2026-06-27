import React from 'react';
import {
  AlertTriangle, FileText, Cpu,
  ShieldCheck, Activity, ClipboardList,
  LifeBuoy, BarChart2,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { FloodTrendChart, IoTStatusChart, UserGrowthChart } from '../../components/charts/Charts';
import { communityReports, iotStatusData, userGrowthData, sosAlerts, supportTickets } from '../../data/mockData';

export default function ManagerDashboard() {
  const pendingReports = communityReports.filter(r => r.status === 'pending').length;
  const criticalSos = sosAlerts.filter(s => s.severity === 'critical').length;
  const openTickets = supportTickets.filter(t => t.status !== 'resolved').length;
  const iotIssues = iotStatusData
    .filter(d => d.name !== "Work")
    .reduce((sum, item) => sum + item.value, 0);

  const kpis = [
    {
      title: "Report awaiting approval",
      value: pendingReports,
      icon: FileText,
      iconColor: 'var(--orange-400)',
      iconBg: 'rgba(249,115,22,0.12)',
      trend: 6.4,
      variant: 'warning',
    },
    {
      title: "Serious SOS",
      value: criticalSos,
      icon: AlertTriangle,
      iconColor: 'var(--red-400)',
      iconBg: 'rgba(239,29,55,0.12)',
      trend: 2.1,
      variant: 'alert',
      glowing: true,
    },
    {
      title: "Open technical ticket",
      value: openTickets,
      icon: LifeBuoy,
      iconColor: 'var(--blue-400)',
      iconBg: 'rgba(26,108,255,0.12)',
      trend: -4.8,
      variant: 'default',
    },
    {
      title: "IoT needs testing",
      value: iotIssues,
      icon: Cpu,
      iconColor: 'var(--orange-400)',
      iconBg: 'rgba(249,115,22,0.12)',
      trend: 3.7,
      variant: 'warning',
    },
  ];

  return (
    <div className="page-enter">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: '1.35rem', marginBottom: 4 }}>Manager Control Dashboard</h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Synthesize operations, moderation, and system quality in real time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ padding: '5px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--r-md)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--green-400)', fontFamily: 'var(--font-sans)', letterSpacing: '0.08em' }}>
              96.1% AI AUTHENTICATION RATE
            </div>
            <div className="live-indicator">
              <div className="live-dot" />
              UPDATE 5s
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {kpis.map((k) => (
          <StatCard
            key={k.title}
            title={k.title}
            value={k.value}
            icon={k.icon}
            iconColor={k.iconColor}
            iconBg={k.iconBg}
            trend={k.trend}
            variant={k.variant}
            glowing={k.glowing}
          />
        ))}
      </div>



      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card p-6">
          <div className="section-title" style={{ marginBottom: 16 }}>Frequency of flooding & warnings (24 hours)</div>
          <FloodTrendChart />
        </div>
        <div className="card p-6">
          <div className="section-title" style={{ marginBottom: 16 }}>IoT device status</div>
          <IoTStatusChart data={iotStatusData} />
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {iotStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between" style={{ fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: item.color, fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card p-6">
          <div className="section-title" style={{ marginBottom: 16 }}>User growth</div>
          <UserGrowthChart data={userGrowthData} />
        </div>
        <div className="card p-6" style={{ display: 'grid', gap: 14 }}>
          <div className="section-title">Operating status</div>
          {[
            { label: "The report needs post-checking", value: '12', color: 'var(--orange-400)' },
            { label: "Request SOS to wait for routing", value: '4', color: 'var(--red-400)' },
            { label: "High priority technical ticket", value: '3', color: 'var(--blue-400)' },
            { label: "Device lost signal", value: '7', color: 'var(--orange-400)' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between" style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'rgba(61,125,176,0.08)', border: '1px solid var(--border-dim)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: row.color }}>{row.value}</span>
            </div>
          ))}
          <div className="alert-banner info" style={{ marginTop: 4 }}>
            <ShieldCheck size={16} color="var(--green-400)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Operational logs are being stored on a 30-day cycle and automatically backed up daily.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-3">
        {[
          { icon: ClipboardList, title: 'Incident Logs', desc: "Track incident lifecycle and action.", tone: 'rgba(26,108,255,0.12)' },
          { icon: Activity, title: 'Audit AI', desc: "Post-check accuracy and adjust policies.", tone: 'rgba(249,115,22,0.12)' },
          { icon: BarChart2, title: 'Export Center', desc: "Export PDF/Excel reports as needed.", tone: 'rgba(34,197,94,0.12)' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="card p-5">
              <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: item.tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color="var(--cyan-400)" />
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
