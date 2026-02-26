'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, Star, Check, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import type { Venue } from '@/types/venue';

// ============================================================================
// TYPES
// ============================================================================

interface EstablishmentSelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EstablishmentSelector({ variant = 'default', className }: EstablishmentSelectorProps) {
  const {
    currentEstablishment,
    establishments,
    setCurrentEstablishmentId,
  } = useEstablishment();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter establishments
  const filteredEstablishments = establishments.filter(est =>
    est.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    est.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    est.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle selection
  const handleSelect = (establishment: Venue) => {
    setCurrentEstablishmentId(establishment.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all',
          isOpen
            ? 'bg-white/10 border-white/20'
            : 'bg-white/5 border-white/10 hover:bg-white/10',
          variant === 'compact' ? 'py-2' : ''
        )}
      >
        {currentEstablishment ? (
          <>
            {currentEstablishment.photoUrl ? (
              <img
                src={currentEstablishment.photoUrl}
                alt={currentEstablishment.name}
                className={cn(
                  'rounded-lg object-cover',
                  variant === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
                )}
              />
            ) : (
              <div className={cn(
                'rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center',
                variant === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
              )}>
                <MapPin className="w-4 h-4 text-white/40" />
              </div>
            )}
            <div className="text-left">
              <p className={cn(
                'text-white font-medium',
                variant === 'compact' ? 'text-sm' : ''
              )}>
                {currentEstablishment.name}
              </p>
              {variant !== 'compact' && (
                <p className="text-white/50 text-xs">
                  {currentEstablishment.city}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={cn(
              'rounded-lg bg-white/10 flex items-center justify-center',
              variant === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
            )}>
              <MapPin className="w-4 h-4 text-white/40" />
            </div>
            <span className="text-white/60">
              Sélectionner...
            </span>
          </>
        )}
        <ChevronDown className={cn(
          'w-4 h-4 text-white/40 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un établissement..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {filteredEstablishments.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-white/50 text-sm">Aucun établissement trouvé</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredEstablishments.map((establishment) => (
                    <button
                      key={establishment.id}
                      onClick={() => handleSelect(establishment)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                        currentEstablishment?.id === establishment.id
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : 'hover:bg-white/5'
                      )}
                    >
                      {establishment.photoUrl ? (
                        <img
                          src={establishment.photoUrl}
                          alt={establishment.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-white/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium truncate">{establishment.name}</p>
                          {establishment.isVerified && (
                            <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-white/50 text-sm truncate">
                          {establishment.address}, {establishment.city}
                        </p>
                        {establishment.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-white/60 text-xs">{establishment.rating}</span>
                          </div>
                        )}
                      </div>
                      {currentEstablishment?.id === establishment.id && (
                        <Check className="w-5 h-5 text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add New */}
            <div className="p-3 border-t border-white/10">
              <button className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Ajouter un établissement</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
