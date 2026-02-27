'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { FilterType, Mission } from '@/types/missions';
import { ActiveFilters } from '@/types/filters';
import { useMissionsStore } from '@/store/useMissionsStore';
import { DynamicFilterPills } from './dynamic-filter-pills';
import { IntelligentAlerts } from './IntelligentAlerts';
import { MissionSheet } from './mission-sheet';
import { AnimatePresence } from 'framer-motion';
import { Locate, Navigation } from 'lucide-react';

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
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 48.8566, lng: 2.3522 }); // Paris Center
  const [userLocation, setUserLocation] = useState({ lat: 48.8566, lng: 2.3522 });

  // Determine current job context (default to 'cold' or first authorized category)
  const currentJobId = authorizedCategories?.[0] || 'cold';

  const filteredMissions = useMemo(() => {
    // Only show available missions (SEARCHING)
    let currentMissions = missions.filter(m => m.status === 'SEARCHING');

    // 1. Apply Relevance Engine (Security Filter)
    if (authorizedCategories && authorizedCategories.length > 0) {
       currentMissions = currentMissions.filter(m => m.type && authorizedCategories.includes(m.type));
    }

    // 2. Apply Intelligent Filters
    Object.entries(activeFilters).forEach(([categoryId, filterValue]) => {
      // Skip if filter is undefined or false (unless we want to filter by false, but usually UI toggles 'on')
      if (filterValue === undefined || filterValue === false) return;

      currentMissions = currentMissions.filter(m => {
        // Special mapping for root properties
        if (categoryId === 'urgency' && typeof filterValue === 'boolean') {
          return m.urgent === filterValue;
        }

        // Default: check attributes
        if (!m.attributes) return false;
        const attrValue = m.attributes[categoryId as keyof typeof m.attributes];

        if (attrValue === undefined) return false;

        if (Array.isArray(filterValue)) {
           // Multi-select (OR logic within category)
           if (Array.isArray(attrValue)) {
             return attrValue.some(v => filterValue.includes(v));
           } else {
             return filterValue.includes(attrValue as string);
           }
        } else {
           // Single value (Exact match)
           if (Array.isArray(attrValue)) {
             return attrValue.includes(filterValue as string);
           } else {
             return attrValue === filterValue;
           }
        }
      });
    });

    return currentMissions;
  }, [activeFilters, authorizedCategories, missions]);

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

      {/* Top Overlay: Filters & Status */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent pt-safe-top">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between text-[var(--text-primary)]">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-500 fill-blue-500" />
                Mission Radar
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                {filteredMissions.length} missions disponibles à proximité
              </p>
            </div>
            
            <button 
              onClick={handleLocateMe}
              className="p-2 rounded-full bg-[var(--bg-active)] hover:bg-[var(--bg-active)] backdrop-blur-md transition-colors border border-[var(--border)]"
            >
              <Locate className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          </div>

          {/* Filters */}
          <DynamicFilterPills 
            jobId={currentJobId} 
            activeFilters={activeFilters} 
            onFilterChange={setActiveFilters} 
          />
        </div>
      </div>

      {/* Intelligent Alerts System */}
      <IntelligentAlerts 
        missions={missions} 
        onSelectMission={(mission) => {
          if (mission.location) {
            setMapCenter(mission.location);
          }
          setSelectedMission(mission);
        }} 
      />

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

      {/* Decorative overlay for map edges */}
      <div className="absolute inset-0 pointer-events-none shadow-inner-[0_0_100px_rgba(0,0,0,0.5)] z-[5]" />
    </div>
  );
}
