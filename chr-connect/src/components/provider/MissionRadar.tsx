'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Mission } from '@/types/missions';
import { useMissionsStore } from '@/store/useMissionsStore';
import { MissionSheet } from './mission-sheet';
import { AnimatePresence } from 'framer-motion';
import { Locate } from 'lucide-react';

// Dynamic import for Map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[var(--bg-card)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[var(--text-muted)] text-sm font-medium">Initialisation de la carte...</p>
      </div>
    </div>
  )
});

export default function MissionRadar({ authorizedCategories }: { authorizedCategories?: string[] }) {
  const { missions } = useMissionsStore();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 48.8566, lng: 2.3522 });
  const [userLocation, setUserLocation] = useState({ lat: 48.8566, lng: 2.3522 });

  // Only show SEARCHING missions matching the worker's authorized categories
  const filteredMissions = useMemo(() => {
    let currentMissions = missions.filter(m => m.status === 'SEARCHING');
    if (authorizedCategories && authorizedCategories.length > 0) {
      currentMissions = currentMissions.filter(m => m.type && authorizedCategories.includes(m.type));
    }
    return currentMissions;
  }, [authorizedCategories, missions]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(newPos);
          setUserLocation(newPos);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--bg-card)]">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapComponent
          missions={filteredMissions}
          center={mapCenter}
          onMissionSelect={setSelectedMission}
        />
      </div>

      {/* Locate Me Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleLocateMe}
          className="p-2.5 rounded-full bg-[var(--bg-card)]/80 hover:bg-[var(--bg-card)] backdrop-blur-md transition-colors border border-[var(--border)] shadow-lg"
        >
          <Locate className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
      </div>

      {/* Bottom Sheet for Mission Details */}
      <AnimatePresence>
        {selectedMission && (
          <MissionSheet
            mission={selectedMission}
            isOpen={!!selectedMission}
            onClose={() => setSelectedMission(null)}
            userLocation={userLocation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
