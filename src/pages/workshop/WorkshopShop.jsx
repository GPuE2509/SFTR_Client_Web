import React, { useState, useEffect } from 'react';
import {
  Wrench, Save, CheckCircle, AlertTriangle, MapPin,
  Phone, Clock, Edit3, Plus, Trash2, ToggleLeft, ToggleRight,
  PauseCircle, XCircle, Camera, X
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

const customMarkerIcon = typeof window !== 'undefined' ? new L.divIcon({
  html: `<div style="display: flex; justify-content: center; align-items: center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--orange-400)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3" fill="rgba(255,140,0,0.3)"/></svg></div>`,
  className: 'custom-pin-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
}) : null;

const SERVICE_CATEGORIES = ["Basic repair", "Car flooded", "Towing mobile vehicles", "Replace tire", "Electricity & Batteries", "Maintenance"];
const DISTRICTS = ["District 1", "District 7", "District 12", "Binh Thanh", "Thu Duc", "Hoc Mon", "Go Vap", "Binh Chanh", "Tan Phu"];

const initialShop = {
  name: "Minh Chau Garage",
  owner: "Nguyen Minh Chau",
  phone: '0901234567',
  phone2: '0912345678',
  email: 'garageminhchau@gmail.com',
  address: "123 No Trang Long Street, Binh Thanh, Ho Chi Minh City",
  district: "Binh Thanh",
  mapLink: 'https://maps.google.com/?q=10.805,106.710',
  description: "Mobile workshop specializes in supporting flooded vehicles. Served 24/7 during the rainy season.",
  isOpen: true,
  isMobile: true,
  coverageRadius: 8,
  joinDate: '15/01/2024',
  rating_average: 4.7,
  rating_count: 24,
  cover_photo: '',
  status: 'active', // 'active' | 'suspended' | 'cancelled'
  services: [
    { id: 's1', name: "Dry the flooded car", category: "Car flooded", price: '250.000', unit: "turn", active: true, desc: "Treat flooded motorbikes, dry spark plugs, and filter air." },
    { id: 's2', name: "Tow the car to the workshop", category: "Towing mobile vehicles", price: '150.000', unit: "turn", active: true, desc: "Tow a vehicle that doesn't start to the workshop within a 5km radius." },
    { id: 's3', name: "Change motorbike tires", category: "Replace tire", price: '120.000', unit: "tire", active: true, desc: "Replace tires of all types of motorbikes, patch tires on site." },
    { id: 's4', name: "Check electricity & battery", category: "Electricity & Batteries", price: '80.000', unit: "time", active: true, desc: "Check & replace battery, fix electrical errors." },
    { id: 's5', name: "Periodic maintenance", category: "Maintenance", price: '180.000', unit: "time", active: false, desc: "Change oil, check brakes, clean spark plugs." },
  ],
};

import WorkshopEditModal from '../../components/profile/WorkshopEditModal';

export default function WorkshopShop() {
  const [shop, setShop] = useState(initialShop);
  const [editing, setEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuspend, setShowSuspend] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showLargeMap, setShowLargeMap] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchShopData = async () => {
    try {
      const res = await apiService.get('/workshops/me');
      if (res && res.workshop) {
        const ws = res.workshop;
        setShop(prev => ({
          ...prev,
          name: ws.name,
          phone: ws.phone,
          phone2: ws.owner_phone || prev.phone2,
          email: ws.owner_email || prev.email,
          address: ws.address,
          owner: ws.owner_name || prev.owner,
          status: ws.status === 'Active' ? 'active' : ws.status === 'Suspended' ? 'suspended' : 'cancelled',
          isOpen: ws.is_open,
          isMobile: ws.is_mobile !== undefined ? ws.is_mobile : prev.isMobile,
          coverageRadius: ws.coverage_radius !== undefined ? ws.coverage_radius : prev.coverageRadius,
          cover_photo: ws.cover_photo || prev.cover_photo,
          lat: ws.lat,
          lng: ws.lng,
          rating_average: ws.rating_average !== undefined ? ws.rating_average : prev.rating_average,
          rating_count: ws.rating_count !== undefined ? ws.rating_count : prev.rating_count,
          joinDate: ws.created_at ? new Date(ws.created_at).toLocaleDateString('en-US') : prev.joinDate,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch workshop details in shop page:', err);
    }
  };

  const handleCoverPhotoChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast("File is too large. Please choose photos under 3MB.");
      return;
    }

    setIsUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiService.upload('/workshops/me/cover-photo', formData);
      if (response && response.cover_url) {
        setShop(prev => ({
          ...prev,
          cover_photo: response.cover_url
        }));
        showToast("Updated Workshop cover photo successfully.");
      }
    } catch (error) {
      console.error('Failed to upload workshop cover photo:', error);
      showToast(error.message || "Error uploading cover image to the server.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleUpdateStatusField = async (fields) => {
    try {
      const updatedData = {};
      if (fields.isOpen !== undefined) updatedData.is_open = fields.isOpen;
      if (fields.isMobile !== undefined) updatedData.is_mobile = fields.isMobile;
      if (fields.coverageRadius !== undefined) updatedData.coverage_radius = fields.coverageRadius;
      
      const res = await apiService.put('/workshops/me', updatedData);
      if (res && res.workshop) {
        const ws = res.workshop;
        setShop(prev => ({
          ...prev,
          isOpen: ws.is_open,
          isMobile: ws.is_mobile,
          coverageRadius: ws.coverage_radius,
        }));
      }
    } catch (err) {
      console.error('Failed to update workshop fields:', err);
      showToast(err.response?.data?.message || "Status update error.");
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  const handleCancelWorkshop = async () => {
    setShowCancel(false);
    try {
      await apiService.put('/workshops/me/cancel');
      showToast("Car workshop registration has been successfully canceled.");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to cancel workshop registration:', error);
      showToast(error.response?.data?.message || "Error while canceling store registration.");
    }
  };

  const handleToggleSuspend = async (action) => {
    try {
      const res = await apiService.put('/workshops/me/status', { action });
      if (res && res.workshop) {
        const ws = res.workshop;
        setShop(prev => ({
          ...prev,
          status: ws.status === 'Active' ? 'active' : ws.status === 'Suspended' ? 'suspended' : 'cancelled',
          isOpen: ws.is_open,
        }));
        showToast(action === 'pause' ? "The workshop has been successfully temporarily suspended." : "The workshop has been successfully reactivated.");
      }
    } catch (err) {
      console.error('Failed to toggle workshop status:', err);
      showToast(err.response?.data?.message || "Error when changing operating status.");
    }
  };
  const [newService, setNewService] = useState({ name: '', category: "Basic repair", price: '', unit: "turn", desc: '' });
  const [addingService, setAddingService] = useState(false);

  const handleSave = async () => {
    try {
      await apiService.put('/workshops/me', {
        name: shop.name,
        phone: shop.phone,
        address: shop.address,
        lat: parseFloat(shop.lat),
        lng: parseFloat(shop.lng),
      });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save workshop details:', err);
      showToast(err.response?.data?.message || "Error when saving Workshop information.");
    }
  };

  const toggleServiceActive = (id) => {
    setShop(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, active: !s.active } : s),
    }));
  };

  const deleteService = (id) => {
    setShop(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) }));
  };

  const addService = () => {
    if (!newService.name.trim() || !newService.price.trim()) return;
    setShop(prev => ({
      ...prev,
      services: [...prev.services, { ...newService, id: `s${Date.now()}`, active: true }],
    }));
    setNewService({ name: '', category: "Basic repair", price: '', unit: "turn", desc: '' });
    setAddingService(false);
  };

  const statusColor = { active: 'var(--green-400)', suspended: 'var(--orange-400)', cancelled: 'var(--text-muted)' };
  const statusLabel = { active: "Work", suspended: "Pause", cancelled: "Unsubscribed" };
  const statusBg = { active: 'rgba(34,197,94,0.1)', suspended: 'rgba(249,115,22,0.1)', cancelled: 'rgba(148,163,184,0.1)' };
  const statusBorder = { active: 'rgba(34,197,94,0.25)', suspended: 'rgba(249,115,22,0.25)', cancelled: 'rgba(148,163,184,0.25)' };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Workshop Profile & Services</h1>
            <p>Manage workshop information, service list, prices and operating status</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-2" style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: '0.875rem' }}>
                <CheckCircle size={15} /> Saved
              </div>
            )}
            <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
              <Edit3 size={14} /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 500 }}>
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <Wrench size={13} /> Shop information
        </button>
        <button className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
          <Edit3 size={13} /> Services & Prices
        </button>
        <button className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>
          <ToggleRight size={13} /> Status
        </button>
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="grid" style={{ gridTemplateColumns: '0.65fr 1.35fr', gap: 16 }}>
          {/* Identity card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
            <div className="card p-6" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden', paddingTop: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              {isUploadingCover && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  gap: 8
                }}>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                  <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Loading cover art...
                </div>
              )}
              {shop.cover_photo ? (
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  backgroundImage: `url(${shop.cover_photo})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center',
                  zIndex: 0
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(15, 23, 42, 0.85) 100%)' }} />
                </div>
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(217,119,6,0.08), transparent 60%)', zIndex: 0 }} />
              )}
              
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: shop.cover_photo ? '#ffffff' : 'var(--text-primary)', marginBottom: 4, position: 'relative', zIndex: 1, textShadow: shop.cover_photo ? '0 1px 4px rgba(0,0,0,0.8)' : 'none', marginTop: shop.cover_photo ? '24px' : '0px' }}>{shop.name}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: statusBg[shop.status] || 'rgba(148,163,184,0.1)', border: `1px solid ${statusBorder[shop.status] || 'rgba(148,163,184,0.25)'}`, fontSize: '0.72rem', fontWeight: 700, color: statusColor[shop.status], marginBottom: 14, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[shop.status], boxShadow: `0 0 6px ${statusColor[shop.status]}` }} />
                {statusLabel[shop.status]}
              </div>

              {/* User info preview */}
              <div style={{ padding: '8px 10px', borderRadius: 'var(--r-md)', background: 'rgba(6,182,212,0.05)', border: '1px solid var(--border-dim)', textAlign: 'left', marginBottom: 14, width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>{shop.owner || "Owner"}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>{shop.email}</div>
                <span className="badge badge-cyan" style={{ fontSize: '0.58rem', padding: '2px 8px' }}>
                  CAR REPAIR SHOP OWNER
                </span>
              </div>

              {/* Upload cover photo */}
              <label className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center', position: 'relative', zIndex: 1, color: shop.cover_photo ? '#ffffff' : 'var(--text-muted)', border: shop.cover_photo ? '1px solid rgba(255,255,255,0.25)' : '1px solid var(--border-dim)', background: shop.cover_photo ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
                <Camera size={13} /> {isUploadingCover ? "Loading..." : "Workshop cover photo"}
                <input type="file" accept="image/*" onChange={handleCoverPhotoChange} style={{ display: 'none' }} disabled={isUploadingCover} />
              </label>
            </div>

            {/* Quick stats */}
            <div className="card p-5" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="section-title" style={{ marginBottom: 10 }}>Workshop statistics</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {[
                  { label: "Registration date", value: shop.joinDate },
                  { label: "Current service", value: `${shop.services.filter(s => s.active).length} service` },
                  { label: "Average rating", value: `${shop.rating_average ? Number(shop.rating_average).toFixed(1) : '0.0'} ★ (${shop.rating_count || 0} Evaluate)` },
                ].map(s => (
                  <div key={s.label} className="flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-dim)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 16 }}>Detailed information</div>
            <div className="grid grid-2" style={{ gap: 12 }}>
              {[
                { key: 'name', label: "Workshop name" },
                { key: 'phone', label: "Workshop phone number" },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select className="input" value={shop[field.key]} onChange={e => setShop(p => ({ ...p, [field.key]: e.target.value }))} disabled={!editing}>
                      {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  ) : (
                    <input className="input" value={shop[field.key]} onChange={e => setShop(p => ({ ...p, [field.key]: e.target.value }))} disabled={!editing} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Full address</label>
              <div className="input-group">
                <MapPin size={14} className="input-icon" />
                <input className="input" value={shop.address} onChange={e => setShop(p => ({ ...p, address: e.target.value }))} disabled={!editing} />
              </div>
            </div>

            {/* Vị trí trên bản đồ */}
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Location on map</label>
              {shop.lat && shop.lng ? (
                <div 
                  onClick={() => setShowLargeMap(true)}
                  style={{
                    position: 'relative',
                    height: '180px',
                    width: '100%',
                    borderRadius: 'var(--r-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-dim)',
                    cursor: 'pointer'
                  }}
                >
                  <MapContainer
                    key={`${shop.lat}-${shop.lng}`}
                    center={[shop.lat, shop.lng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    dragging={false}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[shop.lat, shop.lng]} icon={customMarkerIcon} />
                  </MapContainer>

                  {/* Hover visual label overlay */}
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      zIndex: 1001,
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                  >
                    Click to expand the map
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Map coordinates have not been updated
                </div>
              )}
            </div>


          </div>
        </div>
      )}

      {/* Tab: Services */}
      {activeTab === 'services' && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {shop.services.filter(s => s.active).length} service is active
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setAddingService(true)}>
              <Plus size={13} /> Add services
            </button>
          </div>

          {addingService && (
            <div className="card p-5" style={{ marginBottom: 16, border: '1px solid rgba(217,119,6,0.3)' }}>
              <div className="section-title" style={{ marginBottom: 12 }}>Add new service</div>
              <div className="grid grid-2" style={{ gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Service name</label>
                  <input className="input" value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))} placeholder="Example: Repair tires on the spot" />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Category</label>
                  <select className="input" value={newService.category} onChange={e => setNewService(p => ({ ...p, category: e.target.value }))}>
                    {SERVICE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Price (VND)</label>
                  <input className="input" value={newService.price} onChange={e => setNewService(p => ({ ...p, price: e.target.value }))} placeholder="VD: 120.000" />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Unit</label>
                  <select className="input" value={newService.unit} onChange={e => setNewService(p => ({ ...p, unit: e.target.value }))}>
                    {["turn", "tire", "time", "hour", 'km'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <textarea className="input" rows={2} placeholder="Service description..." value={newService.desc} onChange={e => setNewService(p => ({ ...p, desc: e.target.value }))} style={{ marginBottom: 10 }} />
              <div className="flex gap-3">
                <button className="btn btn-success btn-sm" onClick={addService}><CheckCircle size={13} /> More</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddingService(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {shop.services.map(s => (
              <div key={s.id} className="card" style={{
                padding: '14px 18px',
                borderLeft: s.active ? '3px solid #f59e0b' : '3px solid var(--border-dim)',
                opacity: s.active ? 1 : 0.55,
              }}>
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 4 }}>
                      <span className="badge" style={{ fontSize: '0.62rem', background: 'rgba(217,119,6,0.12)', color: '#f59e0b', border: 'none' }}>{s.category}</span>
                      {!s.active && <span className="badge" style={{ fontSize: '0.62rem', background: 'rgba(71,85,105,0.2)', color: 'var(--text-muted)', border: 'none' }}>TURN OFF</span>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 3 }}>{s.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{s.desc}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f59e0b', fontSize: '0.92rem' }}>
                      {parseInt(s.price.replace(/\D/g, '')).toLocaleString('vi-VN')}D / {s.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="toggle">
                      <input type="checkbox" checked={s.active} onChange={() => toggleServiceActive(s.id)} />
                      <span className="toggle-slider" />
                    </label>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: 'var(--red-400)' }} onClick={() => deleteService(s.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Status */}
      {activeTab === 'status' && (
        <div className="grid grid-2" style={{ gap: 16 }}>
          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Adjust operating status</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ 
                padding: '16px', 
                borderRadius: 'var(--r-md)', 
                border: shop.isOpen ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border-dim)', 
                background: shop.isOpen ? 'rgba(34,197,94,0.06)' : 'rgba(148,163,184,0.05)',
                transition: 'all 0.2s ease'
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Open status</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Update immediately on the system</div>
                  </div>
                  <label className="toggle" style={{ transform: 'scale(1.15)' }}>
                    <input type="checkbox" checked={shop.isOpen} onChange={(e) => handleUpdateStatusField({ isOpen: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div style={{ marginTop: 10, fontSize: '0.82rem', fontWeight: 700, color: shop.isOpen ? 'var(--green-400)' : 'var(--text-muted)' }}>
                  {shop.isOpen ? "● OPEN – customers can find the Workshop" : "○ IS CLOSED – the workshop is hidden from search"}
                </div>
              </div>

              {/* Cứu hộ lưu động */}
              <div style={{ padding: '16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: 'rgba(61,125,176,0.04)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Mobile rescue</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>On-site vehicle repair support when rescue is required</div>
                  </div>
                  <label className="toggle" style={{ transform: 'scale(1.15)' }}>
                    <input type="checkbox" checked={shop.isMobile} onChange={(e) => handleUpdateStatusField({ isMobile: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Phạm vi hoạt động */}
              {shop.isMobile && (
                <div style={{ padding: '16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: 'rgba(61,125,176,0.04)' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Operating range (Radius)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>Maximum service radius for mobile rescue applications</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input 
                      type="range" 
                      min={1} 
                      max={20} 
                      value={shop.coverageRadius} 
                      onChange={e => setShop(p => ({ ...p, coverageRadius: Number(e.target.value) }))}
                      onMouseUp={e => handleUpdateStatusField({ coverageRadius: Number(e.target.value) })}
                      onTouchEnd={e => handleUpdateStatusField({ coverageRadius: Number(e.target.value) })}
                      style={{ flex: 1 }} 
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b', fontSize: '1.1rem', minWidth: 50, textAlign: 'right' }}>{shop.coverageRadius} km</span>
                  </div>
                </div>
              )}

              {shop.status === 'active' ? (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ borderColor: 'var(--orange-400)', color: 'var(--orange-400)' }}
                  onClick={() => setShowSuspend(true)}
                >
                  <PauseCircle size={13} /> Temporarily stopped operating
                </button>
              ) : shop.status === 'suspended' ? (
                <button
                  className="btn btn-success btn-sm"
                  style={{ background: 'var(--green-500)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => handleToggleSuspend('resume')}
                >
                  <CheckCircle size={13} style={{ marginRight: 6 }} /> Enable activity again
                </button>
              ) : null}
              <button
                className="btn btn-ghost btn-sm"
                style={{ borderColor: 'var(--red-400)', color: 'var(--red-400)' }}
                onClick={() => setShowCancel(true)}
              >
                <XCircle size={13} /> Cancel the workshop registration
              </button>

            </div>
          </div>

          <div className="card p-6">
            <div className="section-title" style={{ marginBottom: 14 }}>Hours of operation</div>
            {[
              { day: "Monday – Friday", hours: '07:00 – 21:00', active: true },
              { day: "Saturday", hours: '07:00 – 23:00', active: true },
              { day: "Sunday", hours: '08:00 – 20:00', active: true },
              { day: "Holiday", hours: "Contact directly", active: false },
            ].map(row => (
              <div key={row.day} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{row.day}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.hours}</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked={row.active} />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
            <div className="alert-banner info" style={{ marginTop: 14 }}>
              <Clock size={14} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                During the rainy season, operating hours should be expanded to support the community and receive additional contribution points.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals rendered at the root viewport level */}
      {showSuspend && (
        <div className="modal-overlay" onClick={() => setShowSuspend(false)} style={{ zIndex: 10000 }}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color="var(--orange-400)" />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Temporarily close workshop operations</span>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowSuspend(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Are you sure you want to temporarily suspend your workshop? The workshop will not accept new applications or appear in search results during the temporary suspension period.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSuspend(false)}>Cancel</button>
              <button 
                className="btn btn-warning btn-sm" 
                style={{ background: 'var(--orange-500)', border: 'none', color: 'white' }}
                onClick={() => { handleToggleSuspend('pause'); setShowSuspend(false); }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancel && (
        <div className="modal-overlay" onClick={() => setShowCancel(false)} style={{ zIndex: 10000 }}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color="var(--red-400)" />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Cancel registration of workshop</span>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowCancel(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Are you sure you want to deregister your workshop and withdraw from being a Workshop Owner? This action will remove the workshop from the system.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCancel(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleCancelWorkshop}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showLargeMap && (
        <div className="modal-overlay" onClick={() => setShowLargeMap(false)} style={{ zIndex: 10000 }}>
          <div className="modal" style={{ maxWidth: 640, width: '90%', height: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Workshop location map</span>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowLargeMap(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ flex: 1, padding: 0, position: 'relative', overflow: 'hidden' }}>
              <MapContainer
                key={`large-${shop.lat}-${shop.lng}`}
                center={[shop.lat, shop.lng]}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[shop.lat, shop.lng]} icon={customMarkerIcon} />
              </MapContainer>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '75%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {shop.address}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLargeMap(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <WorkshopEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialData={shop}
        onSuccess={async () => {
          setShowEditModal(false);
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
          await fetchShopData();
        }}
      />

      {/* Success Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: 'var(--green-400)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--r-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }}>
          <CheckCircle size={18} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
