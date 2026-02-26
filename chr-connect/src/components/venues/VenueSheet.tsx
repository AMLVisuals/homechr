import { Venue } from '@/types/venue';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import VenueDetails from './VenueDetails';

interface VenueSheetProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

export default function VenueSheet({ venue, isOpen, onClose, readOnly = false }: VenueSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button Overlay */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <VenueDetails venue={venue} readOnly={readOnly} />
      </motion.div>
    </div>
  );
}