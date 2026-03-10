'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
      />

      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[720px] md:max-h-[80vh] md:rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button Overlay */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-[var(--border)]"
        >
          <X className="w-5 h-5" />
        </button>

        <VenueDetails venue={venue} readOnly={readOnly} />
      </motion.div>
    </>,
    document.body
  );
}