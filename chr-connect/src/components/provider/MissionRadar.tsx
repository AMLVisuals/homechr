'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Mission } from '@/types/missions';
import { useMissionsStore } from '@/store/useMissionsStore';
import { MissionSheet } from './mission-sheet';
import { Locate, CalendarClock, MapPin, Clock, ChevronUp, ChevronDown, CheckCircle, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function formatScheduledDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function MissionRadar({ authorizedCategories }: { authorizedCategories?: string[] }) {
  const { missions, addCandidate, removeCandidate } = useMissionsStore();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 48.8566, lng: 2.3522 });
  const [userLocation, setUserLocation] = useState({ lat: 48.8566, lng: 2.3522 });
  const [showPlanned, setShowPlanned] = useState(false);

  // Immediate missions (on the map)
  const immediateMissions = useMemo(() => {
    let current = missions.filter(m => m.status === 'SEARCHING' && !m.scheduled);
    if (authorizedCategories && authorizedCategories.length > 0) {
      current = current.filter(m => m.type && authorizedCategories.includes(m.type));
    }
    return current;
  }, [authorizedCategories, missions]);

  // Planned missions (list below)
  const plannedMissions = useMemo(() => {
    let current = missions.filter(m => m.status === 'SEARCHING' && m.scheduled);
    if (authorizedCategories && authorizedCategories.length > 0) {
      current = current.filter(m => m.type && authorizedCategories.includes(m.type));
    }
    // Sort by scheduled date ascending
    return current.sort((a, b) => {
      const da = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
      const db = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
      return da - db;
    });
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
    <div className="relative w-full h-full overflow-hidden bg-[var(--bg-card)] flex flex-col">
      {/* Map Background */}
      <div className={cn("relative z-0 transition-all", showPlanned ? "h-[50%]" : "flex-1")}>
        <div className="absolute inset-0">
          <MapComponent
            missions={immediateMissions}
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
      </div>

      {/* Planned missions toggle bar */}
      <button
        onClick={() => setShowPlanned(!showPlanned)}
        className="relative z-10 flex items-center justify-center gap-2 py-3 px-4 bg-[var(--bg-sidebar)] border-t border-[var(--border)] text-sm font-bold"
      >
        <CalendarClock className="w-4 h-4 text-blue-400" />
        <span className="text-[var(--text-primary)]">
          Missions planifiées
        </span>
        {plannedMissions.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
            {plannedMissions.length}
          </span>
        )}
        {showPlanned ? (
          <ChevronDown className="w-4 h-4 text-[var(--text-muted)] ml-1" />
        ) : (
          <ChevronUp className="w-4 h-4 text-[var(--text-muted)] ml-1" />
        )}
      </button>

      {/* Planned missions list */}
      <AnimatePresence>
        {showPlanned && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '45%', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 bg-[var(--bg-app)] border-t border-[var(--border)] overflow-hidden"
          >
            <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-3">
              {plannedMissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <CalendarClock className="w-12 h-12 text-[var(--text-muted)] mb-3 opacity-40" />
                  <p className="text-sm font-medium text-[var(--text-muted)]">Aucune mission planifiée</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Les missions programmées pour plus tard apparaîtront ici</p>
                </div>
              ) : (
                plannedMissions.map((mission, idx) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedMission(mission)}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 cursor-pointer hover:border-blue-500/30 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-[10px] font-bold uppercase">
                            Planifiée
                          </span>
                          {mission.category === 'STAFFING' && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-[10px] font-bold uppercase">
                              Personnel
                            </span>
                          )}
                          {mission.category === 'MAINTENANCE' && (
                            <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 text-[10px] font-bold uppercase">
                              Technicien
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{mission.title}</h4>
                        {mission.description && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{mission.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{mission.price}</p>
                        {mission.distance && (
                          <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 justify-end mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {mission.distance}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">
                          {formatScheduledDate(mission.scheduledDate)}
                        </span>
                      </div>
                      {mission.venue && (
                        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-xs truncate">{mission.venue}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      {mission.candidates?.some(c => c.id === 'worker-self') ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCandidate(mission.id, 'worker-self');
                          }}
                          className="w-full py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-colors group"
                        >
                          <CheckCircle className="w-3.5 h-3.5 group-hover:hidden" />
                          <X className="w-3.5 h-3.5 hidden group-hover:block" />
                          <span className="group-hover:hidden">Candidature envoyée</span>
                          <span className="hidden group-hover:inline">Annuler candidature</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addCandidate(mission.id, {
                              id: 'worker-self',
                              name: 'Alexandre P.',
                              specialty: 'Expert qualifié',
                              rating: 4.9,
                              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
                              completedMissions: 42,
                              appliedAt: new Date().toISOString(),
                              status: 'PENDING',
                            });
                          }}
                          className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Se positionner
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
