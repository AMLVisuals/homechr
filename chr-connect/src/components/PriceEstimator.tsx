
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Moon, Zap, Info, Calendar } from 'lucide-react';
import { calculatePrice, PriceBreakdown, PricingOptions } from '@/config/pricing';
import { clsx } from 'clsx';

interface PriceEstimatorProps {
  category: string;
  onOptionsChange: (totalHT: number, options: PricingOptions) => void;
}

export default function PriceEstimator({ category, onOptionsChange }: PriceEstimatorProps) {
  const [isNightWeekend, setIsNightWeekend] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Calculate price synchronously
  const breakdown = calculatePrice(category, {
    isNightOrWeekend: isNightWeekend,
    isUrgent: isUrgent
  });

  // Notify parent of changes
  useEffect(() => {
    onOptionsChange(breakdown.totalHT, { isNightOrWeekend: isNightWeekend, isUrgent: isUrgent });
  }, [breakdown.totalHT, isNightWeekend, isUrgent, onOptionsChange]);

  return (
    <div className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors">
      {/* Header & Main Price */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Estimation Forfaitaire
          </span>
          <div className="flex gap-2">
             <button 
               onClick={() => setIsNightWeekend(!isNightWeekend)}
               className={clsx(
                 "p-2 rounded-lg transition-all",
                 isNightWeekend ? "bg-purple-500/20 text-purple-300 border border-purple-500/50" : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
               )}
               title="Mode Nuit / Week-end"
             >
               {isNightWeekend ? <Moon className="w-4 h-4 fill-current" /> : <Calendar className="w-4 h-4" />}
             </button>
             <button 
               onClick={() => setIsUrgent(!isUrgent)}
               className={clsx(
                 "p-2 rounded-lg transition-all",
                 isUrgent ? "bg-orange-500/20 text-orange-300 border border-orange-500/50" : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
               )}
               title="Urgence Prioritaire"
             >
               <Zap className={clsx("w-4 h-4", isUrgent && "fill-current")} />
             </button>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <CountUp value={breakdown.totalHT} />
          <span className="text-xl text-[var(--text-secondary)] font-medium">€ HT</span>
        </div>
        
        {/* Tags for active modifiers */}
        <div className="flex gap-2 mt-2 h-6">
          <AnimatePresence>
            {isNightWeekend && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
              >
                MAJORATION NUIT (+50%)
              </motion.span>
            )}
            {isUrgent && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30"
              >
                PRIORITAIRE (+30€)
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Accordion Details */}
      <div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4" /> Comprendre ce prix
          </span>
          <ChevronDown className={clsx("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-[var(--bg-input)]"
            >
              <div className="p-4 pt-0 space-y-3 text-sm border-t border-[var(--border)] mt-2 pt-4">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Déplacement & Camion</span>
                  <span>{breakdown.travel}€</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Main d'œuvre qualifiée (1h)</span>
                  <span>{breakdown.labor}€</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Frais de Service (Platform)</span>
                  <span>{breakdown.platformFee}€</span>
                </div>
                
                {breakdown.nightSurcharge > 0 && (
                  <div className="flex justify-between text-purple-300">
                    <span>Majoration Nuit / WE</span>
                    <span>+{Math.round(breakdown.nightSurcharge)}€</span>
                  </div>
                )}
                
                {breakdown.urgencyFee > 0 && (
                  <div className="flex justify-between text-orange-300">
                    <span>Frais Dossier Express</span>
                    <span>+{breakdown.urgencyFee}€</span>
                  </div>
                )}

                <div className="border-t border-[var(--border)] pt-2 mt-2 flex justify-between font-bold text-[var(--text-primary)]">
                  <span>Total HT</span>
                  <span>{breakdown.totalHT}€</span>
                </div>
                
                <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-tight">
                  *Prix hors pièces détachées. Toute heure supplémentaire sera facturée 70€ HT. TVA 20% ou 10% selon éligibilité.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CountUp({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-4xl font-bold text-[var(--text-primary)] tracking-tight"
    >
      {value}
    </motion.span>
  );
}
