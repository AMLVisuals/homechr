'use client';

import { useState, useRef, useEffect } from 'react';
import { useVenuesStore } from '@/store/useVenuesStore';
import { ChevronDown, Plus, MapPin, Settings, Edit2 } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import VenueCard from './VenueCard';

interface VenueSelectorProps {
  onAddVenue?: () => void;
  onManage?: () => void;
}

export default function VenueSelector({ onAddVenue, onManage }: VenueSelectorProps) {
  const { venues, activeVenueId, setActiveVenue } = useVenuesStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeVenue = venues.find(v => v.id === activeVenueId);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-40" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-active)] hover:bg-[var(--bg-active)] border border-[var(--border)] transition-all"
      >
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
          <MapPin className="w-3.5 h-3.5 text-blue-300" />
        </div>
        <div className="text-left">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold leading-none mb-0.5">Établissement</div>
          <div className="text-sm font-bold text-[var(--text-primary)] leading-none flex items-center gap-1">
            {activeVenue?.name || "Sélectionner"}
            <ChevronDown className={clsx("w-4 h-4 transition-transform text-[var(--text-secondary)]", isOpen && "rotate-180")} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-2 w-[85vw] md:w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-50"
          >
            <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
              {venues.map((venue) => (
                <div key={venue.id} className="relative group">
                   <div onClick={() => {
                      setActiveVenue(venue.id);
                      setIsOpen(false);
                   }}>
                      <VenueCard 
                        venue={venue}
                        isActive={venue.id === activeVenueId}
                        compact
                        onClick={() => {
                          setActiveVenue(venue.id);
                          setIsOpen(false);
                        }}
                      />
                   </div>
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       // Here we could open the sheet for editing if we wanted
                       setActiveVenue(venue.id);
                       setIsOpen(false);
                       onManage?.();
                     }}
                     className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-blue-500 hover:text-[var(--text-primary)] z-20"
                     title="Modifier la fiche"
                   >
                     <Edit2 className="w-3 h-3" />
                   </button>
                </div>
              ))}
            </div>
            
            <div className="p-2 border-t border-[var(--border)] grid grid-cols-2 gap-2 bg-[var(--bg-input)]">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  onAddVenue?.();
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-xs font-bold text-[var(--text-secondary)] transition-colors"
              >
                <Plus className="w-3 h-3" /> Ajouter
              </button>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  onManage?.();
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-xs font-bold text-[var(--text-secondary)] transition-colors"
              >
                <Settings className="w-3 h-3" /> Gérer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
