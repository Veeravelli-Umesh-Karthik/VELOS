import React, { createContext, useState, useEffect } from 'react';
import { translations } from '../translations';

export const AppDataContext = createContext();

// Mock Initial Shipments relocated to East Coast / I-95 for realistic demo
const initialShipments = [
  {
    id: 'SHP-1001',
    driverName: 'Marcus T.',
    origin: 'Miami Port',
    destination: 'Jacksonville Hub',
    type: 'Outgoing',
    status: 'Moving', 
    weather: { condition: 'Clear', comfortScore: 9, severityLevel: 0 }, // Fallback
    timeElapsed: '2h 15m',
    etaOriginal: '5h 30m',
    delayedPct: 0,
    coords: { lat: 26.1224, lng: -80.1373 }, // Fort Lauderdale
    alerts: [],
    overrideActive: false,
    overrideReason: null
  },
  {
    id: 'SHP-1002',
    driverName: 'Sarah Jenkins',
    origin: 'Atlanta Central',
    destination: 'Miami Port',
    type: 'Incoming',
    status: 'Moving',
    weather: { condition: 'Extreme Hailstorm', comfortScore: 2, severityLevel: 3 }, // Hardcoded Demo of Tier-3 Weather Event
    timeElapsed: '6h 45m',
    etaOriginal: '10h 50m',
    delayedPct: 20, 
    coords: { lat: 28.5383, lng: -81.3792 }, // Orlando
    alerts: ['Traffic Delay Logging'],
    overrideActive: false,
    overrideReason: null
  },
  {
    id: 'SHP-1003',
    driverName: 'David Lee',
    origin: 'Savannah Node',
    destination: 'Tampa',
    type: 'Outgoing',
    status: 'Resting',
    weather: { condition: 'Fetching...', comfortScore: 7, severityLevel: 1 },
    timeElapsed: '4h 20m',
    etaOriginal: '5h 10m',
    delayedPct: 0,
    coords: { lat: 30.3322, lng: -81.6557 }, // Jacksonville
    alerts: ['Rest Mode Activated'],
    overrideActive: false,
    overrideReason: null
  }
];

export const AppDataProvider = ({ children }) => {
  const [shipments, setShipments] = useState(initialShipments);
  const [language, setLanguage] = useState('EN');

  const t = (key, params = {}) => {
    let str = translations[language]?.[key] || translations['EN'][key] || key;
    Object.keys(params).forEach(k => {
      str = str.replace(`{${k}}`, params[k]);
    });
    return str;
  };

  // Fetch real weather data on mount
  useEffect(() => {
    const fetchRealWeather = async () => {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey || apiKey === 'YOUR_OPENWEATHER_KEY_HERE') return;

      const updatedShipments = await Promise.all(initialShipments.map(async (s) => {
        try {
          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${s.coords.lat}&lon=${s.coords.lng}&appid=${apiKey}&units=imperial`);
          const data = await res.json();
          if (data && data.weather && data.weather.length > 0) {
            const conditionId = data.weather[0].id;
            const desc = data.weather[0].description;
            const capitalizedDesc = desc.charAt(0).toUpperCase() + desc.slice(1);

            let severity = 0; // 0=Safe, 1=Caution, 2=Warning, 3=Severe
            let score = 10; // Legacy mapping

            // Thunderstorms, Freezing Rain, Extreme Rain, Heavy Snow, Tornado, Squall, Ash
            if (
                (conditionId >= 200 && conditionId <= 232) || 
                conditionId === 504 || conditionId === 511 || 
                (conditionId >= 601 && conditionId <= 622) || 
                conditionId === 781 || conditionId === 771 || conditionId === 762 || conditionId === 906
            ) {
              severity = 3;
              score = 2;
            } 
            // Heavy Rain, Fog, Haze, Dust
            else if (
                conditionId === 502 || conditionId === 503 ||
                conditionId === 701 || conditionId === 741 || conditionId === 711
            ) {
              severity = 2;
              score = 4;
            }
            // Light Rain, Drizzle, Light Snow, Heavy Overcast
            else if (
                (conditionId >= 300 && conditionId <= 321) ||
                (conditionId >= 500 && conditionId <= 501) || conditionId === 520 ||
                conditionId === 600 || conditionId === 615 || conditionId === 803 || conditionId === 804
            ) {
              severity = 1;
              score = 7;
            } else {
              severity = 0;
              score = 10;
            }

            return {
              ...s,
              weather: { condition: capitalizedDesc, comfortScore: score, severityLevel: severity }
            };
          }
        } catch (e) {
          console.error("OpenWeather API error:", e);
        }
        return s;
      }));
      setShipments(updatedShipments);
    };

    fetchRealWeather();
  }, []);

  // Expose a function to simulate an emergency trigger from driver
  const triggerEmergency = (id) => {
    setShipments(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'EMERGENCY', alerts: [...s.alerts, 'EMERGENCY SCENE REPORTED'] } : s
    ));
  };

  // Expose a function for admin to send override
  const sendOverride = (id, reason) => {
    setShipments(prev => prev.map(s =>
      s.id === id ? { ...s, overrideActive: true, overrideReason: reason, alerts: [...s.alerts, `Admin Override: ${reason}`] } : s
    ));
  };

  // Expose function for driver to accept/ignore override
  const resolveOverride = (id, accepted) => {
    setShipments(prev => prev.map(s =>
      s.id === id ? { 
        ...s, 
        overrideActive: false, 
        status: accepted ? 'Rerouting' : s.status,
        alerts: s.alerts.filter(a => !a.startsWith('Admin Override'))
      } : s
    ));
  };

  // Expose function for admin to dynamically update the routing
  const updateShipmentRoute = (id, newOrigin, newDestination) => {
    setShipments(prev => prev.map(s =>
      s.id === id ? {
        ...s,
        origin: newOrigin,
        destination: newDestination
      } : s
    ));
  };

  const updateShipmentLocation = (id, newCoords) => {
    setShipments(prev => prev.map(s =>
      s.id === id ? {
        ...s,
        coords: newCoords
      } : s
    ));
  };

  const updateShipmentStatus = (id, newStatus, newAlert) => {
    setShipments(prev => prev.map(s =>
      s.id === id ? {
        ...s,
        status: newStatus,
        alerts: newAlert ? [...s.alerts, newAlert] : s.alerts
      } : s
    ));
  };

  return (
    <AppDataContext.Provider value={{ 
      shipments, 
      triggerEmergency, 
      sendOverride, 
      resolveOverride, 
      updateShipmentRoute, 
      updateShipmentLocation, 
      updateShipmentStatus,
      language,
      setLanguage,
      t
    }}>
      {children}
    </AppDataContext.Provider>
  );
};
