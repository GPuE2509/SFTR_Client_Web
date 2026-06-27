import React, { useState, useEffect } from 'react';
import {
  Users, Cpu, AlertTriangle, TrendingUp, MapPin,
  Activity, Zap, Radio, Navigation, Eye, CheckCircle,
  Clock, ChevronRight, Droplets, Wind, Cloud, Layers,
  BarChart2, Thermometer, Target, Siren, Shield, FileText,
  Users2, PhoneCall
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { FloodTrendChart, IoTStatusChart, UserGrowthChart } from '../../components/charts/Charts';
import { sosAlerts, iotStatusData, userGrowthData } from '../../data/mockData';

/* ══════════════════════════════════════════
   REMOVED OLD CANVAS FLOOD MAP
   ══════════════════════════════════════════ */

/* ══════════════════════════════════════════
   SOS ALERT ITEM
   ══════════════════════════════════════════ */
function SosItem({ alert }) {
  const cfg = {
    critical: { color:'var(--red-400)',    bg:'rgba(207,52,64,0.08)',  border:'rgba(207,52,64,0.25)',  icon:'SOS', pulse: true },
    high:     { color:'var(--orange-400)', bg:'rgba(225,132,60,0.07)', border:'rgba(225,132,60,0.2)',  icon:'ALR', pulse: false },
    medium:   { color:'var(--gold-400)',   bg:'rgba(200,162,75,0.07)', border:'rgba(200,162,75,0.2)',  icon:'LOC', pulse: false },
  }[alert.severity] || { color:'var(--blue-300)', bg:'rgba(61,125,176,0.06)', border:'rgba(120,150,175,0.2)', icon:'IOT', pulse: false };

  return (
    <div className="feed-item">
      <div style={{
        width:34, height:34, borderRadius:'50%',
        background:cfg.bg, border:`1px solid ${cfg.border}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'0.9rem', flexShrink:0,
        ...(cfg.pulse ? { animation:'glow-pulse-red 2s ease-in-out infinite' } : {}),
      }}>
        {cfg.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="flex items-center gap-2" style={{ marginBottom:2 }}>
          <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{alert.id}</span>
          <span style={{ fontSize:'0.6rem', fontWeight:800, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`, padding:'1px 7px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            {alert.type}
          </span>
          {{pending:   <span className="badge badge-orange" style={{fontSize:'0.58rem'}}>WAITING FOR PROCESSING</span>,
            processing:<span className="badge badge-blue"   style={{fontSize:'0.58rem'}}>PROCESSING</span>,
            resolved:  <span className="badge badge-green"  style={{fontSize:'0.58rem'}}>PROCESSED</span>,
          }[alert.status]}
        </div>
        <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {alert.location} · <span style={{ color:'var(--text-muted)' }}>{alert.user}</span>
        </div>
        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:2 }}>{alert.message}</div>
      </div>
      <div style={{ fontSize:'0.65rem', color:'var(--cyan-400)', whiteSpace:'nowrap', fontFamily:'var(--font-mono)', fontWeight:600 }}>
        {alert.time}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   WEATHER WIDGET
   ══════════════════════════════════════════ */
function WeatherWidget() {
  return (
    <div className="bracketed" style={{
      background:'linear-gradient(135deg, rgba(61,125,176,0.12) 0%, rgba(18,29,40,0.2) 100%)',
      border:'1px solid rgba(120,150,175,0.25)',
      borderRadius:'var(--r-lg)',
      padding:'18px 20px',
    }}>
      <div style={{ fontSize:'0.62rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:'var(--font-sans)', marginBottom:14 }}>
        Ho Chi Minh City weather — NowCast
      </div>
      <div className="flex items-center gap-4">
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(61,125,176,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Cloud size={28} color="var(--blue-300)" />
        </div>
        <div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'2.1rem', fontWeight:800, color:'var(--text-primary)', lineHeight:1 }}>28°C</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:4, fontWeight: 500 }}>Moderate rain · Humidity 89%</div>
        </div>
        <div style={{ marginLeft:'auto', display:'grid', gap:8 }}>
          {[
            { icon:Wind,     val:'18 km/h',  label:"Wind",    color:'var(--cyan-400)' },
            { icon:Droplets, val:'89%',      label:"Warm",     color:'var(--blue-300)' },
            { icon:Cloud,    val:'94%',      label:"Rain",    color:'var(--text-secondary)' },
          ].map(({ icon: Icon, val, label, color }) => (
            <div key={label} className="flex items-center gap-2" style={{ fontSize:'0.72rem' }}>
              <Icon size={12} color={color} />
              <span style={{ color:'var(--text-secondary)' }}>{label}:</span>
              <span style={{ color:'var(--text-primary)', fontWeight:600, fontFamily:'var(--font-mono)' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--border-dim)', fontSize:'0.7rem', color:'var(--orange-400)', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
        <span>Warning:</span>
        <span style={{ color:'var(--text-primary)' }}>Rain increasing to 60–80mm this evening</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ACTIVE VOLUNTEER SQUADS
   ══════════════════════════════════════════ */
function ActiveVolunteerSquads() {
  const squads = [
    { name: "District 12 SOS Team", members: "12 Soldiers", area: "Red Zone District 12", status: 'deploying', phone: '0901.113.123' },
    { name: "Go Vap Special Task Force Detachment", members: "8 Soldiers", area: "Nguyen Van Cong", status: 'active', phone: '0912.224.345' },
    { name: "Navy Rescue Platoon PK4", members: "24 Soldiers", area: "Thu Duc Surrounding Area", status: 'standby', phone: '0988.999.004' },
    { name: "City Fire Prevention and Control Police", members: "15 Soldiers", area: "Tran Nao Street, District 2", status: 'deploying', phone: '0905.777.888' },
    { name: "Red Cross Volunteer Team", members: "10 Volunteers", area: "Binh Chanh", status: 'standby', phone: '0933.444.555' },
  ];

  return (
    <div className="card bracketed p-4 flex-1">
      <div className="section-title" style={{ marginBottom: 14, fontSize: '0.68rem' }}>
        RESCUE COORDINATION FORCE
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {squads.map((sq, i) => (
          <div key={i} className="flex items-center justify-between p-3" style={{
            background: 'rgba(61,125,176,0.06)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--r-md)',
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sq.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {sq.members} · {sq.area}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)', marginTop: 2, display:'flex', alignItems:'center', gap: 4 }}>
                <PhoneCall size={10} /> {sq.phone}
              </div>
            </div>
            <div>
              {{
                deploying: <span className="badge badge-orange" style={{ fontSize: '0.58rem' }}>COORDINATING</span>,
                active:    <span className="badge badge-red"   style={{ fontSize: '0.58rem' }}>RESCUE IS ON</span>,
                standby:   <span className="badge badge-blue"  style={{ fontSize: '0.58rem' }}>WAITING FOR COMBAT</span>,
              }[sq.status]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   DASHBOARD PAGE
   ══════════════════════════════════════════ */
export default function Dashboard() {
  const [liveAlerts, setLiveAlerts] = useState(sosAlerts);
  const [glowing,    setGlowing]    = useState(false);
  const [activeTab,  setActiveTab]  = useState('live'); // 'live' | 'analytics' | 'ops'

  // Simulate incoming SOS every 8s
  useEffect(() => {
    const interval = setInterval(() => {
      const locs = ["District 8","Binh Duong","Dong Nai",'Long An',"Tay Ninh"];
      setLiveAlerts(prev => [{
        id: `SOS-${Math.floor(Math.random()*900+100)}`,
        type: Math.random()>0.5 ? 'SOS' : 'FLOOD',
        severity: Math.random()>0.55 ? 'critical' : 'high',
        location: locs[Math.floor(Math.random()*locs.length)] + ', VN',
        user: `User #${Math.floor(Math.random()*9000+1000)}`,
        time: new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}),
        message:"New flooding detected, need to check immediately",
        status:'pending',
      }, ...prev.slice(0,7)]);
      setGlowing(true);
      setTimeout(()=>setGlowing(false), 3000);
    }, 8000);
    return ()=>clearInterval(interval);
  }, []);


  const adminCapabilities = [
    {
      title: "Community moderation",
      items: [
        "AI classifies flood reports",
        "Approve/reject report",
        "Announce public recommendations",
      ],
      tone: 'badge-blue',
    },
    {
      title: "Forum administration",
      items: [
        "Pending moderation queue",
        "Pin admin post",
        "Remove posts/hide violating comments",
      ],
      tone: 'badge-cyan',
    },
    {
      title: "Accounts & devices",
      items: [
        "Search/filter users",
        "Lock/unlock account",
        "IoT lifecycle monitoring",
      ],
      tone: 'badge-green',
    },
    {
      title: "System configuration",
      items: [
        "Turn on/off the main module",
        "Automatic warning threshold",
        "Archive & backup schedule",
      ],
      tone: 'badge-gold',
    },
    {
      title: "Rescue coordination",
      items: [
        "Emergency SOS queue",
        "Follow the rescue team",
        "Volunteer network & workshop",
      ],
      tone: 'badge-orange',
    },
    {
      title: "Reporting & compliance",
      items: [
        "Troubleshooting log",
        "Contribution point policy",
        "Export PDF/Excel reports",
      ],
      tone: 'badge-gray',
    },
  ];

  return (
    <div className="page-enter">

      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize:'1.35rem', marginBottom:4 }}>National Executive Board</h1>
            <p style={{ fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight: 500 }}>
              Flood warning monitoring and rescue coordination center
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ padding:'5px 12px', background:'rgba(207,52,64,0.08)', border:'1px solid rgba(207,52,64,0.25)', borderRadius:'var(--r-md)', fontSize:'0.68rem', fontWeight:700, color:'var(--red-400)', fontFamily:'var(--font-sans)', letterSpacing:'0.08em' }}>
              12 PENDING SOS REQUESTS
            </div>
            <div className="live-indicator">
              <div className="live-dot" />
              AUTOMATIC UPDATE 3s
            </div>
          </div>
        </div>
      </div>

      {/* ── High-Tech Tab Navigation Bar ── */}
      <div className="tabs-nav" style={{ marginBottom: 24, background: 'rgba(18, 29, 40, 0.7)', padding: 4, borderRadius: 'var(--r-md)' }}>
        <button
          className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
          style={{ padding: '10px 16px', fontSize: '0.8rem', fontWeight: 700 }}
        >
          COMPREHENSIVE MONITORING
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
          style={{ padding: '10px 16px', fontSize: '0.8rem', fontWeight: 700 }}
        >
          ANALYSIS & REPORTING
        </button>
        <button
          className={`tab-btn ${activeTab === 'ops' ? 'active' : ''}`}
          onClick={() => setActiveTab('ops')}
          style={{ padding: '10px 16px', fontSize: '0.8rem', fontWeight: 700 }}
        >
          RESCUE COORDINATOR
        </button>
        <button
          className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
          style={{ padding: '10px 16px', fontSize: '0.8rem', fontWeight: 700 }}
        >
          ADMINISTRATION & COMPLIANCE
        </button>
      </div>

      {/* ══════════════════════════════════════════
         TAB 1: LIVE SITUATIONAL AWARENESS
         ══════════════════════════════════════════ */}
      {activeTab === 'live' && (
        <div className="flex flex-col gap-5 page-enter">
          {/* Main 4 KPI Stat Cards */}
          <div className="grid grid-4">
            <StatCard
              title="Total users"
              value={5247}
              icon={Users}
              iconColor="var(--blue-neon)"
              iconBg="rgba(0,170,255,0.12)"
              trend={12.4}
            />
            <StatCard
              title="IoT Devices Active"
              value={248}
              suffix="/290"
              icon={Cpu}
              iconColor="var(--green-400)"
              iconBg="rgba(0,230,137,0.1)"
              trend={-2.1}
              variant="success"
            />
            <StatCard
              title="Natural Disaster Warning"
              value={89}
              icon={AlertTriangle}
              iconColor="var(--orange-400)"
              iconBg="rgba(255,122,26,0.12)"
              trend={34.5}
              variant="warning"
            />
            <StatCard
              title="SOS Emergency"
              value={12}
              icon={Zap}
              iconColor="var(--red-400)"
              iconBg="rgba(239,29,55,0.12)"
              trend={7}
              variant="alert"
              glowing
            />
          </div>

          {/* SOS alert feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* SOS Alert Feed */}
            <div
              className="card bracketed"
              style={{
                display:'flex', flexDirection:'column',
                transition:'box-shadow 0.5s',
                ...(glowing ? { boxShadow:'var(--shadow-red)', borderColor:'rgba(239,29,55,0.4)' } : {}),
              }}
            >
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border-dim)', background:'rgba(239,29,55,0.04)' }}>
                <div className="flex items-center justify-between">
                  <div className="section-title" style={{ color:'var(--red-400)' }}>SOS WARNING</div>
                  <div className="live-indicator">
                    <div className="live-dot" /> LIVE DATA
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginTop:10 }}>
                  {[
                    { label:"Urgent", count: liveAlerts.filter(a=>a.severity==='critical').length, color:'var(--red-400)' },
                    { label:"Medium", count: liveAlerts.filter(a=>a.severity==='high').length,     color:'var(--orange-400)' },
                    { label:"Processed",  count: liveAlerts.filter(a=>a.status==='resolved').length,   color:'var(--green-400)' },
                  ].map(c => (
                    <div key={c.label} style={{ textAlign:'center', padding:'5px', background:'rgba(0,0,0,0.2)', borderRadius:'var(--r-xs)', border:'1px solid var(--border-dim)' }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.1rem', fontWeight:800, color:c.color }}>{c.count}</div>
                      <div style={{ fontSize:'0.58rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex:1, overflow:'auto', padding:'4px 14px 8px', maxHeight:'400px' }}>
                {liveAlerts.map(a => <SosItem key={a.id+a.time} alert={a} />)}
              </div>

              <div style={{ padding:'8px 14px', borderTop:'1px solid var(--border-dim)' }}>
                <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent:'center', fontSize:'0.72rem', gap:6 }}>
                  SEE ALL REFLECTION <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
         TAB 2: DATA ANALYTICS & CHARTS
         ══════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-5 page-enter">
          {/* Spaced out Analytics KPI cards */}
          <div className="grid grid-3">
            <StatCard
              title="Report Waiting for approval"
              value={34}
              icon={FileText}
              iconColor="var(--gold-400)"
              iconBg="rgba(240,188,46,0.1)"
              trend={-5.2}
              variant="gold"
            />
            <StatCard
              title="IoT Devices Active"
              value={248}
              suffix="/290"
              icon={Cpu}
              iconColor="var(--green-400)"
              iconBg="rgba(0,230,137,0.1)"
              trend={-2.1}
              variant="success"
            />
            <StatCard
              title="Alert Today"
              value={89}
              icon={AlertTriangle}
              iconColor="var(--orange-400)"
              iconBg="rgba(255,122,26,0.12)"
              trend={34.5}
              variant="warning"
            />
          </div>

          {/* High level charts */}
          <div className="grid grid-3">
            {/* Flood Trend chart */}
            <div className="card bracketed" style={{ gridColumn:'span 2' }}>
              <div style={{ display:'flex', alignItems:'center', justifyBetween:'space-between', padding:'12px 18px', borderBottom:'1px solid var(--border-dim)' }} className="flex justify-between">
                <div className="section-title">FLOODING TRENDS — LAST 12 HOURS</div>
                <div className="flex items-center gap-5">
                  {[
                    ['#00aaff',"Water level"],
                    ['#ff7a1a',"Warning"],
                    ['#ef1d37',"Emergency SOS"]
                  ].map(([c,l])=>(
                    <div key={l} className="flex items-center gap-2">
                      <div style={{ width:16, height:2, background:c, borderRadius:1, boxShadow:`0 0 4px ${c}` }} />
                      <span style={{ fontSize:'0.68rem', color:'var(--text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding:'10px 16px 14px' }}>
                <FloodTrendChart />
              </div>
            </div>

            {/* IoT status donut chart */}
            <div className="card bracketed">
              <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border-dim)' }}>
                <div className="section-title">IOT MEASUREMENT STATION STATUS</div>
              </div>
              <div style={{ padding:'8px 16px 14px' }}>
                <IoTStatusChart data={iotStatusData} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop: 10 }}>
                  {iotStatusData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div style={{ width:8, height:8, borderRadius:2, background:d.color, flexShrink:0, boxShadow:`0 0 5px ${d.color}` }} />
                      <div>
                        <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{d.name}</div>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', fontWeight:800, color:'var(--text-primary)' }}>{d.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User growth line/bar chart */}
          <div className="card bracketed">
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border-dim)' }}>
              <div className="section-title">NATIONAL USER SYSTEM GROWTH (12 MONTHS)</div>
            </div>
            <div style={{ padding:'10px 16px 14px' }}>
              <UserGrowthChart data={userGrowthData} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
         TAB 3: TACTICAL OPERATIONS & WEATHER
         ══════════════════════════════════════════ */}
      {activeTab === 'ops' && (
        <div className="grid grid-2 page-enter">
          {/* Left Column: Weather + Quick Actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <WeatherWidget />

            <div className="card bracketed p-4">
              <div className="section-title" style={{ marginBottom:14, fontSize:'0.68rem' }}>
                QUICK RESPONSE OPERATION PANEL
              </div>
              <div style={{ display:'grid', gap:10 }}>
                {[
                  { icon:Radio,     label:"Broadcast emergency alerts throughout the system",    color:'var(--red-400)',    bg:'rgba(207,52,64,0.08)',  border:'rgba(207,52,64,0.22)' },
                  { icon:Navigation,label:"Activate rescue coordination",              color:'var(--orange-400)', bg:'rgba(225,132,60,0.08)', border:'rgba(225,132,60,0.22)' },
                  { icon:Eye,       label:"Look up community reports",               color:'var(--blue-300)',   bg:'rgba(61,125,176,0.08)', border:'rgba(120,150,175,0.25)' },
                  { icon:Activity,  label:"Monitor IoT network status",        color:'var(--green-400)',  bg:'rgba(62,169,123,0.08)', border:'rgba(62,169,123,0.22)' },
                ].map(({ icon:Icon, label, color, bg, border }, i) => (
                  <button
                    key={i}
                    className="flex items-center gap-3"
                    style={{
                      padding:'12px 14px',
                      background:bg,
                      border:`1px solid ${border}`,
                      borderRadius:'var(--r-md)',
                      cursor:'pointer',
                      transition:'all 0.2s',
                      width:'100%', textAlign:'left',
                      fontFamily:'inherit',
                    }}
                    onMouseEnter={e=>{
                      e.currentTarget.style.transform='translateX(6px)';
                      e.currentTarget.style.boxShadow=`0 0 16px ${bg}`;
                    }}
                    onMouseLeave={e=>{
                      e.currentTarget.style.transform='none';
                      e.currentTarget.style.boxShadow='none';
                    }}
                  >
                    <Icon size={15} color={color} />
                    <span style={{ fontSize:'0.82rem', color:'var(--text-primary)', fontWeight:600 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Active Volunteer Squads table */}
          <ActiveVolunteerSquads />
        </div>
      )}

      {/* ══════════════════════════════════════════
         TAB 4: ADMIN CAPABILITIES & COMPLIANCE
         ══════════════════════════════════════════ */}
      {activeTab === 'admin' && (
        <div className="page-enter" style={{ display: 'grid', gap: 18 }}>
          <div className="page-header" style={{ marginBottom: 6 }}>
            <h1>List of management capabilities</h1>
            <p>Synthesize administrative functions according to operational and compliance requirements</p>
          </div>

          <div className="grid grid-3">
            {adminCapabilities.map((cap) => (
              <div key={cap.title} className="card p-5">
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                  {cap.title}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {cap.items.map((item) => (
                    <span key={item} className={`badge ${cap.tone}`} style={{ fontSize: '0.64rem' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <div className="section-title" style={{ marginBottom: 12 }}>Operating notes</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Các chức năng quản trị được phân theo nhóm nghiệp vụ: giám sát, kiểm duyệt, cấu hình, điều phối cứu hộ và báo cáo tuân thủ.
              Mọi thay đổi cấu hình quan trọng đều cần lưu vết nhật ký và xuất báo cáo phục vụ kiểm tra định kỳ.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
