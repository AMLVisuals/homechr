'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Wrench, ChefHat, Monitor, Hammer, 
  Clock, MapPin, CheckCircle2, AlertCircle, XCircle, MoreVertical, ArrowRight 
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { Mission } from '@/types/missions';
import MissionDetailsModal from '../missions/MissionDetailsModal';

const ICON_MAP: Record<string, any> = {
  Wrench, ChefHat, Monitor, Hammer
};

const STATUS_FILTERS = [
  { id: 'ALL', label: 'Tout' },
  { id: 'IN_PROGRESS', label: 'En cours' },
  { id: 'SCHEDULED', label: 'Planifié' },
  { id: 'COMPLETED', label: 'Terminé' },
  { id: 'CANCELLED', label: 'Annulé' },
];

interface MissionsTabProps {
  onMissionClick: (missionId: string, status: string) => void;
}

export default function MissionsTab({ onMissionClick }: MissionsTabProps) {
  const { missions } = useMissionsStore();
  const { activeVenueId } = useVenuesStore();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
    setIsModalOpen(true);
  };

  const filteredMissions = missions.filter(m => {
    // 1. Venue Filter
    if (activeVenueId && m.venueId !== activeVenueId) return false;
    
    // 2. Search Filter
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // 3. Status Filter
    if (filter === 'ALL') return true;

    if (filter === 'SCHEDULED') {
      return m.status === 'SCHEDULED' || (m.status === 'SEARCHING' && !!m.date);
    }

    if (filter === 'IN_PROGRESS') {
      return ['IN_PROGRESS', 'ON_WAY', 'ON_SITE', 'SEARCHING'].includes(m.status);
    }

    return m.status === filter;
  });

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || Wrench;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 md:gap-4 mb-8">
        <div className="text-center md:text-left w-full md:w-auto">
          <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">Missions</h2>
          <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium animate-pulse">Suivez et gérez toutes vos interventions</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border)] w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-[var(--text-primary)] pl-9 w-full md:w-64 placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="w-px h-6 bg-[var(--bg-active)] shrink-0" />
          <button className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border",
              filter === f.id
                ? "bg-[var(--text-primary)] text-[var(--bg-app)] border-[var(--text-primary)]"
                : "bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Missions Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-1 gap-4">
          {filteredMissions.map((mission) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleMissionClick(mission)}
              className="bg-[var(--bg-card)] rounded-xl p-4 md:p-6 border border-[var(--border)] hover:border-[var(--border-strong)] transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Status Stripe */}
              <div className={clsx(
                "absolute left-0 top-0 bottom-0 w-1",
                mission.status === 'IN_PROGRESS' ? "bg-blue-500" :
                mission.status === 'COMPLETED' ? "bg-green-500" :
                mission.status === 'SCHEDULED' ? "bg-purple-500" :
                mission.status === 'CANCELLED' ? "bg-red-500" :
                "bg-[var(--bg-active)]"
              )} />

              <div className="flex flex-col md:flex-row justify-between items-start mb-3 md:mb-4 pl-3 md:pl-4 gap-3 md:gap-0">
                <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                  <div className={clsx(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shrink-0",
                    `bg-${mission.color}-500`
                  )}>
                    {(() => {
                      const Icon = getIcon(mission.iconName || 'Wrench');
                      return <Icon className="w-5 h-5 md:w-6 md:h-6" />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base md:text-lg text-[var(--text-primary)] group-hover:text-blue-400 transition-colors truncate">{mission.title}</h3>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--text-secondary)] truncate">{mission.category}</span>
                      <span className="shrink-0">•</span>
                      <span className="shrink-0">{mission.date}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-1 md:mt-0">
                  <p className="font-bold text-[var(--text-primary)] text-base md:text-lg order-2 md:order-1">{mission.price}</p>
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider order-1 md:order-2",
                    mission.status === 'IN_PROGRESS' ? "bg-blue-500/20 text-blue-400" :
                    mission.status === 'COMPLETED' ? "bg-green-500/20 text-green-400" :
                    mission.status === 'SCHEDULED' ? "bg-purple-500/20 text-purple-400" :
                    "bg-[var(--bg-active)] text-[var(--text-secondary)]"
                  )}>
                    {mission.status === 'IN_PROGRESS' && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                    {mission.status === 'IN_PROGRESS' ? 'En cours' : 
                     mission.status === 'COMPLETED' ? 'Terminé' :
                     mission.status === 'SCHEDULED' ? 'Planifié' : 'En attente'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6 pl-3 md:pl-4 text-xs md:text-sm text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{mission.location?.address || 'Adresse inconnue'}</span>
                </div>
                {mission.expert && mission.expert !== 'En attente' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] md:text-xs text-white font-bold">
                      {mission.expert.charAt(0)}
                    </div>
                    {mission.expert}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {filteredMissions.length === 0 && (
            <div className="text-center py-20 text-[var(--text-muted)]">
              <p>Aucune mission trouvée pour ce filtre.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedMission && (
          <MissionDetailsModal 
            mission={missions.find(m => m.id === selectedMission.id) || selectedMission}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
