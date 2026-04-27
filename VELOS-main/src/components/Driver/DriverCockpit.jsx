import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { AppDataContext } from "../../context/AppDataContext";
import {
  CloudRain,
  Navigation2,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Globe,
} from "lucide-react";
import {
  GoogleMap,
  useJsApiLoader,
  TrafficLayer,
  Polyline,
  Marker,
  Circle,
} from "@react-google-maps/api";

// Simple elegant dark mode map style
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212124" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212124" }] },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2f" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c41" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
];

const containerStyle = {
  width: "100%",
  height: "100%",
};

const libraries = ["places", "marker", "routes", "geometry"];

const formatDuration = (ms) => {
  const totalMins = Math.floor(ms / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} mins`;
};

const AdvancedTruckMarker = ({ position, map }) => {
  const markerRef = React.useRef(null);

  useEffect(() => {
    if (!window.google?.maps?.marker?.AdvancedMarkerElement || !map) return;

    if (!markerRef.current) {
      const pin = document.createElement("div");
      pin.style.width = "20px";
      pin.style.height = "20px";
      pin.style.borderRadius = "50%";
      pin.style.backgroundColor = "#3b82f6";
      pin.style.border = "3px solid #ffffff";
      pin.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

      markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: pin,
        title: "Truck",
      });
    } else {
      markerRef.current.position = position;
    }
  }, [position, map]);

  useEffect(() => {
    return () => {
      if (markerRef.current) markerRef.current.map = null;
    };
  }, []);

  return null;
};

const DriverCockpit = () => {
  const { id } = useParams();
  const {
    shipments,
    triggerEmergency,
    resolveOverride,
    updateShipmentLocation,
    updateShipmentStatus,
    language,
    setLanguage,
    t,
  } = useContext(AppDataContext);
  const shipment = shipments.find((s) => s.id === (id || "SHP-1001"));

  const [shiftStarted, setShiftStarted] = useState(false);
  const [lastAnnouncedOverride, setLastAnnouncedOverride] = useState(null);
  const [directions, setDirections] = useState(null);
  const [routePath, setRoutePath] = useState(null);

  // Local state to teleport the mock truck when route changes globally
  const [truckPos, setTruckPos] = useState(shipment.coords);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [pathIndex, setPathIndex] = useState(0);
  const [isDriving, setIsDriving] = useState(false);
  const [speed, setSpeed] = useState(0);

  // Rest AI state
  const [restReminderActive, setRestReminderActive] = useState(false);
  const [suggestedPlaces, setSuggestedPlaces] = useState([]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey:
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_KEY_HERE",
    libraries,
  });

  const [mapTheme, setMapTheme] = useState("dark");
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const languages = ['EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'ZH', 'JA', 'HI', 'AR'];

  // Weather Radar mappings
  const getWeatherHex = (status, severity) => {
    if (status === "EMERGENCY") return "#ef4444"; // Flashing Red override
    if (severity === 3) return "#dc2626"; // Deep Red (Severe)
    if (severity === 2) return "#f97316"; // Orange (Warning)
    if (severity === 1) return "#eab308"; // Yellow (Caution)
    return "#10b981"; // Green (Safe)
  };

  // --- CRITICAL GOOGLE MAPS RENDERING FIX ---
  // @react-google-maps/api will rapidly detach and crash Polylines/Circles if their 'options' prop constantly receives new object literals on every simple re-render.
  // We must strictly memoize graphical options so React knows they haven't mathematically changed under the hood.

  const mapOptions = React.useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: false,
      mapId: "e614178076e9d4c36895c7f1",
      styles: mapTheme === "dark" ? darkMapStyle : [],
    }),
    [mapTheme],
  );

  const polylineOptions = React.useMemo(
    () => ({
      strokeColor: "#3b82f6", // Google Blue
      strokeWeight: 8, // Driver screen thick line
      strokeOpacity: 0.8,
      zIndex: 10,
    }),
    [],
  );

  const circleOptions = React.useMemo(
    () => ({
      fillColor: getWeatherHex(
        shipment?.status,
        shipment?.weather?.severityLevel,
      ),
      fillOpacity: shipment?.weather?.severityLevel === 3 ? 0.35 : 0.15,
      strokeColor: getWeatherHex(
        shipment?.status,
        shipment?.weather?.severityLevel,
      ),
      strokeOpacity: 0.6,
      strokeWeight: shipment?.weather?.severityLevel === 3 ? 4 : 2,
      zIndex: 1,
    }),
    [shipment?.status, shipment?.weather?.severityLevel],
  );

  // Fetch the direction layout just like the Admin Map
  useEffect(() => {
    // CRITICAL: Must wait for the actual map canvas to mount (isMapLoaded), otherwise Google Map internal constructors aren't fully resolved in React 18 strict mode!
    if (!shipment || !isMapLoaded || !window.google) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: shipment.origin,
        destination: shipment.destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: "bestguess",
        },
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);

          const path = result.routes[0].overview_path;
          setRoutePath(path);
          setPathIndex(0);

          const startLoc = result.routes[0].legs[0].start_location;
          setTruckPos({
            lat:
              typeof startLoc.lat === "function"
                ? startLoc.lat()
                : startLoc.lat,
            lng:
              typeof startLoc.lng === "function"
                ? startLoc.lng()
                : startLoc.lng,
          });

          if (mapRef.current) {
            mapRef.current.panTo(startLoc);
            mapRef.current.fitBounds(result.routes[0].bounds);
          }
        } else {
          setDirections(null);
          console.error(`Cockpit Directions API failed: ${status}`);
        }
      },
    );
  }, [shipment?.origin, shipment?.destination, isMapLoaded]);

  // --- Driving Simulator Logic ---
  useEffect(() => {
    if (isDriving && routePath && pathIndex < routePath.length - 1) {
      const timer = setTimeout(() => {
        const nextIndex = pathIndex + speed;
        const validIndex = Math.min(nextIndex, routePath.length - 1);
        setPathIndex(validIndex);

        const nextPos = routePath[validIndex];
        const nextPosObj = {
          lat: typeof nextPos.lat === "function" ? nextPos.lat() : nextPos.lat,
          lng: typeof nextPos.lng === "function" ? nextPos.lng() : nextPos.lng,
        };

        setTruckPos(nextPosObj);
        updateShipmentLocation(shipment.id, nextPosObj);

        if (mapRef.current) {
          mapRef.current.panTo(nextPosObj);
        }
      }, 500); // step every 500ms
      return () => clearTimeout(timer);
    }
  }, [
    isDriving,
    pathIndex,
    routePath,
    speed,
    shipment?.id,
    updateShipmentLocation,
  ]);

  // Cleanup Native Marker logic (reverted)

  // The actual text-to-speech logic
  useEffect(() => {
    if (!shiftStarted) return; // Browsers require interaction before speech
    if (
      shipment?.overrideActive &&
      shipment.overrideReason !== lastAnnouncedOverride
    ) {
      if ("speechSynthesis" in window) {
        const text = `Route update from admin. ${shipment.overrideReason}. Safer route available. Confirm change?`;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
        setLastAnnouncedOverride(shipment.overrideReason);
      }
    }
  }, [
    shipment?.overrideActive,
    shipment?.overrideReason,
    shiftStarted,
    lastAnnouncedOverride,
  ]);

  // Voice AI Logic for Driver Rest Stops
  const handleRestAccept = () => {
    setRestReminderActive(false);
    if (!mapRef.current) return;

    // Announce confirmation
    if ("speechSynthesis" in window) {
      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance(
          "Scanning for nearby rest stops and diners...",
        ),
      );
    }

    const service = new window.google.maps.places.PlacesService(mapRef.current);
    service.nearbySearch(
      {
        location: truckPos,
        radius: 15000, // 15 km
        type: ["restaurant"],
      },
      (results, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          setSuggestedPlaces(results.slice(0, 3));
        } else {
          if ("speechSynthesis" in window) {
            window.speechSynthesis.speak(
              new SpeechSynthesisUtterance(
                "No safe stops found in proximity. Continuing map target.",
              ),
            );
          }
        }
      },
    );
  };

  const handleRestReject = () => {
    setRestReminderActive(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance(
          "Understood. I will remind you again in one hour.",
        ),
      );
    }
    // Simulate checking again in 1 hour (Using 30 seconds for live demo)
    setTimeout(() => {
      triggerRestReminder();
    }, 30000);
  };

  const triggerRestReminder = () => {
    if (!("speechSynthesis" in window)) {
      alert("Voice API not supported here. Take a 5 hour break.");
      return;
    }
    setRestReminderActive(true);
    setSuggestedPlaces([]);

    const utterance = new SpeechSynthesisUtterance(
      "You have been driving for 5 hours. It is strongly recommended to take a rest break. Say accept to find nearby rest stops, or ignore to continue.",
    );

    utterance.onend = () => {
      // Start listening for verbal command
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          if (
            transcript.includes("accept") ||
            transcript.includes("ok") ||
            transcript.includes("agree") ||
            transcript.includes("yes")
          ) {
            handleRestAccept();
          } else if (
            transcript.includes("ignore") ||
            transcript.includes("no") ||
            transcript.includes("cancel") ||
            transcript.includes("later")
          ) {
            handleRestReject();
          } else {
            // Didn't understand keyword, default to reject
            handleRestReject();
          }
        };
        recognition.onerror = () => handleRestReject();
        recognition.start();
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const triggerWeatherHalt = () => {
    if (restReminderActive) return;
    setRestReminderActive(true);
    setSuggestedPlaces([]);

    // Voice API Interruption - SEVERE METEOROLOGICAL EVENT
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(
        `Emergency override. Tier 3 Severe weather hazard detected. ${shipment.weather.condition}. Immediate shelter protocols activated.`,
      );
      u.onend = () => {
        // Auto-fire the shelter routing. Driver cannot decline a Tier 3 event.
        handleWeatherAccept();
      };
      window.speechSynthesis.speak(u);
    } else {
      handleWeatherAccept();
    }
  };

  const handleWeatherAccept = () => {
    setRestReminderActive(false);
    if (!mapRef.current) return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance(
          "Routing to nearest safe shelter location.",
        ),
      );
    }

    const service = new window.google.maps.places.PlacesService(mapRef.current);
    // Find Lodging / Parking for storm shelter
    service.nearbySearch(
      {
        location: truckPos,
        radius: 20000,
        type: ["lodging", "parking"],
      },
      (results, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          setSuggestedPlaces(results.slice(0, 3));
        }
      },
    );
  };

  // Monitor for Sudden Severe Weather Encroachment
  useEffect(() => {
    if (shiftStarted && shipment?.weather?.severityLevel === 3) {
      triggerWeatherHalt();
    }
  }, [shiftStarted, shipment?.weather?.severityLevel]);

  if (!shipment) return <div className="p-4">Shipment not found.</div>;

  if (!shiftStarted) {
    return (
      <div className="w-full h-full flex-col items-center justify-center p-4 bg-core">
        <h1 style={{ marginBottom: "16px" }}>{t('DRIVER_COCKPIT')}</h1>
        <p
          className="text-muted"
          style={{
            marginBottom: "32px",
            textAlign: "center",
            maxWidth: "300px",
          }}
        >
          To enable the Voice-Based Admin Override System, you must start your
          shift (browser audio policy).
        </p>
        <button
          className="btn btn-primary"
          style={{
            padding: "16px 32px",
            fontSize: "1.2rem",
            borderRadius: "50px",
          }}
          onClick={() => setShiftStarted(true)}
        >
          {t('START_SHIFT', 'Start Shift')}
        </button>
      </div>
    );
  }

  const currentInstructionHTML =
    directions?.routes?.[0]?.legs?.[0]?.steps?.[0]?.instructions ||
    "Calculating route...";
  const currentInstruction = currentInstructionHTML.replace(/<[^>]*>?/gm, ""); // strip HTML tags
  const currentETA =
    directions?.routes?.[0]?.legs?.[0]?.duration?.text || shipment.etaOriginal;

  return (
    <div
      className="w-full h-full bg-core flex-col relative"
      style={{ overflow: "hidden" }}
    >
      {/* Dynamic Instruction Overlay */}
      <div
        style={{
          position: "absolute",
          top: "100px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: "16px 32px",
            borderRadius: "50px",
            background: "var(--bg-glass)",
            border: "1px solid var(--border-active)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.5rem",
              color: "var(--text-main)",
              textAlign: "center",
            }}
          >
            {currentInstruction}
          </h2>
        </div>
      </div>

      {/* Background Live Map */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      >
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={truckPos}
            zoom={14}
            onLoad={(m) => {
              mapRef.current = m;
              setIsMapLoaded(true);
            }}
            options={mapOptions}
          >
            <TrafficLayer />

            {/* Dynamic Weather Radar Zone */}
            {isMapLoaded && truckPos && shipment && (
              <Circle
                center={truckPos}
                radius={20000} // 20km Radar Sphere
                options={circleOptions}
              />
            )}

            {/* Legacy Native Marker restored with explicit SVG rendering to bypass defaults */}
            {isMapLoaded && truckPos && (
              <AdvancedTruckMarker
                position={truckPos}
                map={mapRef.current}
              />
            )}

            {isMapLoaded &&
              directions &&
              directions.routes &&
              directions.routes[0] && (
                <Polyline
                  path={directions.routes[0].overview_path}
                  options={polylineOptions}
                />
              )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-50">
            Mapping Offline
          </div>
        )}
      </div>

      {/* Header Info */}
      <div
        className="p-4 glass-panel"
        style={{
          margin: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <div className="flex-col">
          <span className="text-muted" style={{ fontSize: "0.8rem", textTransform: 'uppercase' }}>
            {t('DESTINATION')}
          </span>
          <strong style={{ fontSize: "1.2rem" }}>{shipment.destination}</strong>
        </div>

        <div className="flex-row items-center gap-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              setMapTheme(mapTheme === "dark" ? "light" : "dark");
            }}
            className="btn btn-primary"
            style={{
              backgroundColor: "var(--bg-glass)",
              color: "var(--text-main)",
              border: "1px solid var(--border-active)",
              padding: "8px 16px",
              borderRadius: "50px",
              zIndex: 20,
            }}
          >
            {mapTheme === "dark" ? t('TOGGLE_LIGHT_MAP') : t('TOGGLE_DARK_MAP')}
          </button>
          
          {/* Language Dropdown */}
          <div style={{ position: 'relative', zIndex: 30 }}>
            <div 
               onClick={() => setShowLangDropdown(!showLangDropdown)}
               className="glass-panel flex-row items-center gap-2" 
               style={{ padding: '8px 16px', borderRadius: '50px', background: 'rgba(24,24,27,0.6)', border: '1px solid var(--border-active)', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none' }}
            >
               <Globe size={16} color="#a1a1aa" />
               <span style={{ fontSize: '0.9rem', color: '#fff', width: '24px', textAlign: 'center' }}>{language}</span>
            </div>
            
            {showLangDropdown && (
              <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', padding: '8px', borderRadius: '12px', background: 'rgba(24,24,27,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 50, minWidth: '80px' }}>
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => { setLanguage(lang); setShowLangDropdown(false); }}
                    style={{ background: language === lang ? 'rgba(59,130,246,0.2)' : 'transparent', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-col pb-2 pr-4 text-right">
          <span
            className="text-muted"
            style={{ fontSize: "0.85rem", display: "block" }}
          >
            ETA
          </span>
          <strong
            style={{ fontSize: "1.2rem", color: "var(--accent-primary)" }}
          >
            {currentETA}
          </strong>
        </div>
      </div>

      {/* Weather Overlay */}
      <div
        className="glass-panel"
        style={{
          position: "absolute",
          bottom: "120px",
          left: "16px",
          padding: "12px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <CloudRain
          size={24}
          color={
            shipment.weather.comfortScore < 5
              ? "var(--status-red)"
              : "var(--accent-primary)"
          }
        />
        <div className="flex-col">
          <strong>{shipment.weather.condition}</strong>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Comfort: {shipment.weather.comfortScore}/10
          </span>
        </div>
      </div>

      {/* Rest Stop / Shelter Suggestion UI */}
      {suggestedPlaces.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "180px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            width: "90%",
            maxWidth: "400px",
          }}
        >
          <div
            className="glass-panel p-4 flex-col gap-2"
            style={{
              background: "var(--bg-core)",
              border:
                shipment?.weather?.severityLevel === 3
                  ? "2px solid var(--status-red)"
                  : "2px solid var(--accent-primary)",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "var(--text-main)",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              {shipment?.weather?.severityLevel === 3
                ? "EMERGENCY SHELTER LOCATIONS"
                : "Nearest Rest Stops"}
            </h3>
            {suggestedPlaces.map((place, i) => (
              <div
                key={i}
                className="flex-row justify-between items-center"
                style={{
                  padding: "12px",
                  background: "var(--bg-glass)",
                  borderRadius: "8px",
                }}
              >
                <div className="flex-col">
                  <strong>{place.name}</strong>
                  <span
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    {place.vicinity}
                  </span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: "8px 16px", borderRadius: "4px" }}
                  onClick={() => {
                    updateShipmentStatus(
                      shipment.id,
                      "Resting",
                      `Resting at ${place.name}`,
                    );
                    setIsDriving(false);
                    setSpeed(0);
                    setSuggestedPlaces([]);
                  }}
                >
                  Route
                </button>
              </div>
            ))}
            <button
              className="btn"
              onClick={() => setSuggestedPlaces([])}
              style={{ marginTop: "8px", background: "transparent" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Voice Rest Prompt Modal indicator (just so driver knows mic is on) */}
      {restReminderActive && (
        <div
          style={{
            position: "absolute",
            bottom: "120px",
            right: "16px",
            zIndex: 20,
          }}
        >
          <div
            className="glass-panel p-4 flex-col items-center"
            style={{
              background: "var(--bg-glass)",
              border: "1px solid var(--status-yellow)",
            }}
          >
            <ShieldAlert
              color="var(--status-yellow)"
              size={24}
              style={{ marginBottom: "8px" }}
            />
            <strong style={{ color: "var(--status-yellow)" }}>
              Awaiting Verbal Command...
            </strong>
          </div>
        </div>
      )}

      {/* Voice Override Modal Layer */}
      {shipment.overrideActive && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "24px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: "32px",
              textAlign: "center",
              border: "2px solid var(--status-yellow)",
              maxWidth: "400px",
            }}
          >
            <ShieldAlert
              size={48}
              color="var(--status-yellow)"
              style={{ margin: "0 auto 16px" }}
            />
            <h2 style={{ marginBottom: "16px" }}>Admin Override Request</h2>
            <p
              style={{
                marginBottom: "24px",
                fontSize: "1.1rem",
                lineHeight: 1.4,
              }}
            >
              "{shipment.overrideReason}"
            </p>
            <div
              className="flex-row gap-4 justify-center"
              style={{ width: "100%" }}
            >
              <button
                className="flex-col items-center gap-2"
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "var(--status-green)",
                  borderRadius: "12px",
                  border: "none",
                  color: "white",
                }}
                onClick={() => resolveOverride(shipment.id, true)}
              >
                <CheckCircle size={32} />
                <strong>Accept</strong>
              </button>
              <button
                className="flex-col items-center gap-2"
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "transparent",
                  border: "2px solid var(--status-red)",
                  borderRadius: "12px",
                  color: "var(--text-main)",
                }}
                onClick={() => resolveOverride(shipment.id, false)}
              >
                <XCircle size={32} color="var(--status-red)" />
                <strong>Ignore</strong>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency & Demo Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px",
          display: "flex",
          gap: "12px",
          zIndex: 10,
        }}
      >
        {/* DRIVING SIM CONTROLS */}
        <button
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "16px",
            background:
              isDriving && speed > 0
                ? "var(--status-green)"
                : "var(--bg-glass)",
            color: isDriving && speed > 0 ? "white" : "var(--text-main)",
            border: "1px solid var(--border-active)",
          }}
          onClick={() => {
            setIsDriving(true);
            setSpeed((s) => Math.min(s + 1, 5));
          }}
        >
          {t('ACCELERATE', 'Accelerate')} ({speed}x)
        </button>
        <button
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "16px",
            background: "var(--bg-glass)",
            color: "var(--text-main)",
            border: "1px solid var(--border-active)",
          }}
          onClick={() => {
            setSpeed((s) => Math.max(s - 1, 0));
            if (speed <= 1) setIsDriving(false);
          }}
        >
          {t('BRAKE', 'Brake')}
        </button>

        {/* DEV TOOL FOR SIMULATING 5 HOURS DRIVING */}
        <button
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "16px",
            background: "var(--bg-glass)",
            color: "var(--text-main)",
            border: "1px solid var(--border-active)",
          }}
          onClick={() => triggerRestReminder()}
        >
          Fast Forward 5hr (Demo)
        </button>

        <button
          style={{
            flex: 3,
            padding: "24px",
            backgroundColor: "var(--status-red)",
            color: "white",
            border: "none",
            borderRadius: "16px",
            fontSize: "1.2rem",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 8px 32px var(--status-red-glow)",
          }}
          onClick={() => triggerEmergency(shipment.id)}
        >
          <ShieldAlert size={28} />
          EMERGENCY
        </button>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DriverCockpit;
