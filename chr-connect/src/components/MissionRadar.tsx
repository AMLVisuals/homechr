'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, DollarSign, Clock, Navigation, Radio, Wifi, Briefcase, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useMissionsStore } from '@/store/useMissionsStore';
import { clsx } from 'clsx';

export default function MissionRadar() {
  const { isOnAir, toggleOnAir } = useStore();
  const allMissions = useMissionsStore((s) => s.missions);
  const [activeMissionIndex, setActiveMissionIndex] = useState(0);

  // Build radar cards from real missions with SEARCHING status
  const radarMissions = allMissions
    .filter((m) => m.status === 'SEARCHING')
    .map((m) => ({
      id: m.id,
      title: m.title,
      location: m.venue || 'Lieu non précisé',
      dist: m.distance ? `${m.distance}km` : '—',
      price: m.price ? `${m.price}€` : '—',
      type: 'Forfait',
      details: m.description || '',
      urgent: m.urgent || false,
    }));

  const handleAccept = () => {
    // Remove current card
    setActiveMissionIndex(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Mission Radar</h1>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Wifi className={clsx("w-4 h-4", isOnAir ? "text-green-500" : "text-[var(--text-muted)]")} />
            {isOnAir ? "En ligne - Recherche..." : "Hors ligne"}
          </div>
        </div>
        
        <button 
          onClick={toggleOnAir}
          className={clsx(
            "relative w-16 h-8 rounded-full transition-colors duration-300",
            isOnAir ? "bg-green-500" : "bg-gray-700"
          )}
        >
          <motion.div 
            animate={{ x: isOnAir ? 32 : 4 }}
            className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-lg"
          />
        </button>
      </div>

      {!isOnAir ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
          <Radio className="w-16 h-16 mb-4 opacity-20" />
          <p>Passez en ligne pour recevoir des missions</p>
        </div>
      ) : (
        <div className="flex-1 relative flex items-center justify-center">
          {/* Radar Effect Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
             <div className="w-64 h-64 border border-green-500/30 rounded-full animate-ping absolute" />
             <div className="w-96 h-96 border border-green-500/20 rounded-full absolute" />
          </div>

          <div className="relative w-full max-w-md h-[500px]">
            {radarMissions.slice(activeMissionIndex).reverse().map((mission, index) => {
              const isTop = index === radarMissions.length - 1 - activeMissionIndex;
              return (
                <MissionCard 
                  key={mission.id} 
                  mission={mission} 
                  isTop={isTop}
                  onSwipe={handleAccept}
                />
              );
            })}
            {activeMissionIndex >= radarMissions.length && (
              <div className="text-center text-[var(--text-secondary)] mt-20">
                <p>Aucune mission à proximité...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MissionCard({ mission, isTop, onSwipe }: { mission: any, isTop: boolean, onSwipe: () => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe();
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="absolute inset-0 w-full h-full"
    >
      <div className="w-full h-full glass-strong rounded-3xl p-6 border border-[var(--border)] flex flex-col relative overflow-hidden">
        {/* Background Map Placeholder */}
        <div className="absolute inset-0 bg-gray-900 opacity-50 z-0">
           {/* Simulate Map */}
           <div className="w-full h-full bg-[radial-gradient(circle_at_center,#333_1px,transparent_1px)] bg-[length:20px_20px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl mb-auto">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{mission.title}</h2>
              {mission.urgent && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">URGENT</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              {mission.location} ({mission.dist})
            </div>
             <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
              <Briefcase className="w-3 h-3" />
              {mission.details}
            </div>
          </div>

          <div className="mt-auto">
             <div className="flex items-center justify-between mb-4 px-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{mission.price}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{mission.type}</div>
                </div>
                 <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">15</div>
                  <div className="text-xs text-[var(--text-secondary)]">Min</div>
                </div>
             </div>

             <div className="relative h-14 bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl flex items-center justify-center overflow-hidden">
                <motion.div 
                   className="absolute left-4 text-[var(--text-muted)] text-sm"
                   animate={{ x: [0, 10, 0] }}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ChevronRightDouble />
                </motion.div>
                <span className="font-bold text-[var(--text-primary)] ml-8">Glisser pour Accepter</span>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChevronRightDouble() {
  return (
    <div className="flex">
      <ChevronRight className="w-5 h-5 -mr-2" />
      <ChevronRight className="w-5 h-5" />
    </div>
  )
}
