import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, Marker, useMap, ZoomControl, Polyline, useMapEvents } from 'react-leaflet';
import { CloudRain, Search, Wrench, Star, Phone, Clock, ChevronDown, ChevronUp, X, ThumbsUp, ThumbsDown, MapPin, Loader, Compass, LocateFixed, AlertTriangle, Activity, Home, Filter, Maximize, Minimize, Navigation, Bookmark, Share2, MessageSquare, Cpu, Battery, Camera, CheckCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiService } from '../../services/apiService';

// ── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 14, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          onClick={() => !readonly && onChange && onChange(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
          style={{ background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer', padding: 0 }}
        >
          <Star
            size={size}
            color={(hover || value) >= s ? '#f59e0b' : 'var(--border-dim)'}
            fill={(hover || value) >= s ? '#f59e0b' : 'none'}
            style={{ transition: 'all 0.1s' }}
          />
        </button>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const MapFlyToTarget = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target && target.lat && target.lng) {
      map.flyTo([target.lat, target.lng], 16, { animate: true, duration: 1 });
    }
  }, [target, map]);
  return null;
};

const SensorMarker = ({ device, isSelected, badge, position, onClick }) => {
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        className: 'custom-sensor-marker',
        html: `
          <div style="background-color: ${badge.mapColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px ${badge.mapColor}80; border: 3px solid white; position: relative; z-index: 2;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14a8 8 0 0 1 16 0"></path><path d="M8 14a4 4 0 0 1 8 0"></path><path d="M12 14v.01"></path><path d="M2 14h20"></path><path d="M12 2v20"></path>
            </svg>
            ${isSelected || device.waterLevel > 0 ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid ${badge.mapColor}; animation: pulse-ring 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; box-sizing: border-box; z-index: -1;"></div>` : ''}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      })}
      eventHandlers={{
        click: onClick,
      }}
    />
  );
};


const MapResizeController = () => {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const parseLatLng = (str) => {
  if (!str) return null;
  const regex = /^\s*(?:lat(?:itude)?\s*[:=]?\s*)?(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(?:lon(?:gitude)?|lng)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*$/i;
  const match = str.trim().match(regex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
};

const getClientDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
};

const getRemainingRouteDetails = (userLoc, route) => {
  if (!userLoc || !route || !route.geometry || !route.geometry.coordinates) {
    return null;
  }
  
  const coords = route.geometry.coordinates;
  let closestIdx = 0;
  let minDistance = Infinity;
  
  for (let i = 0; i < coords.length; i++) {
    const dist = getClientDistance(userLoc.lat, userLoc.lng, coords[i][1], coords[i][0]);
    if (dist < minDistance) {
      minDistance = dist;
      closestIdx = i;
    }
  }
  
  const remainingCoords = [[userLoc.lng, userLoc.lat], ...coords.slice(closestIdx)];
  
  let remainingDistMeters = 0;
  for (let i = 0; i < remainingCoords.length - 1; i++) {
    remainingDistMeters += getClientDistance(
      remainingCoords[i][1], remainingCoords[i][0],
      remainingCoords[i+1][1], remainingCoords[i+1][0]
    );
  }
  
  const totalDistance = route.distance || 1;
  const ratio = Math.min(1, remainingDistMeters / totalDistance);
  const remainingDuration = Math.round(route.weighted_duration * ratio);
  
  return {
    coordinates: remainingCoords,
    distance: remainingDistMeters,
    duration: remainingDuration,
    deviationDistance: minDistance
  };
};

const getWaterLevelBadge = (level, status, systemConfig, calib_empty_cm) => {
  if (status === 'offline' || status === 'error') {
    return { label: "Lost connection", className: 'badge-gray', color: 'var(--text-muted)', mapColor: '#475569', badgeBg: 'rgba(71,85,105,0.1)' };
  }
  
  const calib = calib_empty_cm || 100;
  const pct = (level / calib) * 100;
  
  const l1 = systemConfig?.water_level_l1 ?? 20;
  const l2 = systemConfig?.water_level_l2 ?? 40;
  const l3 = systemConfig?.water_level_l3 ?? 50;
  const l4 = systemConfig?.water_level_l4 ?? 60;
  
  if (pct >= l4) return { label: "Critical flooding", className: 'badge-purple', color: 'var(--purple-400)', mapColor: '#a855f7', badgeBg: 'rgba(168,85,247,0.15)' };
  if (pct >= l3) return { label: "Severe flooding", className: 'badge-red', color: 'var(--red-400)', mapColor: '#ef4444', badgeBg: 'rgba(239,68,68,0.12)' };
  if (pct >= l2) return { label: "Moderate flooding", className: 'badge-orange', color: 'var(--orange-400)', mapColor: '#f97316', badgeBg: 'rgba(249,115,22,0.12)' };
  if (pct >= l1) return { label: "Slight flooding", className: 'badge-gold', color: 'var(--gold-400)', mapColor: '#eab308', badgeBg: 'rgba(234,179,8,0.12)' };
  return { label: "Safe", className: 'badge-green', color: 'var(--green-400)', mapColor: '#22c55e', badgeBg: 'rgba(34,197,94,0.12)' };
};

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

const createSosIcon = (id, severity) => {
  const color = severity === 'critical' ? 'var(--red-400)' : 'var(--orange-400)';
  const shadowColor = severity === 'critical' ? 'rgba(239,29,55,0.8)' : 'rgba(249,115,22,0.7)';
  return L.divIcon({
    html: `<div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
             <div style="width: ${severity==='critical'?16:14}px; height: ${severity==='critical'?16:14}px; border-radius: 50%; background: ${color}; box-shadow: 0 0 15px ${shadowColor}; animation: blink 1s ease-in-out infinite; cursor: pointer;"></div>
             <div style="font-size: 0.6rem; color: ${color}; font-weight: 700; white-space: nowrap; margin-top: 3px; background: rgba(0,0,0,0.6); padding: 1px 4px; border-radius: 3px;">${id}</div>
           </div>`,
    className: '',
    iconSize: [80, 40],
    iconAnchor: [40, 20]
  });
};

// ── Mocks ───────────────────────────────────────────────────────────────────
const initZones = [
  { id: 'z1', name: "Home",    radius: 2, level: 'high',   active: true,  address: "Ninh Kieu, Can Tho",    lat: 10.034189, lng: 105.781305 },
  { id: 'z2', name: "Workplace", radius: 4, level: 'medium', active: true,  address: "Cai Rang, Can Tho", lat: 10.009189, lng: 105.753305 },
  { id: 'z3', name: "School",   radius: 3, level: 'low',    active: false, address: "Binh Thuy, Can Tho",    lat: 10.071189, lng: 105.723305 },
];

const levelColor = { high: 'var(--red-400)', medium: 'var(--orange-400)', low: 'var(--cyan-400)' };

// Helper component to fly the map to a new center
function MapCenterController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      const currentZoom = map.getZoom();
      map.setView(center, currentZoom || 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

// Map Click Handler helper component
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    }
  });
  return null;
}

