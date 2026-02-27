'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Zap, X, ChevronRight } from 'lucide-react';
import { Mission } from '@/types/missions';

interface IntelligentAlertsProps {
  missions: Mission[];
  onSelectMission: (mission: Mission) => void;
}

export function IntelligentAlerts({ missions, onSelectMission }: IntelligentAlertsProps) {
  const [alerts, setAlerts] = useState<Mission[]>([]);

  // Simulate receiving new urgent missions
  useEffect(() => {
    const urgentMissions = missions.filter(m => m.urgent).slice(0, 2);
    setAlerts(urgentMissions);

    const interval = setInterval(() => {
      // Randomly add/remove alerts simulation
      const randomMission = missions[Math.floor(Math.random() * missions.length)];
      if (randomMission.urgent && !alerts.find(a => a.id === randomMission.id)) {
        setAlerts(prev => [...prev.slice(-2), randomMission]);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [missions]);

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="absolute top-24 right-4 z-[400] flex flex-col gap-3 max-w-[320px] pointer-events-none">
      <AnimatePresence>
        {alerts.map((mission) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="pointer-events-auto bg-black/80 backdrop-blur-xl border-l-4 border-red-500 rounded-r-xl overflow-hidden shadow-2xl shadow-red-900/20"
          >
            <div className="p-3 flex gap-3 relative">
              <button 
                onClick={(e) => { e.stopPropagation(); removeAlert(mission.id); }}
                className="absolute top-2 right-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3 h-3" />
              </button>

              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 animate-pulse">
                <Zap className="w-5 h-5 text-red-500" />
              </div>
              
              <div className="flex-1 min-w-0" onClick={() => onSelectMission(mission)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Urgence Détectée</span>
                  {mission.distance && <span className="text-[10px] text-[var(--text-muted)]">{mission.distance}</span>}
                </div>
                <h4 className="font-bold text-[var(--text-primary)] text-sm truncate leading-tight mb-1">{mission.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] truncate mb-2">{mission.venue || 'Client'}</p>
                
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-primary)] text-sm">
                    {typeof mission.price === 'number' ? `${mission.price}€` : mission.price}
                  </span>
                  <button className="text-xs flex items-center gap-1 text-blue-400 font-medium hover:text-blue-300 transition-colors">
                    Voir <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Progress bar for timeout simulation */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 30, ease: 'linear' }}
              className="h-1 bg-red-500/50"
              onAnimationComplete={() => removeAlert(mission.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
