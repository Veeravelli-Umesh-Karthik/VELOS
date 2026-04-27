import React, { useContext, useState, useEffect } from 'react'
import { AppDataContext } from '../../context/AppDataContext'
import { Navigation, Info, AlertTriangle, MapPin, Activity, Thermometer, Wind, ShieldAlert, CheckCircle, Clock, Globe } from 'lucide-react'
import { GoogleMap, useJsApiLoader, Polyline, TrafficLayer, Autocomplete, InfoWindow, Circle, Marker } from '@react-google-maps/api'

// Simple elegant dark mode map style
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212124" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212124" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#18181f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2f" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#37373e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c41" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e54" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
]

const containerStyle = {
  width: '100%',
  height: '100%'
}

// Default center to Orlando for demo view
const defaultCenter = {
  lat: 28.5383,
  lng: -81.3792
}

const libraries = ['places', 'marker', 'routes', 'geometry'];

const formatDuration = (ms) => {
   const totalMins = Math.floor(ms / 60000);
   const hrs = Math.floor(totalMins / 60);
   const mins = totalMins % 60;
   if(hrs > 0) return `${hrs}h ${mins}m`;
   return `${mins} mins`;
};

const AdvancedShipmentMarker = ({ shipment, map, onClick, onMouseOver, onMouseOut, getWeatherHex }) => {
  const markerRef = React.useRef(null);

  useEffect(() => {
    if (!window.google?.maps?.marker?.AdvancedMarkerElement || !map) return;

    if (!markerRef.current) {
      const pin = document.createElement("div");
      pin.style.width = "20px";
      pin.style.height = "20px";
      pin.style.borderRadius = "50%";
      pin.style.backgroundColor = getWeatherHex(shipment.status, shipment.weather.severityLevel);
      pin.style.border = "2px solid #ffffff";
      pin.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      pin.style.cursor = "pointer";

      markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: shipment.coords,
        content: pin,
        title: shipment.id,
      });

      markerRef.current.addEventListener("gmp-click", onClick);
      pin.addEventListener("mouseover", onMouseOver);
      pin.addEventListener("mouseout", onMouseOut);
    } else {
      markerRef.current.position = shipment.coords;
      markerRef.current.content.style.backgroundColor = getWeatherHex(shipment.status, shipment.weather.severityLevel);
    }
  }, [shipment.coords, shipment.status, shipment.weather.severityLevel, map, onClick, onMouseOver, onMouseOut, getWeatherHex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
      }
    };
  }, []);

  return null;
};