// ── Shared Map Component ───────────────────────────────────────────────────────
export default function LiveMap({ activeMissions = [], height = 480, hideWrapper = false, hideWorkshopToggle = true, onClickDetail, onNavigate, children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [systemConfig, setSystemConfig] = useState(null);

  // Routing states
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routingStart, setRoutingStart] = useState(null); // { lat, lng, name }
  const [routingEnd, setRoutingEnd] = useState(null);     // { lat, lng, name }
  const [selectPointTarget, setSelectPointTarget] = useState(null); // 'start' | 'end' | null
  const [routeAlternatives, setRouteAlternatives] = useState([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [isNavigatingActive, setIsNavigatingActive] = useState(false);
  const watchIdRef = useRef(null);

  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const userLocationRef = useRef(null);
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);
  const [isLocating, setIsLocating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocalDropdownExpanded, setIsLocalDropdownExpanded] = useState(true);
  const [toast, setToast] = useState(null);
  const searchContainerRef = useRef(null);
  const wrapperRef = useRef(null);

  // Search queries and suggestions for routing Start / End
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [endSearchQuery, setEndSearchQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingEnd, setIsSearchingEnd] = useState(false);

  const [mobileSheetState, setMobileSheetState] = useState('half'); // 'half' | 'full' | 'hidden'
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -30) {
      if (mobileSheetState === 'half') {
        setMobileSheetState('full');
      } else if (mobileSheetState === 'hidden') {
        setMobileSheetState('half');
      }
    } else if (deltaY > 30) {
      if (mobileSheetState === 'full') {
        setMobileSheetState('half');
      } else if (mobileSheetState === 'half') {
        setMobileSheetState('hidden');
      }
    }
  };

  const handleDragHandleClick = () => {
    if (mobileSheetState === 'half') {
      setMobileSheetState('full');
    } else if (mobileSheetState === 'full') {
      setMobileSheetState('half');
    } else if (mobileSheetState === 'hidden') {
      setMobileSheetState('half');
    }
  };

  const renderDragHandle = () => (
    <div 
      className="bottom-sheet-drag-handle-wrapper"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleDragHandleClick}
    >
      <div className="bottom-sheet-drag-handle"></div>
    </div>
  );


  const startActiveJourney = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingRoute(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(userLoc);
        setMapCenter([userLoc.lat, userLoc.lng]);
        
        // Update routingStart to user location
        const newStart = {
          lat: userLoc.lat,
          lng: userLoc.lng,
          name: "My Location (Active Journey)"
        };
        setRoutingStart(newStart);
        setIsNavigatingActive(true);
        setLoadingRoute(false);

        // Start tracking user location in real time
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const updatedLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(updatedLoc);
            setMapCenter([updatedLoc.lat, updatedLoc.lng]);
          },
          (err) => {
            console.error("Error watching geolocation:", err);
          },
          { enableHighAccuracy: true, distanceFilter: 10 }
        );
      },
      (error) => {
        setLoadingRoute(false);
        alert("Failed to get your location. Please check GPS permissions.");
        console.error("Error getting location:", error);
      },
      { enableHighAccuracy: true }
    );
  };

  const stopActiveJourney = () => {
    setIsNavigatingActive(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const calculateRoutes = async (startLoc, endLoc) => {
    if (!startLoc || !endLoc) return;
    setLoadingRoute(true);
    try {
      const res = await apiService.get(`/map/route?start=${startLoc.lat},${startLoc.lng}&end=${endLoc.lat},${endLoc.lng}`);
      if (res.success && res.data) {
        setRouteAlternatives(res.data);
        setSelectedRouteIdx(0);
        
        if (res.data.length > 0) {
          const coords = res.data[0].geometry.coordinates;
          if (coords && coords.length > 0) {
            const mid = coords[Math.floor(coords.length / 2)];
            setMapCenter([mid[1], mid[0]]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to calculate routes:', err);
      alert('Failed to find routing paths. Please check coordinates or try another spot.');
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleMapClick = (latlng) => {
    if (!selectPointTarget) return;
    
    const coordName = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    const pointData = {
      lat: latlng.lat,
      lng: latlng.lng,
      name: `Point on Map (${coordName})`
    };

    if (selectPointTarget === 'start') {
      setRoutingStart(pointData);
    } else if (selectPointTarget === 'end') {
      setRoutingEnd(pointData);
    }

    setSelectPointTarget(null);
  };

  const getOrRequestLocation = (callback) => {
    if (userLocation) {
      callback(userLocation);
      return;
    }
    if (!navigator.geolocation) {
      callback(null);
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        callback(loc);
      },
      (error) => {
        setIsLocating(false);
        console.error("Error getting location:", error);
        callback(null);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (isRoutingMode && routingStart && routingEnd) {
      calculateRoutes(routingStart, routingEnd);
    } else {
      setRouteAlternatives([]);
    }
  }, [routingStart, routingEnd, isRoutingMode]);

  // Sync routingStart with startSearchQuery
  useEffect(() => {
    if (routingStart) {
      setStartSearchQuery(routingStart.name);
    } else {
      setStartSearchQuery('');
    }
  }, [routingStart]);

  // Sync routingEnd with endSearchQuery
  useEffect(() => {
    if (routingEnd) {
      setEndSearchQuery(routingEnd.name);
    } else {
      setEndSearchQuery('');
    }
  }, [routingEnd]);

  // Debounced search for routing Start input
  useEffect(() => {
    if (startSearchQuery.trim().length < 3) {
      setStartSuggestions([]);
      return;
    }
    if (routingStart && startSearchQuery === routingStart.name) {
      setStartSuggestions([]);
      return;
    }

    setIsSearchingStart(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const coords = userLocationRef.current ? `&lat=${userLocationRef.current.lat}&lng=${userLocationRef.current.lng}` : '';
        const res = await apiService.get(`/map/search?q=${encodeURIComponent(startSearchQuery)}${coords}`);
        if (res.success && res.data) {
          setStartSuggestions(res.data);
        }
      } catch (err) {
        console.error('Error searching start location:', err);
      } finally {
        setIsSearchingStart(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [startSearchQuery, routingStart]);

  // Debounced search for routing Destination input
  useEffect(() => {
    if (endSearchQuery.trim().length < 3) {
      setEndSuggestions([]);
      return;
    }
    if (routingEnd && endSearchQuery === routingEnd.name) {
      setEndSuggestions([]);
      return;
    }

    setIsSearchingEnd(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const coords = userLocationRef.current ? `&lat=${userLocationRef.current.lat}&lng=${userLocationRef.current.lng}` : '';
        const res = await apiService.get(`/map/search?q=${encodeURIComponent(endSearchQuery)}${coords}`);
        if (res.success && res.data) {
          setEndSuggestions(res.data);
        }
      } catch (err) {
        console.error('Error searching destination:', err);
      } finally {
        setIsSearchingEnd(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [endSearchQuery, routingEnd]);

  const lastRecalculateTimeRef = useRef(0);

  useEffect(() => {
    if (!isNavigatingActive || !userLocation || !routingEnd || routeAlternatives.length === 0) {
      return;
    }

    // ── Arrival detection ────────────────────────────────────────────────────
    const arrivalThreshold = 30; // meters – consider arrived when within 30 m
    const distToDestination = getClientDistance(
      userLocation.lat, userLocation.lng,
      routingEnd.lat, routingEnd.lng
    );
    if (distToDestination <= arrivalThreshold) {
      setToast({ type: 'success', message: `You have arrived at ${routingEnd.name || 'your destination'}! Journey complete.` });
      setTimeout(() => setToast(null), 6000);
      stopActiveJourney();
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────
    
    const activeRoute = routeAlternatives[selectedRouteIdx];
    const details = getRemainingRouteDetails(userLocation, activeRoute);
    if (!details) return;
    
    const deviationThreshold = 50; // meters
    const now = Date.now();
    const cooldownPeriod = 15000; // 15 seconds cooldown
    
    if (details.deviationDistance > deviationThreshold && (now - lastRecalculateTimeRef.current > cooldownPeriod)) {
      console.log(`User off-route by ${details.deviationDistance.toFixed(1)}m. Recalculating...`);
      lastRecalculateTimeRef.current = now;
      
      setToast({ type: 'error', message: 'Off-route detected! Recalculating the best path...' });
      setTimeout(() => setToast(null), 5000);
      
      const freshStart = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        name: "My Location (Recalculating)"
      };
      setRoutingStart(freshStart);
    }
  }, [userLocation, isNavigatingActive, selectedRouteIdx, routeAlternatives, routingEnd]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await apiService.get('/iot/config');
        if (res.success && res.data) {
          setSystemConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch config in LiveMap:', err);
      }
    };
    fetchConfig();
  }, []);


  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (wrapperRef.current && wrapperRef.current.requestFullscreen) {
        wrapperRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };



  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setMapCenter([latitude, longitude]);
      },
      (error) => {
        setIsLocating(false);
        alert("Unable to retrieve your location. Please check browser permissions.");
        console.error("Error getting location:", error);
      },
      { enableHighAccuracy: true }
    );
  };

  const [devices, setDevices] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const latestSensor = selectedSensor ? (devices.find(d => d.id === selectedSensor.id) || selectedSensor) : null;

  const [zones] = useState(initZones);
  
  // Filter & Layer state
  const [activeFilter, setActiveFilter] = useState(null); // 'workshops' | 'sensors' | 'sos' | 'shelter' | null
  const [showWorkshopLayer, setShowWorkshopLayer] = useState(true);

  // Sync layer visibility with active filter
  useEffect(() => {
    if (activeFilter === 'workshops') {
      setShowWorkshopLayer(true);
    }
  }, [activeFilter]);
  const [workshops, setWorkshops] = useState([]);
  const [selectedWs, setSelectedWs] = useState(null);
  const [wsReviews, setWsReviews] = useState({});
  const [wsNewRating, setWsNewRating] = useState(0);
  const [wsNewText, setWsNewText] = useState('');
  const [likedWsReviews, setLikedWsReviews] = useState({});
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [loadingWsDetail, setLoadingWsDetail] = useState(false);

  // New state variables for database reviews integration
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Hazard points state
  const [hazards, setHazards] = useState([]);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [hazardVotes, setHazardVotes] = useState({});

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    if (!token) return;

    const loadProfile = async () => {
      try {
        const res = await apiService.get('/auth/profile');
        if (res && res.user) {
          setCurrentUser(res.user);
        }
      } catch (err) {
        console.error('Failed to load user profile in LiveMap:', err);
      }
    };
    loadProfile();
  }, []);

  const fetchWorkshops = async (keepSelectedId = null) => {
    try {
      const res = await apiService.get('/map/workshops');
      if (res.success && res.data) {
        const formatted = res.data.map(w => {
          const latNum = parseFloat(w.lat);
          const lngNum = parseFloat(w.lng);
          return {
            ...w,
            lat: isNaN(latNum) ? 10.03711 : latNum,
            lng: isNaN(lngNum) ? 105.78825 : lngNum,
            id: w._id,
            status: w.is_open ? 'open' : 'closed',
            flood: false,
            rating: w.rating_average || 0,
            reviewCount: w.rating_count || 0,
            cover_photo: w.cover_photo || '',
          };
        });
        setWorkshops(formatted);
        if (keepSelectedId) {
          const current = formatted.find(w => w.id === keepSelectedId);
          if (current) setSelectedWs(current);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch workshops:', err);
    }
  };

  // Fetch FULL workshop detail + reviews when selection changes
  // Key on selectedWs?.id so we don't re-run on every state merge
  useEffect(() => {
    if (!selectedWs?.id) {
      setReviewsList([]);
      return;
    }
    const wsId = selectedWs.id;

    if (typeof wsId === 'string' && wsId.startsWith('ws')) {
      // Mock workshop – use local cache
      setReviewsList(wsReviews[wsId] || []);
      return;
    }

    // Real DB workshop: fetch fresh detail then reviews
    const fetchWsDetailAndReviews = async () => {
      setLoadingWsDetail(true);
      try {
        const detailRes = await apiService.get(`/workshops/${wsId}`);
        if (detailRes.success && detailRes.data) {
          setSelectedWs(prev => ({ ...prev, ...detailRes.data }));
        }
      } catch (err) {
        console.warn('Failed to fetch workshop detail:', err);
      } finally {
        setLoadingWsDetail(false);
      }

      try {
        setLoadingReviews(true);
        const revRes = await apiService.get(`/workshops/${wsId}/reviews`);
        if (revRes.success && revRes.data) {
          setReviewsList(revRes.data);
        } else {
          setReviewsList([]);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setReviewsList([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchWsDetailAndReviews();
  }, [selectedWs?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHazards = async () => {
    try {
      const res = await apiService.get('/incident-reports');
      if (res.success && res.data) {
        const parseImages = (imgs) => {
          if (typeof imgs === 'string') {
            try { return JSON.parse(imgs); } catch(e) { return imgs ? [imgs] : []; }
          }
          return Array.isArray(imgs) ? imgs : [];
        };
        const approvedHazards = res.data.filter(r => r.moderation_status === 'Approved' || r.status === 'approved').map(r => {
          return { ...r, images: parseImages(r.images) };
        });
        setHazards(approvedHazards);
        
        let userId = currentUser?._id;
        if (!userId) {
          const tokenStr = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
          if (tokenStr) {
             try { const tData = JSON.parse(atob(tokenStr.split('.')[1])); userId = tData.id; } catch(e){}
          }
        }
        if (!userId) {
          userId = localStorage.getItem('guest_id');
        }
        
        if (userId) {
          const initialVotes = {};
          approvedHazards.forEach(report => {
            if (report.voters && report.voters.length > 0) {
              const myVote = report.voters.find(v => v.user_id === userId);
              if (myVote) {
                initialVotes[report._id] = myVote.vote_type;
              }
            }
          });
          setHazardVotes(initialVotes);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch hazards:', err);
    }
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await apiService.get('/iot/devices');
        if (res.success && res.data && res.data.length > 0) {
          const formatted = res.data
            .filter(d => !d.is_disabled)  // Chỉ hiển thị thiết bị chưa bị disabled
            .map(d => ({
              ...d,
              id: d.device_code || d._id,
              waterLevel: d.current_water_level !== undefined ? d.current_water_level : (d.waterLevel || 0),
              status: d.status || 'active',
              lastReading: d.last_reading_time ? new Date(d.last_reading_time).toLocaleTimeString('vi-VN') : (d.lastReading || ''),
              battery_percent: d.current_battery_level || 0
            }));
          setDevices(formatted);
        }
      } catch (error) {
        console.warn('Failed to fetch devices, falling back to mock data:', error);
      }
    };

    // Set up WebSocket for real-time telemetry
    let ws = null;
    const connectWebSocket = () => {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const wsUrl = backendUrl.replace('http', 'ws').replace('/api', '');
      
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('LiveMap WebSocket Connected');
      };
      
    ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Real-time system config updates
          if (msg.type === 'system_config_changed' && msg.config) {
            setSystemConfig(msg.config);
          }

          // Real-time telemetry update
          if (msg.type === 'iot_telemetry' && msg.device) {
            setDevices(prevDevices => prevDevices.map(d => {
              if (d.id !== msg.device.device_code) return d;
              return {
                ...d,
                water_percent: msg.device.water_percent,
                warning_water_status: msg.device.warning_water_status,
                waterLevel: msg.device.current_water_level,
                battery_percent: msg.device.current_battery_level,
                lastReading: new Date(msg.device.last_reading_time).toLocaleTimeString('vi-VN'),
                lat: msg.device.lat || d.lat,
                lng: msg.device.lng || d.lng,
                status: 'Online',
              };
            }));
          }

          // Admin toggled a device: add or remove from map immediately
          if (msg.type === 'device_status_changed') {
            if (msg.is_disabled) {
              // Remove disabled device from map
              setDevices(prev => prev.filter(d => d.id !== msg.device_code));
            } else {
              // Re-fetch to get full device data for newly enabled device
              apiService.get('/iot/devices').then(res => {
                if (res.success && res.data) {
                  const enabled = res.data.find(d => d.device_code === msg.device_code);
                  if (enabled) {
                    setDevices(prev => [
                      ...prev.filter(d => d.id !== msg.device_code),
                      {
                        ...enabled,
                        id: enabled.device_code || enabled._id,
                        waterLevel: enabled.current_water_level || 0,
                        status: enabled.status || 'Offline',
                        lastReading: enabled.last_reading_time
                          ? new Date(enabled.last_reading_time).toLocaleTimeString('vi-VN') : '',
                        battery_percent: enabled.current_battery_level || 0
                      }
                    ]);
                  }
                }
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };
      
      ws.onclose = () => {
        setTimeout(connectWebSocket, 3000);
      };
    };

    fetchDevices();
    fetchWorkshops();
    fetchHazards();
    connectWebSocket();

    // Automatically fetch user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.warn("Failed to get initial user location:", error);
        },
        { enableHighAccuracy: true }
      );
    }

    const intervalId = setInterval(() => {
      fetchDevices();
      fetchWorkshops();
      fetchHazards();
    }, 5000);

    return () => {
      if (ws) ws.close();
      clearInterval(intervalId);
    };
  }, []);

  // Poll selected SENSOR detail every 5 seconds
  // This ensures IoT detail reflects latest admin config edits and telemetry
  const selectedSensorIdRef = useRef(null);
  useEffect(() => {
    selectedSensorIdRef.current = selectedSensor?.id ?? null;
  }, [selectedSensor?.id]);

  useEffect(() => {
    if (!selectedSensor?.id) return;
    const deviceCode = selectedSensor.id;

    const pollSensorDetail = async () => {
      if (!selectedSensorIdRef.current) return;
      try {
        const res = await apiService.get(`/iot/devices/${deviceCode}`);
        if (res.success && res.data) {
          const d = res.data;
          setSelectedSensor(prev => {
            if (!prev || prev.id !== deviceCode) return prev;
            return {
              ...prev,
              ...d,
              id: d.device_code || d._id,
              waterLevel: d.current_water_level !== undefined ? d.current_water_level : prev.waterLevel,
              battery_percent: d.current_battery_level !== undefined ? d.current_battery_level : prev.battery_percent,
              lastReading: d.last_reading_time
                ? new Date(d.last_reading_time).toLocaleTimeString('vi-VN')
                : prev.lastReading,
              status: d.status || prev.status,
            };
          });
        }
      } catch (err) {
        console.warn('Failed to poll sensor detail:', err);
      }
    };

    // Fetch immediately then every 5 s
    pollSensorDetail();
    const sensorPollId = setInterval(pollSensorDetail, 5000);
    return () => clearInterval(sensorPollId);
  }, [selectedSensor?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const voteHazard = async (reportId, type) => {
    let userId = currentUser?._id || currentUser?.id;
    if (!userId) {
      const tokenStr = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      if (tokenStr) {
         try { const tData = JSON.parse(atob(tokenStr.split('.')[1])); userId = tData.id; } catch(e){}
      }
    }
    if (!userId) {
      userId = localStorage.getItem('guest_id');
      if (!userId) {
        userId = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guest_id', userId);
      }
    }
    
    const storageKey = `my_reports_${userId}`;
    const myReports = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const legacyReports = [...JSON.parse(localStorage.getItem('my_reports') || '[]'), ...JSON.parse(localStorage.getItem('my_reports_guest') || '[]')];

    const report = hazards.find(r => r._id === reportId);
    
    if (myReports.includes(reportId) || legacyReports.includes(reportId) || (report && report.reporter_id === userId)) {
      setToast({ type: 'error', message: 'You cannot verify your own report!' });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    // Determine previous vote
    const prevVote = hazardVotes[reportId] || null;
    const newVoteType = prevVote === type ? null : type;

    try {
      const res = await apiService.post(`/incident-reports/${reportId}/vote`, {
        vote_type: newVoteType,
        previous_vote: prevVote,
        user_id: userId
      });
      if (res.success && res.data) {
        setHazardVotes(prev => ({ ...prev, [reportId]: newVoteType }));
        const parseImages = (imgs) => {
          if (typeof imgs === 'string') {
            try { return JSON.parse(imgs); } catch(e) { return imgs ? [imgs] : []; }
          }
          return Array.isArray(imgs) ? imgs : [];
        };
        const updatedReport = { ...res.data, images: parseImages(res.data.images) };
        setHazards(prev => prev.map(r => r._id === reportId ? updatedReport : r));
        if (selectedHazard && selectedHazard._id === reportId) {
          setSelectedHazard(updatedReport);
        }
      } else {
        alert(res.message || 'Error updating vote');
      }
    } catch (err) {
      console.error('Error voting:', err);
      alert('Error connecting to server. Please try again later.');
    }
  };

  // Debounced search for openstreetmap proxy
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    if (['Tiệm sửa xe', 'Trạm đo mực nước', 'Cảnh báo ngập', 'Điểm sơ tán'].includes(searchQuery.trim())) {
      setSearchResults([]);
      return; // Skip OSM search for local filters
    }

    const isExactMatch = searchResults.some(r => r.display_name === searchQuery);
    if (isExactMatch) return;

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const coords = userLocationRef.current ? `&lat=${userLocationRef.current.lat}&lng=${userLocationRef.current.lng}` : '';
        const res = await apiService.get(`/map/search?q=${encodeURIComponent(searchQuery)}${coords}`);
        if (res.success && res.data) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error('Error searching map area:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Click outside listener for autocomplete suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (!event.target.closest('.routing-start-container')) {
        setStartSuggestions([]);
      }
      if (!event.target.closest('.routing-end-container')) {
        setEndSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const submitWsReview = async () => {
    if (!wsNewRating || !wsNewText.trim() || !selectedWs) return;
    if (typeof selectedWs.id === 'string' && selectedWs.id.startsWith('ws')) {
      const rev = { id: `r${Date.now()}`, user: "User", stars: wsNewRating, text: wsNewText.trim(), time: new Date().toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' }), likes: 0 };
      setWsReviews(prev => ({ ...prev, [selectedWs.id]: [rev, ...(prev[selectedWs.id] || [])] }));
      setReviewsList(prev => [rev, ...prev]);
      setWsNewRating(0);
      setWsNewText('');
    } else {
      try {
        const res = await apiService.post(`/workshops/${selectedWs.id}/reviews`, {
          rating: wsNewRating,
          content: wsNewText.trim()
        });
        if (res.success && res.data) {
          setReviewsList(prev => [res.data, ...prev]);
          setWsNewRating(0);
          setWsNewText('');
          await fetchWorkshops(selectedWs.id);
        }
      } catch (err) {
        console.error('Error submitting review in map:', err);
        alert(err.message || 'Failed to submit review.');
      }
    }
  };

  const likeWsReview = (reviewId) => setLikedWsReviews(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));

  const handleWsMarkerClick = async (ws) => {
    setActiveFilter('workshops');
    setSelectedWs(ws); // Show basic data immediately while loading
    setShowReviewPanel(false);
    setSelectedSensor(null);
    setMobileSheetState('half');
    if (ws.lat && ws.lng) {
      setMapCenter([ws.lat, ws.lng]);
    }
    // Fetch fresh detail from dedicated Detail API
    const wsId = ws.id || ws._id;
    if (wsId && !String(wsId).startsWith('ws')) {
      try {
        setLoadingWsDetail(true);
        const res = await apiService.get(`/workshops/${wsId}`);
        if (res.success && res.data) {
          setSelectedWs(prev => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.warn('Failed to fetch workshop detail, using list data:', err);
      } finally {
        setLoadingWsDetail(false);
      }
    }
  };

  const isAreaSelection = searchResults.some(r => r.display_name === searchQuery);

  const filteredDevices = devices.filter(d => {
    if (!searchQuery.trim() || isAreaSelection) return true;
    return (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (d.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (d.id || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isStartCurrentLocation = routingStart && (
    routingStart.name === "My Location" || 
    routingStart.name === "My Location (Active Journey)" || 
    (userLocation && 
     Math.abs(routingStart.lat - userLocation.lat) < 0.0001 && 
     Math.abs(routingStart.lng - userLocation.lng) < 0.0001)
  );

  const innerContent = (
    <>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          <CloudRain size={15} color="var(--cyan-400)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Map (Live)</span>
        </div>

        {/* Layer toggles */}
        {!hideWorkshopToggle && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
            <button
              onClick={() => setShowWorkshopLayer(p => !p)}
              style={{
                padding: '2px 10px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${showWorkshopLayer ? '#f97316' : 'var(--border-dim)'}`,
                background: showWorkshopLayer ? 'rgba(249,115,22,0.12)' : 'transparent',
                color: showWorkshopLayer ? 'var(--orange-400)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <Wrench size={11} /> Car workshop
            </button>
          </div>
        )}

        {/* Search has been moved to overlay panel */}

        {/* Floating action button for current location */}
        <button
          onClick={handleLocateUser}
          title="Current Location"
          style={{
            position: 'absolute',
            bottom: '114px', /* Increased to prevent overlap with zoom controls */
            right: '12px',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: '#fff',
            border: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'background 0.2s',
            color: userLocation ? '#2563eb' : '#555'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f4f4f4'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          {isLocating ? <Loader size={20} className="animate-spin" /> : <LocateFixed size={20} strokeWidth={2.2} />}
        </button>

      </div>

      <div style={{ flex: 1, background: '#080d16', position: 'relative', overflow: 'hidden', zIndex: 0 }}>
        {toast && (
          <div style={{ position: 'absolute', top: 20, right: 20, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', padding: '12px 20px', borderRadius: 8, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <AlertTriangle size={18} /> {toast.message}
          </div>
        )}
        
        {/* --- GOOGLE MAPS STYLE SEARCH PANEL --- */}
        <div className="map-search-panel-container">
          {isRoutingMode ? (
            isNavigatingActive ? (() => {
              let HUDDistance = 0;
              let HUDDuration = 0;
              if (routeAlternatives[selectedRouteIdx]) {
                const details = getRemainingRouteDetails(userLocation, routeAlternatives[selectedRouteIdx]);
                if (details) {
                  HUDDistance = details.distance;
                  HUDDuration = details.duration;
                } else {
                  HUDDistance = routeAlternatives[selectedRouteIdx].distance;
                  HUDDuration = routeAlternatives[selectedRouteIdx].weighted_duration;
                }
              } else if (userLocation && routingEnd) {
                HUDDistance = getClientDistance(userLocation.lat, userLocation.lng, routingEnd.lat, routingEnd.lng);
                const estimatedRouteDistance = HUDDistance * 1.3;
                const speedMps = 25 * 1000 / 3600; // 25 km/h in m/s
                HUDDuration = Math.round(estimatedRouteDistance / speedMps);
              }

              return (
                /* --- ACTIVE NAVIGATION HUD --- */
                <div className={`map-sidebar-panel active-nav-hud-container sheet-${mobileSheetState}`} style={{ padding: 20, gap: 16, maxHeight: 'calc(100vh - 60px)' }}>
                  {renderDragHandle()}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: 10 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Navigation size={18} className="animate-pulse" /> Live Navigation
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(34,197,94,0.15)', color: 'var(--green-400)', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>Active</span>
                  </div>

                  {/* Destination */}
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Destination</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{routingEnd ? routingEnd.name : 'Unknown Destination'}</div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border-dim)' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Est. Time</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {Math.round(HUDDuration / 60)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>mins</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Distance</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {(HUDDistance / 1000).toFixed(1)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>km</span>
                      </div>
                    </div>
                  </div>

                  {/* Warnings / Safety Check */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto' }} className="sidebar-list">
                    {routeAlternatives[selectedRouteIdx] ? (
                      <>
                        {routeAlternatives[selectedRouteIdx].is_flooded ? (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 12px', borderRadius: 8, color: '#ef4444', fontSize: '0.8rem' }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                              <strong style={{ display: 'block', marginBottom: 2 }}>Flooded Route Warning!</strong>
                              Your path passes through {routeAlternatives[selectedRouteIdx].floods.length} flooded zones. Avoid if possible.
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '10px 12px', borderRadius: 8, color: '#22c55e', fontSize: '0.8rem' }}>
                            <CheckCircle size={16} style={{ flexShrink: 0 }} />
                            <div>
                              <strong>Flood Safe Route</strong><br/>
                              No flooded sensors reported on this path.
                            </div>
                          </div>
                        )}

                        {routeAlternatives[selectedRouteIdx].hazards && routeAlternatives[selectedRouteIdx].hazards.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', padding: '10px 12px', borderRadius: 8, color: 'var(--gold-400)', fontSize: '0.8rem' }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                              <strong style={{ display: 'block', marginBottom: 2 }}>Hazard points ahead!</strong>
                              Encountered {routeAlternatives[selectedRouteIdx].hazards.length} hazards (+{Math.round((routeAlternatives[selectedRouteIdx].weighted_duration - routeAlternatives[selectedRouteIdx].duration)/60)}m delay penalty).
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', padding: '10px 12px', borderRadius: 8, color: 'var(--cyan-400)', fontSize: '0.8rem' }}>
                        <Navigation size={16} style={{ flexShrink: 0 }} />
                        <div>
                          <strong>Direct Navigation</strong><br/>
                          Navigating directly without pre-calculated OSRM route.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* End Journey Button */}
                  <button 
                    onClick={stopActiveJourney}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginTop: 'auto',
                      flexShrink: 0
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                  >
                    <X size={16} /> End Journey
                  </button>
                </div>
              );
            })() : (
              /* --- ROUTING PANEL --- */
              <div className={`map-sidebar-panel routing-panel-container sheet-${mobileSheetState}`} style={{ padding: 16, gap: 12, maxHeight: 'calc(100vh - 60px)' }}>
                {renderDragHandle()}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Navigation size={18} color="var(--cyan-400)" /> Directions
                  </span>
                  <button 
                    onClick={() => {
                      setIsRoutingMode(false);
                      setRoutingStart(null);
                      setRoutingEnd(null);
                      setRouteAlternatives([]);
                      setSelectPointTarget(null);
                      stopActiveJourney();
                      setStartSearchQuery('');
                      setEndSearchQuery('');
                      setStartSuggestions([]);
                      setEndSuggestions([]);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Start Input */}
                <div className="routing-start-container" style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', zIndex: startSuggestions.length > 0 ? 100 : 2 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Start Location</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        value={startSearchQuery}
                        onChange={e => {
                          const val = e.target.value;
                          setStartSearchQuery(val);
                          if (!val.trim()) {
                            setRoutingStart(null);
                            setStartSuggestions([]);
                          }
                        }}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => e.stopPropagation()}
                        placeholder="Search starting point..."
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.03)',
                          border: selectPointTarget === 'start' ? '1px solid var(--cyan-500)' : '1px solid var(--border-dim)',
                          borderRadius: 6,
                          padding: '8px 30px 8px 12px',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      {isSearchingStart ? (
                        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                          <Loader size={12} className="animate-spin" color="var(--cyan-400)" />
                        </div>
                      ) : startSearchQuery ? (
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setStartSearchQuery('');
                            setRoutingStart(null);
                            setStartSuggestions([]);
                          }} 
                          onMouseDown={e => e.stopPropagation()}
                          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                      
                      {/* Start Suggestions Dropdown */}
                      {startSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                          zIndex: 1010,
                          maxHeight: 180,
                          overflowY: 'auto',
                          marginTop: 4
                        }}>
                          {startSuggestions.map((s, idx) => (
                            <div
                              key={idx}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setRoutingStart({
                                  lat: parseFloat(s.lat),
                                  lng: parseFloat(s.lon),
                                  name: s.display_name
                                });
                                setStartSuggestions([]);
                              }}
                              style={{
                                padding: '8px 12px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                borderBottom: idx < startSuggestions.length - 1 ? '1px solid var(--border-dim)' : 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {s.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        getOrRequestLocation((loc) => {
                          if (loc) {
                            setRoutingStart({
                              lat: loc.lat,
                              lng: loc.lng,
                              name: "My Location"
                            });
                          } else {
                            alert("Could not detect your current location. Please check browser permissions or use 'Select on Map'.");
                          }
                        });
                      }}
                      title="Use Current Location"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-dim)', borderRadius: 6, padding: '8px 10px', color: 'var(--cyan-400)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <LocateFixed size={14} />
                    </button>
                    <button 
                      onClick={() => setSelectPointTarget('start')}
                      title="Select on Map"
                      style={{ background: selectPointTarget === 'start' ? 'var(--cyan-500)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--border-dim)', borderRadius: 6, padding: '8px 10px', color: selectPointTarget === 'start' ? '#000' : 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <MapPin size={14} />
                    </button>
                  </div>
                </div>

                {/* Destination Input */}
                <div className="routing-end-container" style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', zIndex: endSuggestions.length > 0 ? 100 : 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Destination Location</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        value={endSearchQuery}
                        onChange={e => {
                          const val = e.target.value;
                          setEndSearchQuery(val);
                          if (!val.trim()) {
                            setRoutingEnd(null);
                            setEndSuggestions([]);
                          }
                        }}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => e.stopPropagation()}
                        placeholder="Search destination..."
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.03)',
                          border: selectPointTarget === 'end' ? '1px solid var(--cyan-500)' : '1px solid var(--border-dim)',
                          borderRadius: 6,
                          padding: '8px 30px 8px 12px',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      {isSearchingEnd ? (
                        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                          <Loader size={12} className="animate-spin" color="var(--cyan-400)" />
                        </div>
                      ) : endSearchQuery ? (
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEndSearchQuery('');
                            setRoutingEnd(null);
                            setEndSuggestions([]);
                          }} 
                          onMouseDown={e => e.stopPropagation()}
                          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                      
                      {/* End Suggestions Dropdown */}
                      {endSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                          zIndex: 1010,
                          maxHeight: 180,
                          overflowY: 'auto',
                          marginTop: 4
                        }}>
                          {endSuggestions.map((s, idx) => (
                            <div
                              key={idx}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setRoutingEnd({
                                  lat: parseFloat(s.lat),
                                  lng: parseFloat(s.lon),
                                  name: s.display_name
                                });
                                setEndSuggestions([]);
                              }}
                              style={{
                                padding: '8px 12px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                borderBottom: idx < endSuggestions.length - 1 ? '1px solid var(--border-dim)' : 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {s.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectPointTarget('end')}
                      title="Select on Map"
                      style={{ background: selectPointTarget === 'end' ? 'var(--cyan-500)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--border-dim)', borderRadius: 6, padding: '8px 10px', color: selectPointTarget === 'end' ? '#000' : 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <MapPin size={14} />
                    </button>
                  </div>
                </div>

                {/* Select on map notification */}
                {selectPointTarget && (
                  <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 6, padding: '8px 12px', fontSize: '0.8rem', color: 'var(--cyan-400)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Click on map to select {selectPointTarget === 'start' ? 'start point' : 'destination'}.</span>
                    <button onClick={() => setSelectPointTarget(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  </div>
                )}

                {/* Start Journey Button (Visible immediately if destination is set and start is current location) */}
                {isStartCurrentLocation && routingEnd && (
                  <button 
                    onClick={startActiveJourney}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--blue-600)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginTop: 4,
                      flexShrink: 0
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--blue-600)'}
                  >
                    <Navigation size={16} /> Start Journey
                  </button>
                )}

                {/* Route Alternatives List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }} className="sidebar-list">
                  {loadingRoute ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Loader className="animate-spin" size={24} color="var(--cyan-400)" />
                      <span style={{ fontSize: '0.85rem' }}>Finding best path alternatives...</span>
                    </div>
                  ) : routeAlternatives.length > 0 ? (
                    <>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Suggested Routes</div>
                      {routeAlternatives.map((route, idx) => {
                        const isSel = selectedRouteIdx === idx;
                        const hasFloods = route.is_flooded;
                        const hasHazards = route.hazards && route.hazards.length > 0;
                        
                        return (
                          <div 
                            key={idx}
                            onClick={() => setSelectedRouteIdx(idx)}
                            style={{
                              padding: 12,
                              borderRadius: 8,
                              border: isSel ? '1px solid var(--cyan-500)' : '1px solid var(--border-dim)',
                              background: isSel ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.02)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSel ? 'var(--cyan-400)' : 'var(--text-primary)' }}>
                                Option {idx + 1} {idx === 0 && !hasFloods ? '(Recommended)' : ''}
                              </span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {Math.round(route.weighted_duration / 60)} mins
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span>Distance: {(route.distance / 1000).toFixed(1)} km</span>
                              {hasHazards && (
                                <span style={{ color: 'var(--gold-400)', fontWeight: 600 }}>
                                  {route.hazards.length} hazards (+{Math.round((route.weighted_duration - route.duration)/60)}m weight)
                                </span>
                              )}
                            </div>

                            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {hasFloods ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                                  <AlertTriangle size={12} /> Flooded! Passes {route.floods.length} warnings.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: '0.75rem', fontWeight: 600 }}>
                                  <CheckCircle size={12} /> Flood Safe Route
                                </div>
                              )}
                              
                              {isSel && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 12, borderLeft: '1px solid var(--border-dim)', marginTop: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {route.floods.map((f, i) => (
                                    <div key={i}>⚠️ Flooded: {f.name} (level: {f.warning_water_status})</div>
                                  ))}
                                  {route.hazards.map((h, i) => (
                                    <div key={i}>⚠️ Hazard: {h.title} ({h.report_type})</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Start Journey button removed from bottom, moved above list for immediate access */}
                    </>
                  ) : (
                    routingStart && routingEnd && (
                      <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        No routes found.
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          ) : (
            <>
              <div ref={searchContainerRef} style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-elevated)', borderRadius: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', padding: '6px 12px', flexShrink: 0 }}>
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              /* Override Leaflet Zoom Controls to match Google Maps style */
              .leaflet-right .leaflet-control-zoom {
                border: none !important;
                box-shadow: 0 1px 4px rgba(0,0,0,0.3) !important;
                border-radius: 8px !important;
                overflow: hidden;
                margin-right: 12px !important;
                margin-bottom: 12px !important;
              }
              .leaflet-control-zoom a {
                background: #fff !important;
                color: #555 !important;
                width: 38px !important;
                height: 38px !important;
                line-height: 38px !important;
                font-size: 18px !important;
                font-weight: 600 !important;
              }
              .leaflet-control-zoom a:hover {
                background: #f4f4f4 !important;
                color: #333 !important;
              }
              .leaflet-control-zoom a.leaflet-disabled {
                color: #bbb !important;
                background: #fff !important;
              }
            `}</style>
            
            {/* Unified Search Icon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '6px' }}>
              <Search size={20} color="var(--text-muted)" />
            </div>

            <div style={{ position: 'relative', flex: 1 }}>
              <input
                placeholder="Find area or coordinates..."
                value={searchQuery}
                onChange={e => { 
                  setSearchQuery(e.target.value); 
                  setShowSuggestions(true); 
                }}
                onFocus={() => setShowSuggestions(true)}
                style={{ height: 36, fontSize: '0.95rem', paddingLeft: 4, paddingRight: 32, width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSuggestions(false); setSearchedLocation(null); setActiveFilter(null); }} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  <X size={16} />
                </button>
              )}
              {/* Autocomplete suggestion dropdown overlay */}
              {showSuggestions && (searchResults.length > 0 || isSearching) && (
                <div className="map-autocomplete-suggestions">
                  {isSearching && (
                    <div style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Searching...
                    </div>
                  )}
                  {!isSearching && searchQuery.trim() !== '' && searchResults.map((res, idx) => (
                    <div
                      key={res.place_id || idx}
                      onClick={() => {
                        setMapCenter([res.lat, res.lon]);
                        setSearchedLocation({ lat: res.lat, lng: res.lon, name: res.display_name });
                        setSearchQuery(res.display_name);
                        setShowSuggestions(false);
                        setMobileSheetState('half');
                      }}
                      style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid var(--border-dim)', transition: 'background 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(6, 182, 214, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      📍 {res.display_name}
                    </div>
                  ))}
                  
                  {!isSearching && searchQuery.trim() === '' && activeFilter && activeFilter !== 'workshops' && (() => {
                    let localData = [];
                    if (activeFilter === 'sensors') localData = filteredDevices.map(d => ({ id: d.id, name: d.name, lat: d.lat || latLngMap[d.id]?.[0], lon: d.lng || latLngMap[d.id]?.[1] }));
                    if (activeFilter === 'sos') localData = activeMissions.map(m => ({ id: m.id, name: `SOS: ${m.location}`, lat: m.lat, lon: m.lng }));
                    if (activeFilter === 'shelter') localData = []; // add shelter data if any

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div 
                          onClick={() => setIsLocalDropdownExpanded(!isLocalDropdownExpanded)}
                          style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'var(--bg-elevated)', borderBottom: isLocalDropdownExpanded ? '1px solid var(--border-dim)' : 'none' }}
                        >
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            {localData.length} results
                          </span>
                          <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isLocalDropdownExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                        {isLocalDropdownExpanded && localData.map((res, idx) => {
                          if (!res.lat || !res.lon) return null;
                          return (
                            <div
                              key={res.id || idx}
                              onClick={() => {
                                setMapCenter([res.lat, res.lon]);
                                setShowSuggestions(false);
                                setMobileSheetState('half');
                              }}
                              style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', borderBottom: idx === localData.length - 1 ? 'none' : '1px solid var(--border-dim)', transition: 'background 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              onMouseEnter={(e) => e.target.style.background = 'rgba(249, 115, 22, 0.1)'}
                              onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                              📌 {res.name}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* HORIZONTAL FILTER PILLS */}
          {!selectedWs && !selectedSensor && (
            <div className="filter-pills-wrapper">
              <style>{`
                .filter-pills-wrapper {
                  pointer-events: auto;
                  display: flex;
                  gap: 8px;
                  overflow-x: auto;
                  padding-bottom: 4px;
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                  position: absolute;
                  top: 0;
                  left: 396px; /* 380 width + 16 gap */
                  max-width: calc(100vw - 440px);
                }
                .filter-pills-wrapper::-webkit-scrollbar {
                  display: none;
                }
                @media (max-width: 768px) {
                  .filter-pills-wrapper {
                    position: static;
                    max-width: 100%;
                  }
                }
                .filter-pill {
                   display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; background: var(--bg-elevated); box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor: pointer; white-space: nowrap; font-size: 0.85rem; font-weight: 500; border: 1px solid var(--border-subtle); color: var(--text-primary); transition: all 0.2s;
                }
                .filter-pill:hover { filter: brightness(1.3); }
                .filter-pill.active { background: var(--bg-elevated); color: var(--cyan-400); border: 1px solid var(--cyan-500); box-shadow: 0 0 10px rgba(6, 182, 214, 0.3); }

                .sidebar-list {
                  overflow-y: auto;
                  flex: 1;
                  min-height: 0;
                }
                .sidebar-list::-webkit-scrollbar {
                  width: 6px;
                }
                .sidebar-list::-webkit-scrollbar-thumb {
                  background: rgba(255,255,255,0.15);
                  border-radius: 10px;
                }
                .sidebar-list::-webkit-scrollbar-track {
                  background: transparent;
                }
                .sidebar-container { margin-top: 0; }
                @media (max-width: 768px) {
                  .sidebar-container { margin-top: 8px; }
                }
              `}</style>
              
              <div className={`filter-pill ${activeFilter === 'workshops' ? 'active' : ''}`} onClick={() => {
                const isActive = activeFilter === 'workshops';
                if (isActive && mobileSheetState === 'hidden') {
                  setMobileSheetState('half');
                } else {
                  setActiveFilter(isActive ? null : 'workshops');
                  setIsLocalDropdownExpanded(true);
                  setShowSuggestions(true);
                  setMobileSheetState('half');
                }
              }}>
                <Wrench size={14} /> Workshops
              </div>
              <div className={`filter-pill ${activeFilter === 'sensors' ? 'active' : ''}`} onClick={() => {
                const isActive = activeFilter === 'sensors';
                if (isActive && mobileSheetState === 'hidden') {
                  setMobileSheetState('half');
                } else {
                  setActiveFilter(isActive ? null : 'sensors');
                  setIsLocalDropdownExpanded(true);
                  setShowSuggestions(true);
                  setMobileSheetState('half');
                }
              }}>
                <Activity size={14} /> IoT Sensors
              </div>
              <div className={`filter-pill ${activeFilter === 'sos' ? 'active' : ''}`} onClick={() => {
                const isActive = activeFilter === 'sos';
                if (isActive && mobileSheetState === 'hidden') {
                  setMobileSheetState('half');
                } else {
                  setActiveFilter(isActive ? null : 'sos');
                  setIsLocalDropdownExpanded(true);
                  setShowSuggestions(true);
                  setMobileSheetState('half');
                }
              }}>
                <AlertTriangle size={14} /> Flood Warnings
              </div>
              <div className={`filter-pill ${activeFilter === 'shelter' ? 'active' : ''}`} onClick={() => {
                const isActive = activeFilter === 'shelter';
                if (isActive && mobileSheetState === 'hidden') {
                  setMobileSheetState('half');
                } else {
                  setActiveFilter(isActive ? null : 'shelter');
                  setIsLocalDropdownExpanded(true);
                  setShowSuggestions(true);
                  setMobileSheetState('half');
                }
              }}>
                <Home size={14} /> Shelters
              </div>
              <div className={`filter-pill ${activeFilter === 'hazards' ? 'active' : ''}`} onClick={() => {
                const isActive = activeFilter === 'hazards';
                if (isActive && mobileSheetState === 'hidden') {
                  setMobileSheetState('half');
                } else {
                  setActiveFilter(isActive ? null : 'hazards');
                  setIsLocalDropdownExpanded(true);
                  setShowSuggestions(true);
                  setMobileSheetState('half');
                }
              }}>
                <Camera size={14} /> Hazard Points
              </div>
            </div>
          )}

          {/* SIDEBAR: WORKSHOPS LIST */}
          {activeFilter === 'workshops' && searchQuery.trim() === '' && (
            <div className={`sidebar-container map-sidebar-panel sheet-${mobileSheetState}`} style={{ overflow: 'hidden' }}>
              {renderDragHandle()}
              {selectedWs ? (
                // Google Maps style Detail Panel inside the sidebar!
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  {/* Top Header Row with Back Button */}
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                    <button 
                      onClick={() => { setSelectedWs(null); setShowReviewPanel(false); }} 
                      style={{ background: 'none', border: 'none', color: 'var(--cyan-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, padding: 0 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                      Back to list
                    </button>
                    <button 
                      onClick={() => { setSelectedWs(null); setShowReviewPanel(false); }} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Detail Panel Scrollable Body */}
                  <div className="sidebar-list" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                    {loadingWsDetail && (
                      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <Loader size={12} className="animate-spin" /> Refreshing...
                      </div>
                    )}
                    {/* Cover Photo */}
                    <div style={{ height: 160, position: 'relative', overflow: 'hidden', background: '#1e293b', flexShrink: 0 }}>
                      <img 
                        src={selectedWs.cover_photo || `https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800`} 
                        alt={selectedWs.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ position: 'absolute', top: 10, left: 10 }}>
                        <span className={`badge ${selectedWs.status === 'open' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.65rem', padding: '3px 6px' }}>
                          {selectedWs.status === 'open' ? "Open" : "Closed"}
                        </span>
                      </div>
                    </div>

                    {/* Shop basic info */}
                    <div style={{ padding: 16 }}>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>{selectedWs.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>{selectedWs.rating}</span>
                        <StarRating value={selectedWs.rating} readonly size={12} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({selectedWs.reviewCount || selectedWs.reviews || 0} Reviews)</span>
                      </div>

                      {/* Circular Quick Action Buttons */}
                      <div style={{ display: 'flex', gap: 24, marginBottom: 16, borderBottom: '1px solid var(--border-dim)', paddingBottom: 16 }}>
                        {/* Directions (Active) */}
                        <div 
                          onClick={() => {
                            setIsRoutingMode(true);
                            setRoutingEnd({
                              lat: selectedWs.lat,
                              lng: selectedWs.lng,
                              name: selectedWs.name
                            });
                            getOrRequestLocation((loc) => {
                              if (loc) {
                                setRoutingStart({
                                  lat: loc.lat,
                                  lng: loc.lng,
                                  name: "My Location"
                                });
                              } else {
                                setRoutingStart(null);
                              }
                            });
                            setSelectedWs(null);
                          }}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--cyan-400)', cursor: 'pointer' }}
                        >
                          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Navigation size={18} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Directions</span>
                        </div>

                        {/* Chat */}
                        <div 
                          onClick={() => {
                            const isOwner = currentUser && selectedWs && currentUser._id === selectedWs.owner_id;
                            if (isOwner) return;
                            if (!selectedWs.owner_id) {
                              alert("This workshop does not have an owner account associated.");
                              return;
                            }
                            localStorage.setItem('pending_chat_user', JSON.stringify({
                              id: selectedWs.owner_id,
                              name: selectedWs.owner_name || selectedWs.name,
                              role: 'Workshop',
                              avatar_url: selectedWs.cover_photo || ''
                            }));
                            
                            // Determine target chat page based on user role
                            const targetPage = (currentUser && currentUser.role === 'volunteer')
                              ? 'volunteer-notifications'
                              : 'user-notifications';
                            
                            if (onNavigate) {
                              onNavigate(targetPage);
                            }
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            color: (currentUser && selectedWs && currentUser._id === selectedWs.owner_id) ? 'rgba(255,255,255,0.2)' : 'var(--cyan-400)',
                            cursor: (currentUser && selectedWs && currentUser._id === selectedWs.owner_id) ? 'not-allowed' : 'pointer',
                            opacity: (currentUser && selectedWs && currentUser._id === selectedWs.owner_id) ? 0.4 : 1,
                            pointerEvents: (currentUser && selectedWs && currentUser._id === selectedWs.owner_id) ? 'none' : 'auto'
                          }}
                        >
                          <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            background: (currentUser && selectedWs && currentUser._id === selectedWs.owner_id) ? 'rgba(255,255,255,0.02)' : 'rgba(6,182,212,0.1)',
                            border: (currentUser && selectedWs && currentUser._id === selectedWs.owner_id) ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(6,182,212,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}>
                            <MessageSquare size={18} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Chat</span>
                        </div>
                      </div>

                      {/* Detail list info */}
                      <div style={{ display: 'grid', gap: 10, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
                          <div>{selectedWs.address}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Phone size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          <div>{selectedWs.phone}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Clock size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          <div>Hours: {selectedWs.hours || '07:30 – 21:00'}</div>
                        </div>
                      </div>

                      {/* Services Menu */}
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Service Price List</h4>
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-md)', padding: 10, marginBottom: 20 }}>
                        {(!selectedWs.services || selectedWs.services.length === 0) ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No pricing information available yet.</div>
                        ) : (
                          <div style={{ display: 'grid', gap: 6 }}>
                            {selectedWs.services.map((s, idx) => {
                              const sName = typeof s === 'object' ? s.service_name : s;
                              const sPrice = typeof s === 'object' && s.base_price ? `${s.base_price.toLocaleString('en-US')} VND` : 'Contact';
                              return (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', borderBottom: idx < selectedWs.services.length - 1 ? '1px dashed var(--border-dim)' : 'none', paddingBottom: idx < selectedWs.services.length - 1 ? 4 : 0 }}>
                                  <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Wrench size={10} color="var(--cyan-400)" />
                                    <span>{sName}</span>
                                  </div>
                                  <div style={{ fontWeight: 700, color: 'var(--cyan-400)' }}>{sPrice}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Reviews Section */}
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer Reviews</h4>
                      
                      {/* Write review */}
                      <div style={{ padding: 12, borderRadius: 'var(--r-md)', background: 'rgba(6,182,212,0.04)', border: '1px solid var(--border-dim)', marginBottom: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Write your review</div>
                        <StarRating value={wsNewRating} onChange={setWsNewRating} size={16} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <input 
                            className="input" 
                            style={{ flex: 1, height: 28, fontSize: '0.75rem' }} 
                            placeholder="Write a comment..." 
                            value={wsNewText} 
                            onChange={e => setWsNewText(e.target.value)} 
                          />
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ height: 28, fontSize: '0.72rem', padding: '0 10px' }}
                            onClick={submitWsReview} 
                            disabled={!wsNewRating || !wsNewText.trim()}
                          >
                            Submit
                          </button>
                        </div>
                      </div>

                      {/* Reviews List */}
                      {loadingReviews ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                          <Loader size={16} className="animate-spin" color="var(--cyan-400)" />
                        </div>
                      ) : reviewsList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '0.76rem' }}>No reviews yet.</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {reviewsList.map(rev => {
                            const userAvatar = rev.user?.avatar_url;
                            const userName = rev.user?.full_name || rev.user || 'Guest';
                            const revRating = rev.rating || rev.stars || 0;
                            const revContent = rev.content || rev.text || '';
                            const revTime = rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-US') : (rev.time || '');
                            
                            return (
                              <div key={rev._id || rev.id} style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: 'rgba(18,29,40,0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {userAvatar ? (
                                      <img src={userAvatar} alt={userName} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
                                        {userName.charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-primary)' }}>{userName}</div>
                                      <StarRating value={revRating} readonly size={9} />
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{revTime}</span>
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{revContent}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    onClick={() => setIsLocalDropdownExpanded(!isLocalDropdownExpanded)}
                    style={{ padding: '16px', borderBottom: isLocalDropdownExpanded ? '1px solid var(--border-dim)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}
                  >
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Nearby Workshops</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(workshops.length > 0 ? workshops : workshopsData).length} results</div>
                      <ChevronDown size={18} color="var(--text-muted)" style={{ transform: isLocalDropdownExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>
                  
                  {isLocalDropdownExpanded && (
                  <div className="sidebar-list">
                    {(workshops.length > 0 ? workshops : workshopsData).map(ws => (
                      <div 
                        key={ws.id} 
                        onClick={() => handleWsMarkerClick(ws)} 
                        style={{ padding: '16px', borderBottom: '1px solid var(--border-dim)', cursor: 'pointer', display: 'flex', gap: 12, transition: 'background 0.2s', background: selectedWs?.id === ws.id ? 'rgba(6, 182, 214, 0.05)' : 'transparent' }}
                        onMouseEnter={e => { if (selectedWs?.id !== ws.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={e => { if (selectedWs?.id !== ws.id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontSize: '1rem' }}>{ws.name}</div>
                          
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{ws.rating}</span>
                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                            <span>({ws.reviewCount || ws.reviews || 0})</span>
                          </div>
                          
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={ws.address}>
                            <MapPin size={10} style={{ display: 'inline', marginRight: 4, position: 'relative', top: 1 }} />
                            {ws.address}
                          </div>
                          
                          <div style={{ fontSize: '0.85rem', color: ws.status === 'open' ? 'var(--green-400)' : 'var(--red-400)', marginBottom: 6 }}>
                            {ws.status === 'open' ? 'Open now' : 'Closed'}
                            <span style={{ color: 'var(--text-muted)' }}> · {ws.hours ? `Closes ${ws.hours.split('–')[1] || '21:00'}` : ''}</span>
                          </div>
                        </div>
                        
                        <div style={{ width: 80, height: 80, borderRadius: 8, background: '#1e293b', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                          <img src={ws.cover_photo || `https://picsum.photos/seed/${ws.id}/160/160`} alt={ws.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* SIDEBAR: SENSORS LIST */}
          {activeFilter === 'sensors' && searchQuery.trim() === '' && (
            <div className={`sidebar-container map-sidebar-panel sheet-${mobileSheetState}`} style={{ overflow: 'hidden' }}>
              {renderDragHandle()}
               {latestSensor ? (
                // Google Maps style Detail Panel inside the sidebar!
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  {/* Top Header Row with Back Button */}
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                    <button 
                      onClick={() => setSelectedSensor(null)} 
                      style={{ background: 'none', border: 'none', color: 'var(--cyan-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, padding: 0 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                      Back to list
                    </button>
                    <button 
                      onClick={() => setSelectedSensor(null)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Detail Panel Scrollable Body */}
                  <div className="sidebar-list" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Device Details content */}
                    <div>
                      {latestSensor.image_url ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <img 
                            src={latestSensor.image_url} 
                            alt={latestSensor.name} 
                            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-dim)' }} 
                          />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '140px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-dim)', color: 'var(--text-muted)' }}>
                          No image available
                        </div>
                      )}
                      <h3 style={{ margin: '16px 0 4px', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>{latestSensor.name}</h3>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>{latestSensor.location || 'No location provided'}</div>
                      </div>
                      <div style={{ color: 'var(--cyan-400)', fontSize: '0.8rem', marginTop: 4, fontFamily: 'monospace' }}>
                        ID: {latestSensor.device_code || latestSensor.id}
                      </div>
                    </div>

                    {/* Status Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={12}/> Water Level</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--cyan-400)' }}>{latestSensor.waterLevel || 0} <span style={{ fontSize: '0.8rem' }}>cm</span></div>
                      </div>
                      
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Battery size={12}/> Battery</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-400)' }}>{latestSensor.battery_percent || 0} <span style={{ fontSize: '0.8rem' }}>%</span></div>
                      </div>
                    </div>

                    {/* Thresholds & Config */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-dim)', padding: '16px' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <Cpu size={16} color="var(--text-muted)" />
                        Configuration
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                          <span style={{ color: latestSensor.status === 'active' || latestSensor.status === 'Online' ? 'var(--green-400)' : 'var(--red-400)', fontWeight: 600 }}>
                            {latestSensor.status === 'active' || latestSensor.status === 'Online' ? 'Online' : 'Offline'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Calibration (Empty)</span>
                          <span style={{ color: 'var(--text-primary)' }}>{latestSensor.calib_empty_cm || 100} cm</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Water Level percentage</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {((latestSensor.waterLevel / (latestSensor.calib_empty_cm || 100)) * 100).toFixed(1)} %
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Sleep Interval</span>
                          <span style={{ color: 'var(--text-primary)' }}>{latestSensor.sleep_interval_minutes || 1} min</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer info */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                      <Clock size={12} />
                      Last reading: {latestSensor.lastReading || 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    onClick={() => setIsLocalDropdownExpanded(!isLocalDropdownExpanded)}
                    style={{ padding: '16px', borderBottom: isLocalDropdownExpanded ? '1px solid var(--border-dim)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}
                  >
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>IoT Water Sensors</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filteredDevices.length} results</div>
                      <ChevronDown size={18} color="var(--text-muted)" style={{ transform: isLocalDropdownExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>
                  
                  {isLocalDropdownExpanded && (
                  <div className="sidebar-list">
                    {filteredDevices.map(device => {
                      const badge = getWaterLevelBadge(device.waterLevel, device.status, systemConfig, device.calib_empty_cm);
                      return (
                      <div 
                        key={device.id} 
                        onClick={() => { setSelectedSensor(device); setSelectedWs(null); setMobileSheetState('half'); }} 
                        style={{ padding: '16px', borderBottom: '1px solid var(--border-dim)', cursor: 'pointer', display: 'flex', gap: 12, transition: 'background 0.2s', background: selectedSensor?.id === device.id ? 'rgba(6, 182, 214, 0.05)' : 'transparent' }}
                        onMouseEnter={e => { if (selectedSensor?.id !== device.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={e => { if (selectedSensor?.id !== device.id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontSize: '1rem' }}>{device.name}</div>
                          
                          <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
                            <span style={{ color: badge.mapColor, fontWeight: 600 }}>{badge.label}</span>
                          </div>
                          
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={device.location}>
                            <MapPin size={10} style={{ display: 'inline', marginRight: 4, position: 'relative', top: 1 }} />
                            {device.location || 'No address provided'}
                          </div>
                        </div>
                        
                        {device.image_url && (
                          <div style={{ width: 80, height: 80, borderRadius: 8, background: '#1e293b', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                            <img src={device.image_url} alt={device.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* SIDEBAR: HAZARDS LIST */}
          {activeFilter === 'hazards' && searchQuery.trim() === '' && (
            <div className={`sidebar-container map-sidebar-panel sheet-${mobileSheetState}`} style={{ overflow: 'hidden' }}>
              {renderDragHandle()}
              {selectedHazard ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  {/* Top Header Row with Back Button */}
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                    <button 
                      onClick={() => setSelectedHazard(null)} 
                      style={{ background: 'none', border: 'none', color: 'var(--cyan-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, padding: 0 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                      Back to list
                    </button>
                    <button 
                      onClick={() => setSelectedHazard(null)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Detail Panel Scrollable Body */}
                  <div className="sidebar-list" style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Horizontal Image Scroll Container */}
                    <div style={{ width: '100%', background: '#1e293b', flexShrink: 0, padding: '12px 16px', overflowX: 'auto' }}>
                      {selectedHazard.images && selectedHazard.images.length > 0 ? (
                        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                          <div className="hide-scrollbar" style={{ display: 'flex', gap: 12 }}>
                            {selectedHazard.images.map((img, idx) => {
                              const imgSrc = typeof img === 'string' ? img : (img?.url || '');
                              if (!imgSrc) return null;
                              return (
                              <img 
                                key={idx}
                                src={imgSrc}
                                alt={`Hazard ${idx}`} 
                                style={{ width: 220, height: 160, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--border-subtle)' }} 
                              />
                            )})}
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          No image available
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '0 16px 16px' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>{selectedHazard.title || 'Hazard Report'}</h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>{selectedHazard.report_type || 'Unknown'}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {selectedHazard.created_at ? new Date(selectedHazard.created_at).toLocaleString('vi-VN') : 'Unknown Time'}
                        </span>
                      </div>

                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 16 }}>
                        {selectedHazard.description || 'No description provided.'}
                      </div>

                      {/* Vote Count Stats */}
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-dim)' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-400)' }}>
                            {selectedHazard.vote_still_exist || 0}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Still exists</span>
                        </div>
                        <div style={{ width: 1, background: 'var(--border-dim)' }}></div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--red-400)' }}>
                            {selectedHazard.vote_no_more || 0}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Not anymore</span>
                        </div>
                        <div style={{ width: 1, background: 'var(--border-dim)' }}></div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--orange-400)' }}>
                            {selectedHazard.vote_wrong_report || 0}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wrong report</span>
                        </div>
                      </div>

                      {/* Vote Buttons Action */}
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Verification Vote</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                        <button
                          onClick={() => voteHazard(selectedHazard._id, 'confirm')}
                          style={{
                            padding: '10px', borderRadius: 8, border: hazardVotes[selectedHazard._id] === 'confirm' ? '1px solid var(--green-400)' : '1px solid var(--border-dim)',
                            background: hazardVotes[selectedHazard._id] === 'confirm' ? 'rgba(34,197,94,0.1)' : 'var(--bg-elevated)',
                            color: hazardVotes[selectedHazard._id] === 'confirm' ? 'var(--green-400)' : 'var(--text-secondary)',
                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s'
                          }}
                        >
                          <ThumbsUp size={14} /> Still exists
                        </button>
                        <button
                          onClick={() => voteHazard(selectedHazard._id, 'deny')}
                          style={{
                            padding: '10px', borderRadius: 8, border: hazardVotes[selectedHazard._id] === 'deny' ? '1px solid var(--red-400)' : '1px solid var(--border-dim)',
                            background: hazardVotes[selectedHazard._id] === 'deny' ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)',
                            color: hazardVotes[selectedHazard._id] === 'deny' ? 'var(--red-400)' : 'var(--text-secondary)',
                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s'
                          }}
                        >
                          <CheckCircle size={14} /> Not anymore
                        </button>
                        <button
                          onClick={() => voteHazard(selectedHazard._id, 'false')}
                          style={{
                            padding: '10px', borderRadius: 8, border: hazardVotes[selectedHazard._id] === 'false' ? '1px solid var(--orange-400)' : '1px solid var(--border-dim)',
                            background: hazardVotes[selectedHazard._id] === 'false' ? 'rgba(249,115,22,0.1)' : 'var(--bg-elevated)',
                            color: hazardVotes[selectedHazard._id] === 'false' ? 'var(--orange-400)' : 'var(--text-secondary)',
                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s'
                          }}
                        >
                          <ThumbsDown size={14} /> Wrong report
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    onClick={() => setIsLocalDropdownExpanded(!isLocalDropdownExpanded)}
                    style={{ padding: '16px', borderBottom: isLocalDropdownExpanded ? '1px solid var(--border-dim)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}
                  >
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Hazard Points</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{hazards.length} results</div>
                      <ChevronDown size={18} color="var(--text-muted)" style={{ transform: isLocalDropdownExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>
                  
                  {isLocalDropdownExpanded && (
                  <div className="sidebar-list">
                    {hazards.map(hz => {
                      const getImgUrl = (img) => typeof img === 'string' ? img : (img?.url || '');
                      const firstImgSrc = hz.images && hz.images.length > 0 ? getImgUrl(hz.images[0]) : null;
                      const firstImg = firstImgSrc ? firstImgSrc : null;
                      return (
                      <div 
                        key={hz._id} 
                        onClick={() => { setSelectedHazard(hz); setSelectedWs(null); setSelectedSensor(null); setMobileSheetState('half'); }} 
                        style={{ padding: '16px', borderBottom: '1px solid var(--border-dim)', cursor: 'pointer', display: 'flex', gap: 12, transition: 'background 0.2s', background: selectedHazard?._id === hz._id ? 'rgba(6, 182, 214, 0.05)' : 'transparent' }}
                        onMouseEnter={e => { if (selectedHazard?._id !== hz._id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={e => { if (selectedHazard?._id !== hz._id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontSize: '1rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {hz.title || 'Hazard Report'}
                          </div>
                          
                          <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
                            <span className="badge badge-orange" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{hz.report_type || 'Unknown'}</span>
                          </div>
                          
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                            {hz.created_at ? new Date(hz.created_at).toLocaleString('vi-VN') : ''}
                          </div>
                        </div>
                        
                        {firstImg && (
                          <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, background: '#1e293b', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                            <img src={firstImg} alt="Hazard" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                            {hz.images.length > 1 && (
                              <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                                +{hz.images.length - 1}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Search Result Left Panel */}
          {searchedLocation && (
            <div className={`map-sidebar-panel search-result-panel sheet-${mobileSheetState}`} style={{ marginTop: 8, padding: '20px 24px' }}>
              {renderDragHandle()}
               <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                 {searchedLocation.name || `${searchedLocation.lat}° N, ${searchedLocation.lng}° E`}
               </h2>
               <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--cyan-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                 <MapPin size={16} /> {searchedLocation.lat.toFixed(6)}, {searchedLocation.lng.toFixed(6)}
               </p>
               <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                 <button style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid var(--cyan-500)', background: 'transparent', color: 'var(--cyan-400)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                   Save
                 </button>
                 <button 
                   onClick={() => {
                     setIsRoutingMode(true);
                     setRoutingEnd({
                       lat: searchedLocation.lat,
                       lng: searchedLocation.lng,
                       name: searchedLocation.name || "Searched Location"
                     });
                     getOrRequestLocation((loc) => {
                       if (loc) {
                         setRoutingStart({
                           lat: loc.lat,
                           lng: loc.lng,
                           name: "My Location"
                         });
                       } else {
                         setRoutingStart(null);
                       }
                     });
                     setSearchedLocation(null);
                   }}
                   style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'var(--blue-600)', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                 >
                   Directions
                 </button>
               </div>
            </div>
          )}
          </>
          )}
        </div>
        {/* --- END SEARCH PANEL --- */}

        {/* ── Mobile: restore-sheet tab (visible only when sheet is hidden on small screens) ── */}
        {mobileSheetState === 'hidden' && (
          <div
            className="mobile-restore-sheet-tab"
            onClick={() => setMobileSheetState('half')}
          >
            <ChevronUp size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Show Panel</span>
          </div>
        )}

        <MapContainer center={[10.03711, 105.78825]} zoom={12} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <ZoomControl position="bottomright" />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Map Updater */}
          <MapFlyToTarget target={selectedWs || selectedSensor} />
          <MapResizeController />

          {/* Fullscreen Toggle Button */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, pointerEvents: 'auto' }}>
            <button 
              onClick={handleFullscreen} 
              className="btn btn-ghost" 
              style={{ width: 44, height: 44, padding: 0, borderRadius: '50%', background: 'var(--bg-elevated)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>

          {/* Current User Location marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={L.divIcon({
                html: `
                  <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                    <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: var(--blue-500); opacity: 0.3; animation: pulse-ring 1.5s infinite;"></div>
                    <div style="width: 14px; height: 14px; border-radius: 50%; background: var(--blue-600); border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>
                  </div>
                `,
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
              zIndexOffset={2000}
            >
              <Popup>
                <div style={{ padding: '2px 4px', textAlign: 'center' }}>
                  <strong>You are here</strong><br/>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                  </span>
                </div>
              </Popup>
            </Marker>
          )}

          <MapCenterController center={mapCenter} />
          
          {/* Zone overlay circles */}
          {zones.filter(z => z.active).map(z => {
            const r = z.radius * 1000;
            const color = levelColor[z.level];
            return (
              <Circle
                key={z.id}
                center={[z.lat, z.lng]}
                radius={r}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 1.5, dashArray: "5,3" }}
              >
                <Popup>{z.name} ({z.radius}km)</Popup>
              </Circle>
            );
          })}

          {/* Sensor markers */}
          {(activeFilter === null || activeFilter === 'sensors') && filteredDevices.map(device => {
            const position = (device.lat && device.lng) 
              ? [device.lat, device.lng] 
              : (latLngMap[device.id] || [10.03711, 105.78825]);
            
            const badge = getWaterLevelBadge(device.waterLevel, device.status, systemConfig, device.calib_empty_cm);
            const isSelected = selectedSensor?.id === device.id;
            
            return (
              <SensorMarker 
                key={device.id} 
                device={device} 
                isSelected={isSelected} 
                badge={badge} 
                position={position} 
                onClick={() => { setSelectedSensor(device); setSelectedWs(null); setMobileSheetState('half'); }} 
                onClickDetail={onClickDetail}
              />
            );
          })}

          {/* Active Missions (SOS) markers */}
          {(activeFilter === null || activeFilter === 'sos') && activeMissions && activeMissions.length > 0 && activeMissions.map(mission => {
            if (!mission.lat || !mission.lng) return null; // FIX for Invalid LatLng
            return (
              <Marker key={mission.id} position={[mission.lat, mission.lng]} icon={createSosIcon(mission.id, mission.severity)}>
                <Popup>
                  <strong>{mission.id} - {mission.severity ? mission.severity.toUpperCase() : ''}</strong><br/>
                  Victim: {mission.victim || mission.user}<br/>
                  Location: {mission.location}
                </Popup>
              </Marker>
            );
          })}

          {/* Hazard Points markers */}
          {(activeFilter === null || activeFilter === 'hazards') && hazards.map(hz => {
            if (!hz.lat || !hz.lng) return null;
            const isSel = selectedHazard?._id === hz._id;
            const hzColor = '#ef4444'; // Red for hazard

            const htmlIcon = `
              <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                ${isSel ? `<div style="position: absolute; inset: -6px; border-radius: 50%; background: ${hzColor}; opacity: 0.3; animation: pulse-ring 1.2s infinite;"></div>` : ''}
                <div style="width: ${isSel ? 28 : 24}px; height: ${isSel ? 28 : 24}px; border-radius: 50%; background: ${hzColor}; border: 2px solid white; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: ${isSel ? `0 0 16px ${hzColor}` : '0 2px 8px rgba(0,0,0,0.4)'}; transition: all 0.2s;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="${isSel ? 14 : 12}" height="${isSel ? 14 : 12}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.95;"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                </div>
              </div>
            `;

            const customIcon = L.divIcon({
              html: htmlIcon,
              className: '',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            return (
              <Marker
                key={hz._id}
                position={[hz.lat, hz.lng]}
                icon={customIcon}
                eventHandlers={{ click: () => { setActiveFilter('hazards'); setSelectedHazard(hz); setSelectedWs(null); setSelectedSensor(null); setMobileSheetState('half'); } }}
                zIndexOffset={isSel ? 1000 : 500}
              />
            );
          })}

          {/* Workshop markers */}
          {(activeFilter === null || activeFilter === 'workshops') && workshops.map(ws => {
            const isWsSel = selectedWs?.id === ws.id;
            const wsColor = ws.status === 'open' ? (ws.flood ? '#f97316' : '#22c55e') : '#94a3b8';
            
            const htmlIcon = `
              <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                ${isWsSel ? `<div style="position: absolute; inset: -6px; border-radius: 50%; background: ${wsColor}; opacity: 0.3; animation: pulse-ring 1.2s infinite;"></div>` : ''}
                <div style="width: ${isWsSel ? 28 : 24}px; height: ${isWsSel ? 28 : 24}px; border-radius: 50%; background: ${wsColor}; border: 2px solid white; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: ${isWsSel ? `0 0 16px ${wsColor}` : '0 2px 8px rgba(0,0,0,0.4)'}; transition: all 0.2s;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="${isWsSel ? 16 : 14}" height="${isWsSel ? 16 : 14}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.85; margin-bottom: 2px; margin-right: 2px;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="${isWsSel ? 12 : 10}" height="${isWsSel ? 12 : 10}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; bottom: 2px; right: 2px; filter: drop-shadow(0px 0px 1px rgba(0,0,0,0.5));"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: rgba(6,10,18,0.88); border: 1px solid ${wsColor}; padding: 1px 6px; border-radius: 4px; font-size: 0.58rem; color: ${wsColor}; font-weight: 700; white-space: nowrap; pointer-events: none;">
                  ${ws.name}
                </div>
              </div>
            `;

            const customIcon = L.divIcon({
              html: htmlIcon,
              className: '',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            return (
              <Marker
                key={ws.id}
                position={[ws.lat, ws.lng]}
                icon={customIcon}
                eventHandlers={{ click: () => handleWsMarkerClick(ws) }}
                zIndexOffset={isWsSel ? 1000 : 500}
              />
            );
          })}

          {/* Searched location marker */}
          {searchedLocation && (
            <Marker
              position={[searchedLocation.lat, searchedLocation.lng]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <div style={{ padding: '4px' }}>
                  <strong style={{ fontSize: '13px', color: '#ef4444' }}>Searched Location</strong><br/>
                  <span style={{ fontSize: '11px', color: '#4b5563', display: 'block', margin: '4px 0 6px' }}>{searchedLocation.name}</span>
                  <button
                    onClick={() => setSearchedLocation(null)}
                    style={{
                      display: 'inline-block',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Clear Pin
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Map click listener when routing is active */}
          {isRoutingMode && selectPointTarget && (
            <MapClickHandler onClick={handleMapClick} />
          )}

          {/* Routing Start Marker */}
          {isRoutingMode && routingStart && (
            <Marker
              position={[routingStart.lat, routingStart.lng]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <div>
                  <strong>Start Location</strong><br />
                  {routingStart.name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Routing End Marker */}
          {isRoutingMode && routingEnd && (
            <Marker
              position={[routingEnd.lat, routingEnd.lng]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <div>
                  <strong>Destination Location</strong><br />
                  {routingEnd.name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route polylines */}
          {isRoutingMode && routeAlternatives && routeAlternatives.map((route, idx) => {
            const isSel = selectedRouteIdx === idx;
            let polyCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);
            if (isNavigatingActive && isSel && userLocation) {
              const details = getRemainingRouteDetails(userLocation, route);
              if (details && details.coordinates) {
                polyCoords = details.coordinates.map(c => [c[1], c[0]]);
              }
            }
            const color = isSel 
              ? (route.is_flooded ? '#ef4444' : '#06b6d4') 
              : '#64748b';
            const weight = isSel ? 6 : 4;
            const opacity = isSel ? 0.95 : 0.4;
            
            return (
              <Polyline
                key={idx}
                positions={polyCoords}
                pathOptions={{ color, weight, opacity }}
                eventHandlers={{
                  click: () => setSelectedRouteIdx(idx)
                }}
              >
                <Popup>
                  <div style={{ fontSize: '0.8rem', padding: '2px 4px' }}>
                    <strong>Route Option {idx + 1} {isSel ? '(Selected)' : ''}</strong><br/>
                    Distance: {(route.distance / 1000).toFixed(1)} km<br/>
                    Time: {Math.round(route.weighted_duration / 60)} mins {route.weighted_duration > route.duration && `(incl. ${Math.round((route.weighted_duration - route.duration) / 60)} mins hazard delay)`}<br/>
                    {route.is_flooded ? (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠️ Flooded</span>
                    ) : (
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>✅ Flood Safe</span>
                    )}
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* Route warnings (floods and hazards on the selected route) */}
          {isRoutingMode && routeAlternatives && routeAlternatives[selectedRouteIdx] && (
            <>
              {/* Flooded sensors on selected route */}
              {routeAlternatives[selectedRouteIdx].floods && routeAlternatives[selectedRouteIdx].floods.map((f, idx) => (
                <Marker
                  key={`route-flood-${idx}`}
                  position={[f.lat, f.lng]}
                  icon={L.divIcon({
                    html: `
                      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: #ef4444; opacity: 0.4; animation: pulse-ring 1.2s infinite;"></div>
                        <div style="width: 22px; height: 22px; border-radius: 50%; background: #ef4444; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4); z-index: 10;">
                          <span style="color: white; font-size: 11px; font-weight: 900; line-height: 1;">🌊</span>
                        </div>
                      </div>
                    `,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                  })}
                >
                  <Popup>
                    <div style={{ padding: '2px 4px', fontSize: '0.82rem' }}>
                      <strong style={{ color: '#ef4444', display: 'block', marginBottom: 4 }}>⚠️ Flooded Area on Route</strong>
                      <strong>Sensor:</strong> {f.name}<br/>
                      <strong>Location:</strong> {f.location || 'N/A'}<br/>
                      <strong>Water Status:</strong> <span style={{ color: '#ef4444', fontWeight: 700 }}>{f.warning_water_status}</span> ({f.current_water_level} cm)<br/>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distance to route: {Math.round(f.distance)}m</span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Hazards on selected route */}
              {routeAlternatives[selectedRouteIdx].hazards && routeAlternatives[selectedRouteIdx].hazards.map((h, idx) => (
                <Marker
                  key={`route-hazard-${idx}`}
                  position={[h.lat, h.lng]}
                  icon={L.divIcon({
                    html: `
                      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: #f97316; opacity: 0.4; animation: pulse-ring 1.2s infinite;"></div>
                        <div style="width: 22px; height: 22px; border-radius: 50%; background: #f97316; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4); z-index: 10;">
                          <span style="color: white; font-size: 11px; font-weight: 900; line-height: 1;">⚠️</span>
                        </div>
                      </div>
                    `,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                  })}
                >
                  <Popup>
                    <div style={{ padding: '2px 4px', fontSize: '0.82rem' }}>
                      <strong style={{ color: '#f97316', display: 'block', marginBottom: 4 }}>⚠️ Hazard Point on Route</strong>
                      <strong>Title:</strong> {h.title}<br/>
                      <strong>Type:</strong> {h.report_type}<br/>
                      <strong>Description:</strong> {h.description || 'No description provided.'}<br/>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distance to route: {Math.round(h.distance)}m</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>
      </div>
    </>
  );

  const wrapperStyle = isFullscreen 
    ? { height: '100vh', width: '100vw', background: '#080d16', display: 'flex', flexDirection: 'column' }
    : { display: 'flex', flexDirection: 'column', height: height, overflow: 'hidden', position: 'relative' };

  if (hideWrapper && !isFullscreen) return (
    <div ref={wrapperRef} style={{ height, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {innerContent}
      {children}
    </div>
  );

  return (
    <div ref={wrapperRef} className={isFullscreen ? "" : "card"} style={{ ...wrapperStyle, position: 'relative' }}>
      {innerContent}
      {children}
    </div>
  );
}
