'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Mission } from '@/types/missions';
import { MissionPin } from './mission-pin';

// This component handles map centering
function MapController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
}

interface MapComponentProps {
  missions: Mission[];
  center: { lat: number; lng: number };
  onMissionSelect: (mission: Mission) => void;
}

export default function MapComponent({ missions, center, onMissionSelect }: MapComponentProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="w-full h-full z-0"
      zoomControl={false}
    >
      {/* Dark mode tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <MapController center={center} />

      {missions.map((mission) => (
        <MissionPin
          key={mission.id}
          mission={mission}
          onClick={() => onMissionSelect(mission)}
        />
      ))}
    </MapContainer>
  );
}
