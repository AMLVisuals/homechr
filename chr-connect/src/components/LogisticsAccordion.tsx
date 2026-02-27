'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, User, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export default function LogisticsAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-hover)]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--bg-hover)] transition-colors"
      >
        <span className="font-medium text-[var(--text-secondary)]">Logistique & Accès</span>
        <ChevronDown className={clsx("w-5 h-5 text-[var(--text-muted)] transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
               {/* Digicode */}
               <div>
                 <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                   <MapPin className="w-3 h-3" /> Digicode / Accès
                 </label>
                 <input 
                   type="text" 
                   placeholder="ex: 1234A, Entrée fournisseurs..."
                   className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                 />
               </div>

               <div className="grid grid-cols-2 gap-3">
                 {/* Contact */}
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Contact
                    </label>
                    <select className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] appearance-none">
                      <option>Moi-même</option>
                      <option>Le Chef</option>
                      <option>Manager</option>
                      <option>Sécurité</option>
                    </select>
                 </div>

                 {/* Forbidden Time */}
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Créneau Interdit
                    </label>
                    <input 
                      type="text" 
                      placeholder="ex: 12h-14h"
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                    />
                 </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
