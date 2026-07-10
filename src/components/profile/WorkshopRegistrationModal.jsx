import React, { useState, useEffect } from 'react';
import { Camera, MapPin, X, Send, AlertTriangle, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { apiService } from '../../services/apiService';
import GoongMaplibreLayer from '../common/GoongMaplibreLayer';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon issue in Vite/React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Helper utility to clean search terms for fuzzy matching (removes administrative prefixes)
const cleanSearchTerm = (str) => {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/^(tp\.|thành phố|tỉnh|quận|huyện|phường|xã|thị xã|thị trấn)\s+/gi, '')
    .trim();
};

// Helper component to listen to map pan/move end (Shopee-like center detection)
function MapEventsHandler({ onMapMoveEnd }) {
  const map = useMap();
  useMapEvents({
    moveend() {
      const center = map.getCenter();
      onMapMoveEnd(center.lat, center.lng);
    },
    click(e) {
      map.setView(e.latlng, map.getZoom());
    }
  });
  return null;
}

// Helper component to fly the map to a new center
function ChangeMapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function WorkshopRegistrationModal({ isOpen, onClose, onSuccess }) {
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Modal layout states
  const [showLargeMap, setShowLargeMap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // Administrative divisions lists from API
  const [provincesList, setProvincesList] = useState([]);
  const [wardsList, setWardsList] = useState([]);

  // Selected administrative division states (codes/values)
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [customWard, setCustomWard] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  
  // Shopee-like Autocomplete Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(10.03711); // Default near Can Tho
  const [lng, setLng] = useState(105.78825);
  const [mapCenter, setMapCenter] = useState([10.03711, 105.78825]);
  
  const [searchError, setSearchError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle province change: reset ward
  const handleProvinceChange = (e) => {
    const provCode = e.target.value;
    setSelectedProvince(provCode);
    setSelectedWard('');
    setCustomWard('');
    setWardsList([]);
  };

  // Fetch all provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        if (res.ok) {
          const data = await res.json();
          setProvincesList(data);
          
          // Default to HCMC (code 79) or first item
          const hcm = data.find(p => p.name.includes("Ho Chi Minh"));
          if (hcm) {
            setSelectedProvince(String(hcm.code));
          } else if (data.length > 0) {
            setSelectedProvince(String(data[0].code));
          }
        }
      } catch (err) {
        console.error('Error fetching provinces:', err);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch wards when selectedProvince changes
  useEffect(() => {
    if (!selectedProvince) {
      setWardsList([]);
      return;
    }
    const fetchWards = async () => {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=3`);
        if (res.ok) {
          const data = await res.json();
          const wards = [];
          if (data.districts) {
            data.districts.forEach(d => {
              if (d.wards) {
                d.wards.forEach(w => {
                  wards.push({
                    code: w.code,
                    name: w.name,
                    districtName: d.name
                  });
                });
              }
            });
          }
          setWardsList(wards);
        }
      } catch (err) {
        console.error('Error fetching wards:', err);
      }
    };
    fetchWards();
  }, [selectedProvince]);

  // Compile full address string automatically whenever components change
  useEffect(() => {
    const provinceObj = provincesList.find(p => String(p.code) === String(selectedProvince));
    
    let wardName = '';
    if (selectedWard === 'other') {
      wardName = customWard.trim();
    } else {
      const wardObj = wardsList.find(w => String(w.code) === String(selectedWard));
      wardName = wardObj ? wardObj.name : '';
    }
    
    const parts = [
      streetAddress.trim(),
      wardName,
      provinceObj ? provinceObj.name : ''
    ].filter(Boolean);
    
    setAddress(parts.join(', '));
  }, [streetAddress, selectedProvince, selectedWard, customWard, provincesList, wardsList]);

  // Debounced search for autocomplete suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=5&addressdetails=1`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 400);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!isOpen) return null;

  // Fuzzy match Nominatim geocoded parts to Vietnam Provinces API codes
  const matchGeocodedAddress = async (addr) => {
    const cityOrState = cleanSearchTerm(addr.city || addr.town || addr.village || addr.state || '');
    const wardName = cleanSearchTerm(addr.quarter || addr.neighbourhood || addr.suburb || addr.village || '');
    
    const road = addr.road || '';
    const houseNumber = addr.house_number || '';
    const street = houseNumber ? `${houseNumber} ${road}` : road;
    setStreetAddress(street);

    // 1. Match province
    const matchedProv = provincesList.find(p => {
      const cleanProv = cleanSearchTerm(p.name);
      return cityOrState.includes(cleanProv) || cleanProv.includes(cityOrState);
    });

    if (matchedProv) {
      setSelectedProvince(String(matchedProv.code));
      
      // 2. Fetch and match ward directly in the province
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${matchedProv.code}?depth=3`);
        if (res.ok) {
          const provData = await res.json();
          const dbWards = [];
          if (provData.districts) {
            provData.districts.forEach(d => {
              if (d.wards) {
                d.wards.forEach(w => {
                  dbWards.push({
                    code: w.code,
                    name: w.name,
                    districtName: d.name
                  });
                });
              }
            });
          }
          setWardsList(dbWards);
          
          const matchedWard = dbWards.find(w => {
            const cleanWard = cleanSearchTerm(w.name);
            return wardName.includes(cleanWard) || cleanWard.includes(wardName);
          });
          
          if (matchedWard) {
            setSelectedWard(String(matchedWard.code));
          } else {
            setSelectedWard('other');
            setCustomWard(addr.quarter || addr.neighbourhood || addr.suburb || addr.village || '');
          }
        }
      } catch (err) {
        console.error('Error matching geocoded address divisions:', err);
      }
    }
  };

  // Option 1: Get current position, do reverse geocoding, and map to dropdowns
  const handleGetCurrentLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError("Your browser does not support location retrieval.");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        setMapCenter([latitude, longitude]);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data.address) {
              await matchGeocodedAddress(data.address);
            }
          }
        } catch (err) {
          console.error("Error parsing current location:", err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error("Error getting location:", err);
        setError("Unable to get current location. Please grant location access or select manually.");
        setIsLocating(false);
      }
    );
  };

  // Triggered when a search autocomplete suggestion is clicked
  const handleSelectSuggestion = async (suggestion) => {
    const searchLat = parseFloat(suggestion.lat);
    const searchLng = parseFloat(suggestion.lon);
    
    setLat(searchLat);
    setLng(searchLng);
    setMapCenter([searchLat, searchLng]);
    setShowSuggestions(false);
    setSearchQuery(suggestion.display_name);
    
    if (suggestion.address) {
      await matchGeocodedAddress(suggestion.address);
    }
  };

  // Triggers when the user drags the map and releases (pans map center)
  const handleMapMoveEnd = async (centerLat, centerLng) => {
    if (Math.abs(centerLat - lat) < 0.00001 && Math.abs(centerLng - lng) < 0.00001) {
      return;
    }
    setLat(centerLat);
    setLng(centerLng);
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerLat}&lon=${centerLng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.address) {
          await matchGeocodedAddress(data.address);
        }
      }
    } catch (err) {
      console.error("Error getting reverse address from map center:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!shopName.trim()) {
      setError("Please enter the name of the workshop.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter phone number.");
      return;
    }

    if (!selectedProvince) {
      setError("Please select Province/City.");
      return;
    }

    if (!selectedWard) {
      setError("Please select Ward/Commune.");
      return;
    }

    if (selectedWard === 'other' && !customWard.trim()) {
      setError("Please enter Ward/Commune name.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter or select the store address.");
      return;
    }

    setIsLoading(true);

    try {
      await apiService.post('/workshops/register', {
        name: shopName,
        phone,
        address,
        lat,
        lng
      });
      
      onSuccess();
    } catch (err) {
      setError(err.message || "Error registering Workshop. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
      <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 560, margin: '20px', display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Register to open a workshop</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <form id="workshop-register-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            
            {/* Tên tiệm */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                Name of workshop <span style={{ color: 'var(--red-400)' }}>*</span>
              </label>
              <input 
                type="text" 
                className="input" 
                placeholder="For example: Khanh Hong workshop"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>

            {/* Số điện thoại liên hệ */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                Contact phone number <span style={{ color: 'var(--red-400)' }}>*</span>
              </label>
              <input 
                type="text" 
                className="input" 
                placeholder="For example: 0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>

            {/* Địa chỉ & Vị trí tiệm */}
            <div style={{ display: 'grid', gap: 12, padding: '14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: 'var(--bg-void)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Location of workshop <span style={{ color: 'var(--red-400)' }}>*</span>
                </span>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={handleGetCurrentLocation} 
                  disabled={isLocating}
                  style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--orange-400)', background: 'rgba(255, 140, 0, 0.1)', border: '1px solid rgba(255, 140, 0, 0.2)' }}
                  title="Uses the device's current location"
                >
                  {isLocating ? (
                    <>Locating...</>
                  ) : (
                    <><MapPin size={13} /> Select current location</>
                  )}
                </button>
              </div>

              {/* Tỉnh, Phường Dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Province / City</label>
                  <select className="input" value={selectedProvince} onChange={handleProvinceChange} style={{ width: '100%' }}>
                    <option value="">-- Select Province / City --</option>
                    {provincesList.map(p => <option key={p.code} value={String(p.code)}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ward / Commune</label>
                  <select className="input" value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} style={{ width: '100%' }} disabled={!selectedProvince}>
                    <option value="">-- Select Ward / Commune --</option>
                    {wardsList.map(w => (
                      <option key={w.code} value={String(w.code)}>
                        {w.name} {w.districtName ? `(${w.districtName})` : ''}
                      </option>
                    ))}
                    <option value="other">-- Other (Hand input) --</option>
                  </select>
                </div>
              </div>

              {/* Custom Ward input if selected 'other' */}
              {selectedWard === 'other' && (
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Enter the Ward/Commune name</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="For example: Thanh Loc Ward" 
                    value={customWard}
                    onChange={(e) => setCustomWard(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {/* Street Address / House Number details */}
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>House number, alley, detailed street name</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="For example: Number 14, lane 2"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              {/* Map Preview (Click to open Large Map overlay) */}
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Location map (Click to expand map to edit location)</label>
                <div 
                  onClick={() => setShowLargeMap(true)}
                  style={{
                    position: 'relative',
                    height: '110px',
                    width: '100%',
                    borderRadius: 'var(--r-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-dim)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--orange-400)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-dim)'}
                >
                  <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }} dragging={false} zoomControl={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false}>
                    <GoongMaplibreLayer apiKey="S6RMPleSOa7QXQgi5byo4rewtt9pRnwzzHjetKjf" />
                    <ChangeMapCenter center={mapCenter} />
                  </MapContainer>
                  
                  {/* Centered preview pin */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -100%)',
                    zIndex: 1000,
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <MapPin size={24} color="var(--orange-400)" fill="rgba(255,140,0,0.25)" />
                  </div>
                  
                  {/* Hover Overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1005,
                    transition: 'background 0.2s'
                  }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.45)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.25)'}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Search size={13} /> Click to expand the map and adjust the location
                    </span>
                  </div>
                </div>
              </div>

              {/* Large Map Overlay (Absolute page cover inside modal) */}
              {showLargeMap && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--bg-card)',
                  zIndex: 10100,
                  borderRadius: 'var(--r-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '20px',
                  height: '100%'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Select location on the map</span>
                    <button 
                      type="button" 
                      className="btn btn-ghost" 
                      onClick={() => setShowLargeMap(false)}
                      style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* Autocomplete Search */}
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Find roads, buildings, locations..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        style={{ flex: 1, fontSize: '0.75rem', height: '36px' }}
                      />
                      {searchQuery && (
                        <button 
                          type="button" 
                          className="btn btn-ghost" 
                          onClick={() => { setSearchQuery(''); setSuggestions([]); }} 
                          style={{ height: '36px', padding: '0 8px', fontSize: '0.72rem' }}
                        >
                          Erase
                        </button>
                      )}
                    </div>
                    
                    {/* Suggestions list */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 2000,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-dim)',
                        borderRadius: 'var(--r-sm)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {suggestions.map((s, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleSelectSuggestion(s)}
                            style={{
                              padding: '10px 12px',
                              fontSize: '0.72rem',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid var(--border-dim)',
                              transition: 'background 0.2s',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,140,0,0.1)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                          >
                            📍 {s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Large Map Container */}
                  <div style={{ position: 'relative', flex: 1, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border-dim)', marginBottom: '12px' }}>
                    <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                      <GoongMaplibreLayer apiKey="S6RMPleSOa7QXQgi5byo4rewtt9pRnwzzHjetKjf" />
                      <MapEventsHandler onMapMoveEnd={handleMapMoveEnd} />
                      <ChangeMapCenter center={mapCenter} />
                    </MapContainer>
                    
                    {/* Centered Floating Pin Overlay */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -100%)',
                      zIndex: 1000,
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <MapPin size={36} color="var(--orange-400)" fill="rgba(255,140,0,0.25)" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.4))' }} />
                      <div style={{
                        width: '6px',
                        height: '2px',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '50%',
                        marginTop: '1px',
                        filter: 'blur(1px)'
                      }} />
                    </div>
                  </div>
                  
                  {/* Current Address Pinned Text */}
                  <div style={{ background: 'var(--bg-void)', padding: '10px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-dim)', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Currently selected area</span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-word' }}>
                      {address || "Location has not been determined"}
                    </div>
                  </div>
                  
                  {/* Confirm Button */}
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => setShowLargeMap(false)}
                    style={{ width: '100%', background: 'var(--orange-400)', color: '#fff', border: 'none', height: '40px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    Confirm this location
                  </button>
                </div>
              )}
            </div>

            {/* Compiled Full Address Display */}
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Full address (Auto-compiled)</label>
              <textarea 
                className="input" 
                rows={2}
                value={address}
                readOnly
                style={{ opacity: 0.85, background: 'var(--bg-void)' }}
              />
            </div>



            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--red-400)', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--r-sm)' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}
          </form>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" form="workshop-register-form" className="btn btn-primary" disabled={isLoading} style={{ background: 'var(--orange-400)', color: '#fff', border: 'none' }}>
            {isLoading ? "Sending..." : <><Send size={14} /> Submit registration request</>}
          </button>
        </div>
        
      </div>
    </div>
  );
}
