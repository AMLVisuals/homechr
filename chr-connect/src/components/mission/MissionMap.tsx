'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MissionMapProps {
  techLocation: { lat: number; lng: number };
  venueLocation: { lat: number; lng: number };
  recenterKey?: number;
}

function MapUpdater({ techLocation, venueLocation, recenterKey }: MissionMapProps) {
  const map = useMap();
  
  useEffect(() => {
    // Force map to recalculate size to avoid grey/black tiles
    map.invalidateSize();

    if (techLocation && venueLocation) {
      const bounds = L.latLngBounds(
        [techLocation.lat, techLocation.lng],
        [venueLocation.lat, venueLocation.lng]
      );
      // Add padding to account for top/bottom UI overlays
      map.fitBounds(bounds, { paddingTopLeft: [50, 100], paddingBottomRight: [50, 200], animate: true });
    }
  }, [techLocation, venueLocation, map, recenterKey]);

  return null;
}

export default function MissionMap({ techLocation, venueLocation, recenterKey }: MissionMapProps) {
  // Memoize icons to avoid recreation on render and ensure client-side execution
  const { iconPerson, iconVenue } = useMemo(() => {
    return {
      iconPerson: new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/106/106137.png",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      }),
      iconVenue: new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35]
      })
    };
  }, []);

  return (
    <MapContainer 
      center={[venueLocation.lat, venueLocation.lng]} 
      zoom={13} 
      className="w-full h-full z-0 bg-gray-200"
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      <Marker position={[techLocation.lat, techLocation.lng]} icon={iconPerson}>
        <Popup>Technicien en route</Popup>
      </Marker>

      <Marker position={[venueLocation.lat, venueLocation.lng]} icon={iconVenue}>
        <Popup>Le Fouquet's</Popup>
      </Marker>

      <Polyline 
        positions={[
          [techLocation.lat, techLocation.lng],
          [venueLocation.lat, venueLocation.lng]
        ]}
        color="#3b82f6"
        weight={4}
        opacity={0.7}
        dashArray="10, 10"
      />

      <MapUpdater techLocation={techLocation} venueLocation={venueLocation} recenterKey={recenterKey} />
    </MapContainer>
  );
}
