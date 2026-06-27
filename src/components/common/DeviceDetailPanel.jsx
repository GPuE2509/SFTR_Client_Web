import React, { useState, useEffect } from 'react';
import { X, Battery, Activity, AlertTriangle, Cpu, Navigation, Watch, ShieldCheck, Thermometer } from 'lucide-react';
import { Image } from 'antd';
import { apiService } from '../../services/apiService';

export default function DeviceDetailPanel({ deviceId, onClose }) {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!deviceId) return;
    
    const fetchDeviceDetails = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const res = await apiService.get(`/iot/devices/${deviceId}`);
        if (res.success && res.data) {
          setDevice(res.data);
          setError(null);
        } else if (isInitial) {
          setError("Cannot load device information.");
        }
      } catch (err) {
        console.error("Error fetching device details:", err);
        if (isInitial) setError("Network error while connecting to server.");
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchDeviceDetails(true);

    const intervalId = setInterval(() => {
      fetchDeviceDetails(false);
    }, 5000); // Poll every 5 seconds for real-time updates

    return () => clearInterval(intervalId);
  }, [deviceId]);

  if (!deviceId) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '100%',
      maxWidth: '380px',
      height: '100%',
      background: 'var(--bg-elevated)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      transform: 'translateX(0)',
      transition: 'transform 0.3s ease',
      borderLeft: '1px solid var(--border-subtle)'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid var(--border-subtle)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(14, 165, 233, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={20} color="var(--cyan-400)" />
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Device Details
          </h2>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Loading data...
          </div>
        ) : error ? (
          <div style={{ color: 'var(--red-400)', textAlign: 'center', padding: '20px' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 10px' }} />
            {error}
          </div>
        ) : device ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Image & Basic Info */}
            <div>
              {device.image_url ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Image 
                    src={device.image_url} 
                    alt={device.name} 
                    width="100%"
                    style={{ maxHeight: '250px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-dim)', background: '#000' }}
                    preview={{
                      getContainer: () => document.fullscreenElement || document.body,
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 8 }}>
                    Click on the image to view larger
                  </span>
                </div>
              ) : (
                <div style={{ width: '100%', height: '180px', background: 'var(--bg-card)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-dim)', color: 'var(--text-muted)' }}>
                  No image available
                </div>
              )}
              <h3 style={{ margin: '16px 0 4px', fontSize: '1.3rem', color: 'var(--text-primary)' }}>{device.name}</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Navigation size={14} /> {device.location} ({device.lat}, {device.lng})
              </div>
              <div style={{ color: 'var(--cyan-400)', fontSize: '0.8rem', marginTop: 4, fontFamily: 'monospace' }}>
                ID: {device.device_code}
              </div>
            </div>

            {/* Status Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={12}/> Water Level</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--cyan-400)' }}>{device.current_water_level || 0} <span style={{ fontSize: '0.8rem' }}>cm</span></div>
              </div>
              
              <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Battery size={12}/> Battery</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-400)' }}>{device.current_battery_level || 0} <span style={{ fontSize: '0.8rem' }}>%</span></div>
              </div>
            </div>

            {/* Thresholds & Config */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cpu size={16} color="var(--text-muted)" />
                Configuration & Thresholds
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span style={{ color: device.status === 'Online' ? 'var(--green-400)' : 'var(--red-400)', fontWeight: 600 }}>{device.status}</span>
                </div>
                

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Calibration (Empty)</span>
                  <span style={{ color: 'var(--text-primary)' }}>{device.calib_empty_cm || 100} cm</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Water Level percentage</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {(((device.current_water_level || 0) / (device.calib_empty_cm || 100)) * 100).toFixed(1)} %
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sleep Interval</span>
                  <span style={{ color: 'var(--text-primary)' }}>{device.sleep_interval_minutes || 1} min</span>
                </div>
              </div>
            </div>

            {/* Footer info */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 10 }}>
              <Watch size={12} />
              Last reading: {device.last_reading_time ? new Date(device.last_reading_time).toLocaleString('vi-VN') : 'N/A'}
            </div>
            
          </div>
        ) : null}
      </div>
    </div>
  );
}
