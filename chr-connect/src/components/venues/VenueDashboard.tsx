'use client';

import { useState, useEffect } from 'react';
import { useVenuesStore } from '@/store/useVenuesStore';
import { useStore } from '@/store/useStore';
import { ArrowLeft, Plus, Settings, Trash2, Edit2, MapPin, Clock, Copy, Calendar, CheckCircle, RefreshCw, Users, Ruler, Box, Zap, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VenueCard from './VenueCard';
import VenueForm from './VenueForm';
import VenueSearchModal from './VenueSearchModal';
import VenueDetails from './VenueDetails';
import { VenueFormData } from '@/types/venue';

interface VenueDashboardProps {
  onClose: () => void;
  initialView?: 'LIST' | 'SEARCH' | 'FORM';
}

export default function VenueDashboard({ onClose, initialView = 'LIST' }: VenueDashboardProps) {
  const { venues, activeVenueId, setActiveVenue, deleteVenue } = useVenuesStore();
  const { pendingRequests } = useStore();
  const [view, setView] = useState<'LIST' | 'SEARCH' | 'FORM'>(initialView);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [tempFormData, setTempFormData] = useState<VenueFormData | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    setSelectedPhotoIndex(0);
  }, [activeVenueId]);

  const activeVenueRequests = pendingRequests.filter((r: any) => r.venueId === activeVenueId);

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVenueId(id);
    setView('FORM');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cet établissement ?')) {
      deleteVenue(id);
    }
  };

  const handlePlaceSelect = (data: VenueFormData) => {
    setTempFormData(data);
    setView('FORM');
  };

  return (
    <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-7xl h-[90vh] bg-[#121212] border border-white/10 rounded-3xl overflow-hidden flex shadow-2xl"
      >
        {/* Sidebar List (Desktop) */}
        <div className="hidden md:flex w-80 border-r border-white/10 flex-col bg-[#1a1a1a] h-full shrink-0">
          <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-xl">Mes lieux</h2>
            <button 
              onClick={() => setView('SEARCH')} 
              className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 custom-scrollbar">
            {venues.map(venue => (
              <VenueCard 
                key={venue.id}
                venue={venue} 
                isActive={venue.id === activeVenueId}
                onClick={() => setActiveVenue(venue.id)}
                compact
              />
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative h-full min-w-0">
          {view === 'LIST' && (
            <div className="flex-1 flex flex-col h-full min-h-0">
               {/* Mobile Header */}
               <div className="md:hidden p-4 border-b border-white/10 flex items-center gap-4 shrink-0">
                 <button onClick={onClose}><ArrowLeft /></button>
                 <h2 className="font-bold text-lg">Mes Établissements</h2>
                 <button onClick={() => setView('SEARCH')} className="ml-auto"><Plus /></button>
               </div>

               {/* Active Venue Detail */}
               <div className="flex-1 overflow-hidden relative flex flex-col">
                  {venues.find(v => v.id === activeVenueId) ? (
                    <VenueDetails 
                      venue={venues.find(v => v.id === activeVenueId)!} 
                      onEdit={() => {
                        setEditingVenueId(activeVenueId);
                        setView('FORM');
                      }}
                      onDelete={() => {
                         if (activeVenueId && confirm('Êtes-vous sûr de vouloir supprimer cet établissement ?')) {
                           deleteVenue(activeVenueId);
                         }
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 md:p-8">
                      <p>Sélectionnez un établissement</p>
                    </div>
                  )}
               </div>

               {/* Close Button (Desktop) */}
               <div className="hidden md:flex p-6 border-t border-white/10 justify-end">
                 <button onClick={onClose} className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-bold transition-colors">
                   Fermer
                 </button>
               </div>
            </div>
          )}

          {view === 'SEARCH' && (
            <VenueSearchModal 
              onSelect={handlePlaceSelect} 
              onCancel={() => setView('LIST')} 
            />
          )}

          {view === 'FORM' && (
            <VenueForm 
              initialData={editingVenueId ? venues.find(v => v.id === editingVenueId) : tempFormData || {}}
              onClose={() => {
                setView('LIST');
                setEditingVenueId(null);
                setTempFormData(null);
              }}
              onSuccess={() => {
                setView('LIST');
                setEditingVenueId(null);
                setTempFormData(null);
              }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
