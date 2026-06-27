import React, { useState, useEffect } from 'react';
import { Camera, MapPin, X, Save, AlertTriangle, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { apiService } from '../../services/apiService';

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

export default function WorkshopEditModal({ isOpen, onClose, onSuccess, initialData }) {
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
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        if (res.ok) {
          const data = await res.json();
          setProvincesList(data);
        }
      } catch (err) {
        console.error('Error fetching provinces:', err);
      }
    };
    fetchProvinces();
  }, []);

  // Sync initialData when modal opens
  useEffect(() => {
    if (initialData && isOpen) {
      setShopName(initialData.name || '');
      setPhone(initialData.phone || '');
      setAddress(initialData.address || '');
      
      const newLat = parseFloat(initialData.lat) || 10.8564;
      const newLng = parseFloat(initialData.lng) || 106.6234;
      setLat(newLat);
      setLng(newLng);
      setMapCenter([newLat, newLng]);
      setError('');
      
      // Parse geocoded address to try and prepopulate dropdowns
      if (initialData.address && provincesList.length > 0) {
        parseAndMatchAddress(initialData.address);
      }
    }
  }, [initialData, isOpen, provincesList]);

  // Parse address parts and select dropdowns
  const parseAndMatchAddress = async (fullAddr) => {
    const parts = fullAddr.split(',').map(p => p.trim());
    if (parts.length < 2) return;

    try {
      // Find province
      const provPart = parts[parts.length - 1];
      const cleanedProv = cleanSearchTerm(provPart);
      const province = provincesList.find(p => cleanSearchTerm(p.name).includes(cleanedProv) || cleanedProv.includes(cleanSearchTerm(p.name)));
      
      if (province) {
        setSelectedProvince(String(province.code));
        
        // Fetch all wards in the province (depth=3)
        const res = await fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=3`);
        if (res.ok) {
          const provData = await res.json();
          const wards = [];
          if (provData.districts) {
            provData.districts.forEach(d => {
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
          
          const wardPart = parts[parts.length - 2];
          const cleanedWard = cleanSearchTerm(wardPart);
          const ward = wards.find(w => cleanSearchTerm(w.name).includes(cleanedWard) || cleanedWard.includes(cleanSearchTerm(w.name)));
          
          if (ward) {
            setSelectedWard(String(ward.code));
          } else {
            setSelectedWard('other');
            setCustomWard(wardPart);
          }
        }
      }
      
      // The rest is street address
      const streetParts = parts.slice(0, parts.length - 2);
      setStreetAddress(streetParts.join(', '));
    } catch (err) {
      console.error('Error auto-parsing address:', err);
    }
  };

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

  // Re-compile detailed address string when dropdown selections or street input changes
  useEffect(() => {
    const provinceObj = provincesList.find(p => String(p.code) === selectedProvince);
    const wardObj = wardsList.find(w => String(w.code) === selectedWard);

    const provinceName = provinceObj ? provinceObj.name : '';
    const wardName = selectedWard === 'other' ? customWard : (wardObj ? wardObj.name : '');

    const addressParts = [];
    if (streetAddress.trim()) addressParts.push(streetAddress.trim());
    if (wardName.trim()) addressParts.push(wardName.trim());
    if (provinceName.trim()) addressParts.push(provinceName.trim());

    setAddress(addressParts.join(', '));
  }, [selectedProvince, selectedWard, customWard, streetAddress, provincesList, wardsList]);

  // Handle province change: reset ward
  const handleProvinceChange = (e) => {
    const provCode = e.target.value;
    setSelectedProvince(provCode);
    setSelectedWard('');
    setCustomWard('');
    setWardsList([]);
  };

  // Shopee-like: Debounced autocomplete search API call
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Query OpenStreetMap Nominatim for suggestions in Vietnam
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&q=${encodeURIComponent(searchQuery)}&limit=5`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Error searching for location suggestions:", err);
      }
    }, 450); // 450ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle address selection from Shopee search suggestion
  const handleSelectSuggestion = async (item) => {
    setShowSuggestions(false);
    setSearchQuery('');
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);

    setLat(newLat);
    setLng(newLng);
    setMapCenter([newLat, newLng]);

    if (item.address) {
      await matchGeocodedAddress(item.address);
    } else {
      // Reverse geocode to get structural components if not returned in search suggestion
      try {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`;
        const res = await fetch(revUrl);
        if (res.ok) {
          const revData = await res.json();
          if (revData.address) {
            await matchGeocodedAddress(revData.address);
          }
        }
      } catch (err) {
        console.error('Error reverse geocoding suggestion:', err);
      }
    }
  };

  // Map reverse geocoding variables to dropdown options
  const matchGeocodedAddress = async (osmAddr) => {
    try {
      const osmProvince = osmAddr.city || osmAddr.state || osmAddr.municipality || '';
      const osmWard = osmAddr.quarter || osmAddr.subdistrict || osmAddr.town || osmAddr.village || '';

      const cleanedOsmProv = cleanSearchTerm(osmProvince);
      let matchedProvince = provincesList.find(p => {
        const cleanedDbProv = cleanSearchTerm(p.name);
        return cleanedDbProv.includes(cleanedOsmProv) || cleanedOsmProv.includes(cleanedDbProv);
      });

      if (matchedProvince) {
        setSelectedProvince(String(matchedProvince.code));

        const res = await fetch(`https://provinces.open-api.vn/api/p/${matchedProvince.code}?depth=3`);
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

          const cleanedOsmWard = cleanSearchTerm(osmWard);
          let matchedWard = dbWards.find(w => {
            const cleanedDbWard = cleanSearchTerm(w.name);
            return cleanedDbWard.includes(cleanedOsmWard) || cleanedOsmWard.includes(cleanedDbWard);
          });

          if (matchedWard) {
            setSelectedWard(String(matchedWard.code));
            setCustomWard('');
          } else if (osmWard) {
            setSelectedWard('other');
            setCustomWard(osmWard);
          } else {
            setSelectedWard('');
            setCustomWard('');
          }
        }
      }

      // Populate street address
      const road = osmAddr.road || osmAddr.highway || osmAddr.suburb || '';
      const houseNumber = osmAddr.house_number || '';
      const street = [houseNumber, road].filter(Boolean).join(' ');
      if (street) {
        setStreetAddress(street);
      }
    } catch (err) {
      console.error('Error matching OSM address components:', err);
    }
  };

  // Geolocate device current coordinates
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support GPS positioning.");
      return;
    }

    setIsLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLat(userLat);
        setLng(userLng);
        setMapCenter([userLat, userLng]);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`);
          if (res.ok) {
            const data = await res.json();
            if (data.address) {
              await matchGeocodedAddress(data.address);
            }
          }
        } catch (err) {
          console.error('Error reverse geocoding current location:', err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError("Your device cannot be located. Please turn on GPS and try again.");
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Reverse geocoding on panning map release (moveend event)
  const handleMapMoveEnd = async (centerLat, centerLng) => {
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

    const phoneRegex = /^(03[2-9]|05[25689]|07[06-9]|08[1-9]|09[0-9])\d{7}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError("Invalid Vietnamese mobile phone number (10 digits).");
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
      await apiService.put('/workshops/me', {
        name: shopName,
        phone,
        address,
        lat,
        lng
      });
      
      onSuccess();
    } catch (err) {
      setError(err.message || "Error updating Workshop. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
      <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 560, margin: '20px', display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Edit workshop information</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <form id="workshop-edit-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            
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
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
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
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
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
          <button type="submit" form="workshop-edit-form" className="btn btn-primary" disabled={isLoading} style={{ background: 'var(--orange-400)', color: '#fff', border: 'none' }}>
            {isLoading ? "Saving..." : <><Save size={14} /> Save changes</>}
          </button>
        </div>
        
      </div>
    </div>
  );
}