const MapView = () => {
  const { shipments, sendOverride, updateShipmentRoute, language, setLanguage, t } = useContext(AppDataContext)
  const [mapTheme, setMapTheme] = useState('dark')
  const [selectedShipmentId, setSelectedShipmentId] = useState(null)
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const languages = ['EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'ZH', 'JA', 'HI', 'AR']
  
  // Derive selected shipment directly from context so it's never stale
  const selectedShipment = shipments.find(s => s.id === selectedShipmentId)

  const [directions, setDirections] = useState(null)
  
  // Dynamic Route Form State
  const [isEditingRoute, setIsEditingRoute] = useState(false)
  const [editOrigin, setEditOrigin] = useState('')
  const [editDest, setEditDest] = useState('')
  const [routeError, setRouteError] = useState(null)

  // Hover InfoWindow state (tracks shipment and hover coordinates)
  const [hoverInfo, setHoverInfo] = useState(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Refs for Google Places Autocomplete
  const originAutocompleteRef = React.useRef(null)
  const destAutocompleteRef = React.useRef(null)
  
  // Map Reference for bounds fitting
  const mapRef = React.useRef(null)

  const handleSelectShipment = (s) => {
    setSelectedShipmentId(s.id)
    setIsEditingRoute(false)
    setRouteError(null)
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_KEY_HERE",
    libraries
  })

  useEffect(() => {
    if (!selectedShipment || !window.google) {
      setDirections(null)
      return
    }
    
    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin: selectedShipment.origin,
        destination: selectedShipment.destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: 'bestguess'
        }
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result)
          setRouteError(null)

          // Auto-adjust view to fit the route perfectly
          if (mapRef.current && result.routes && result.routes[0].bounds) {
             mapRef.current.fitBounds(result.routes[0].bounds)
          }
        } else {
          setDirections(null)
          setRouteError(status)
          console.error(`Error fetching directions: ${status}`)
        }
      }
    )
  }, [selectedShipment?.origin, selectedShipment?.destination, isLoaded])

  // Weather Radar mappings
  const getWeatherHex = (status, severity) => {
    if (status === 'EMERGENCY') return '#ef4444'; // Flashing Red
    if (severity === 3) return '#dc2626'; // Deep Red (Severe)
    if (severity === 2) return '#f97316'; // Orange (Warning)
    if (severity === 1) return '#eab308'; // Yellow (Caution)
    return '#10b981'; // Green (Safe)
  }

  // standard CSS variable function for the HTML sidebar
  const getWeatherColor = (status, severity) => {
    if (status === 'EMERGENCY') return 'var(--status-red)'
    if (severity === 3) return 'var(--status-red)' // red
    if (severity >= 1) return 'var(--status-yellow)' // warning/caution
    return 'var(--status-green)' // safe
  }

  // Memoize map options to prevent aggressive re-renders when switching themes
  const mapOptions = React.useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: false,
    mapId: 'e614178076e9d4c36895c7f1',
    styles: mapTheme === 'dark' ? darkMapStyle : []
  }), [mapTheme])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#000' }}>
      
      {/* Absolute Map Base */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={selectedShipment ? selectedShipment.coords : defaultCenter}
            zoom={selectedShipment ? 8 : 5}
            onLoad={(map) => { mapRef.current = map; setIsMapLoaded(true); }}
            options={mapOptions}
          >
            <TrafficLayer />

            {directions && selectedShipment && (
              <Polyline
                path={directions.routes[0].overview_path}
                onMouseOver={(e) => {
                  if (e.latLng) {
                    setHoverInfo({ shipment: selectedShipment, coords: e.latLng });
                  }
                }}
                onMouseOut={() => setHoverInfo(null)}
                options={{
                  strokeColor: '#3b82f6',
                  strokeWeight: 7,
                  strokeOpacity: 0.6,
                  zIndex: 10
                }}
              />
            )}

            {shipments.map(s => (
              <React.Fragment key={s.id}>
                {/* Weather Radar Zone Overlay */}
                <Circle 
                  center={s.coords}
                  radius={40000}
                  options={{
                    fillColor: getWeatherHex(s.status, s.weather.severityLevel),
                    fillOpacity: s.weather.severityLevel === 3 ? 0.35 : 0.15,
                    strokeColor: getWeatherHex(s.status, s.weather.severityLevel),
                    strokeOpacity: 0.6,
                    strokeWeight: s.weather.severityLevel === 3 ? 4 : 2,
                    zIndex: 1
                  }}
                />

                {isMapLoaded && (
                  <AdvancedShipmentMarker 
                    shipment={s}
                    map={mapRef.current}
                    onClick={() => handleSelectShipment(s)}
                    onMouseOver={() => setHoverInfo({ shipment: s, coords: s.coords })}
                    onMouseOut={() => setHoverInfo(null)}
                    getWeatherHex={getWeatherHex}
                  />
                )}
              </React.Fragment>
            ))}

            {hoverInfo && (
              <InfoWindow
                position={hoverInfo.coords}
                options={{ pixelOffset: new window.google.maps.Size(0, -20) }}
                onCloseClick={() => setHoverInfo(null)}
              >
                <div style={{ color: '#000', padding: '8px', minWidth: '180px' }}>
                   <strong style={{ display: 'block', fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
                     {hoverInfo.shipment.id}
                   </strong>
                   <span style={{ fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                     <strong>Driver:</strong> {hoverInfo.shipment.driverName}
                   </span>
                   <span style={{ fontSize: '0.9rem', display: 'block' }}>
                     <strong>Travel Time:</strong> {directions && selectedShipmentId === hoverInfo.shipment.id ? directions.routes[0].legs[0].duration.text : hoverInfo.shipment.etaOriginal}
                   </span>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-core text-muted">
            <p>Initializing V.E.L.O.S. Intelligence Array...</p>
          </div>
        )}
      </div>

      {/* Top Floating Bar */}
      <div className="glass-panel flex-row items-center justify-between" style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '1200px', zIndex: 10, padding: '12px 24px', borderRadius: '16px', backgroundColor: 'rgba(24, 24, 27, 0.75)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
         <div className="flex-row items-center gap-3">
            <Activity color="var(--accent-primary)" size={28} />
            <strong style={{ fontSize: '1.3rem', letterSpacing: '2px', fontWeight: 700, margin: 0, color: '#fff' }}>V.E.L.O.S.</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase' }}>| {t('COMMAND_CENTER')}</span>
         </div>
         <div className="flex-row items-center gap-4">
            <button 
               onClick={() => setMapTheme(mapTheme === 'dark' ? 'light' : 'dark')}
               style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '6px 12px', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
               {mapTheme === 'dark' ? t('TOGGLE_LIGHT_MAP') : t('TOGGLE_DARK_MAP')}
            </button>
            <div className="flex-row items-center gap-2 px-3 py-1" style={{ background: 'rgba(16,185,129,0.1)', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.3)' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-green)', boxShadow: '0 0 10px var(--status-green)' }} className="animate-pulse-red" />
               <span style={{ fontSize: '0.8rem', color: 'var(--status-green)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{t('SYSTEM_LIVE')}</span>
            </div>
            
            {/* Language Dropdown */}
             <div style={{ position: 'relative' }}>
               <div 
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="glass-panel flex-row items-center gap-2" 
                  style={{ padding: '4px 12px', borderRadius: '50px', background: 'rgba(24,24,27,0.6)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(24,24,27,0.6)'}
               >
                  <Globe size={14} color="#a1a1aa" />
                  <span style={{ fontSize: '0.8rem', color: '#fff', width: '20px', textAlign: 'center' }}>{language}</span>
               </div>
               
               {showLangDropdown && (
                 <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', padding: '8px', borderRadius: '12px', background: 'rgba(24,24,27,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 50, minWidth: '80px' }}>
                   {languages.map(lang => (
                     <button
                       key={lang}
                       onClick={() => { setLanguage(lang); setShowLangDropdown(false); }}
                       style={{ background: language === lang ? 'rgba(59,130,246,0.2)' : 'transparent', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}
                       onMouseOver={(e) => { if(language !== lang) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                       onMouseOut={(e) => { if(language !== lang) e.currentTarget.style.background = 'transparent' }}
                     >
                       {lang}
                     </button>
                   ))}
                 </div>
               )}
             </div>
         </div>
      </div>

      {/* Left Floating Panel: Fleet Overview */}
      <div className="glass-panel flex-col" style={{ position: 'absolute', top: '100px', left: '24px', bottom: '100px', width: '380px', zIndex: 10, borderRadius: '16px', backgroundColor: 'rgba(9, 9, 11, 0.8)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
         <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('FLEET_OVERVIEW')}</h3>
         </div>
         <div style={{ overflowY: 'auto', flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {shipments.map(s => {
               const isSelected = selectedShipment?.id === s.id;
               const hexColor = getWeatherHex(s.status, s.weather.severityLevel);
               
               return (
                  <div 
                     key={s.id} 
                     className="flex-col"
                     style={{ 
                        padding: '16px', 
                        borderRadius: '12px',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? hexColor : 'rgba(255,255,255,0.05)'}`,
                        boxShadow: isSelected ? `0 0 20px ${hexColor}33` : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                     }}
                     onClick={() => handleSelectShipment(s)}
                  >
                     <div className="flex-row justify-between items-center" style={{ marginBottom: '8px' }}>
                        <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{s.id}</strong>
                        <div className="flex-row items-center gap-1" style={{ padding: '4px 8px', borderRadius: '4px', background: `${hexColor}22`, border: `1px solid ${hexColor}44` }}>
                           <span style={{ fontSize: '0.7rem', color: hexColor, fontWeight: 700, textTransform: 'uppercase' }}>{s.status}</span>
                        </div>
                     </div>
                     <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>{s.driverName}</div>
                     <div className="flex-row items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <MapPin size={14} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.origin} → {s.destination}</span>
                     </div>
                  </div>
               )
            })}
         </div>
      </div>

      {/* Right Floating Panel: Insights (Only visible when shipment selected) */}
      {selectedShipment && (
        <div className="glass-panel flex-col" style={{ position: 'absolute', top: '100px', right: '24px', width: '400px', zIndex: 10, borderRadius: '16px', backgroundColor: 'rgba(9, 9, 11, 0.85)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
           
           <div className="p-4 flex-row justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(59,130,246,0.1), transparent)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{t('ROUTE_INTEL')}</h3>
              <Activity size={20} color="var(--accent-primary)" />
           </div>

           <div className="p-5 flex-col gap-6">
              
              {/* ETA & Distance Block */}
              <div className="flex-row gap-4">
                 <div className="flex-col" style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>{t('ETA')}</span>
                    <strong style={{ fontSize: '1.4rem', color: '#fff' }}>
                       {directions ? directions.routes[0].legs[0].duration.text : selectedShipment.etaOriginal}
                    </strong>
                 </div>
                 <div className="flex-col" style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>{t('DIST')}</span>
                    <strong style={{ fontSize: '1.4rem', color: '#fff' }}>
                       {directions ? directions.routes[0].legs[0].distance.text : t('CALCULATING')}
                    </strong>
                 </div>
              </div>

              {/* Environmental Stress Block */}
              <div className="flex-col gap-3">
                 <strong style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('ENVIRO_STRESS')}</strong>
                 
                 <div className="flex-row items-center gap-3" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ padding: '10px', background: 'rgba(59,130,246,0.1)', borderRadius: '50%' }}>
                       <Thermometer size={20} color="var(--accent-primary)" />
                    </div>
                    <div className="flex-col" style={{ flex: 1 }}>
                       <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>{selectedShipment.weather.condition}</span>
                       <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('SEVERITY', { level: selectedShipment.weather.severityLevel })}</span>
                    </div>
                 </div>

                 {selectedShipment.weather.severityLevel >= 2 && (
                    <div className="flex-row items-center gap-3" style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.3)' }}>
                       <Wind size={20} color="var(--status-yellow)" />
                       <span style={{ color: 'var(--status-yellow)', fontSize: '0.9rem', fontWeight: 500 }}>{t('HIGH_WINDS')}</span>
                    </div>
                 )}
                 {selectedShipment.status === 'EMERGENCY' && (
                    <div className="flex-row items-center gap-3 animate-pulse-red" style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.5)' }}>
                       <ShieldAlert size={20} color="var(--status-red)" />
                       <strong style={{ color: 'var(--status-red)', fontSize: '0.9rem' }}>{t('EMERGENCY_ACTIVE')}</strong>
                    </div>
                 )}
              </div>

              {/* Route Editing Block */}
              <div className="flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                 <strong style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('ROUTE_MGMT')}</strong>
                 {isEditingRoute ? (
                    <div className="flex-col gap-3">
                       {isLoaded && (
                         <>
                           <Autocomplete
                             onLoad={(autocomplete) => originAutocompleteRef.current = autocomplete}
                             onPlaceChanged={() => {
                               if (originAutocompleteRef.current) {
                                  const place = originAutocompleteRef.current.getPlace();
                                  if(place?.formatted_address) setEditOrigin(place.formatted_address);
                               }
                             }}
                           >
                             <input 
                               style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                               value={editOrigin} 
                               onChange={e => setEditOrigin(e.target.value)} 
                               onClick={e => e.stopPropagation()}
                               placeholder={t('ORIGIN')} 
                             />
                           </Autocomplete>
                           <Autocomplete
                             onLoad={(autocomplete) => destAutocompleteRef.current = autocomplete}
                             onPlaceChanged={() => {
                               if (destAutocompleteRef.current) {
                                  const place = destAutocompleteRef.current.getPlace();
                                  if(place?.formatted_address) setEditDest(place.formatted_address);
                               }
                             }}
                           >
                             <input 
                               style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                               value={editDest} 
                               onChange={e => setEditDest(e.target.value)} 
                               onClick={e => e.stopPropagation()}
                               placeholder={t('DESTINATION')} 
                             />
                           </Autocomplete>
                         </>
                       )}
                       <div className="flex-row gap-2" style={{marginTop: '8px'}}>
                         <button 
                           className="btn" 
                           style={{ flex: 1, padding: '10px', background: 'var(--status-green)', color: '#fff', border: 'none', fontWeight: 600 }}
                           onClick={(e) => {
                             e.stopPropagation();
                             updateShipmentRoute(selectedShipment.id, editOrigin, editDest);
                             setIsEditingRoute(false);
                           }}
                         >{t('SAVE_ROUTE')}</button>
                         <button 
                           className="btn" 
                           style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}
                           onClick={(e) => { e.stopPropagation(); setIsEditingRoute(false); }}
                         >{t('CANCEL')}</button>
                       </div>
                    </div>
                  ) : (
                    <button 
                      className="btn" 
                      style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '100%' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditOrigin(selectedShipment.origin);
                        setEditDest(selectedShipment.destination);
                        setIsEditingRoute(true);
                      }}
                    >{t('EDIT_ROUTE')}</button>
                  )}
                  {routeError && <div style={{ fontSize: '0.8rem', color: 'var(--status-red)', marginTop: '4px' }}>{t('ROUTE_ERROR')} {routeError}</div>}
              </div>

           </div>
        </div>
      )}

      {/* Bottom Minimal Action Bar */}
      {selectedShipment && (
         <div className="glass-panel flex-row items-center gap-4" style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, padding: '12px 24px', borderRadius: '50px', backgroundColor: 'rgba(24, 24, 27, 0.85)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '8px' }}>{t('ACTION_DOCK')} <strong style={{ color: '#fff' }}>{selectedShipment.id}</strong></span>
            
            <button className="btn" style={{ borderRadius: '50px', padding: '10px 20px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(59,130,246,0.3)', fontWeight: 600 }} onClick={(e) => {
               e.stopPropagation();
               const reason = prompt(t('OVERRIDE_PROMPT'));
               if (reason) sendOverride(selectedShipment.id, reason);
            }}>
               {t('SUGGEST_OVERRIDE')}
            </button>

            <button className="btn btn-danger" style={{ borderRadius: '50px', padding: '10px 20px', fontWeight: 600 }} onClick={(e) => {
               e.stopPropagation();
               triggerEmergency(selectedShipment.id);
            }}>
               {t('TRIGGER_EMERGENCY')}
            </button>
         </div>
      )}

    </div>
  )
}

export default MapView
