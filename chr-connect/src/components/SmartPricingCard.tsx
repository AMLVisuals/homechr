
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Moon, Zap, Info, Calendar, Clock, Briefcase, Ruler } from 'lucide-react';
import { JobPricing, getJobPricing } from '@/config/pricingRules';
import { clsx } from 'clsx';

interface SmartPricingCardProps {
  subCategoryId: string;
  onOptionsChange: (totalHT: number, options: any) => void;
}

export default function SmartPricingCard({ subCategoryId, onOptionsChange }: SmartPricingCardProps) {
  const pricing = getJobPricing(subCategoryId);
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  
  // Maintenance Options
  const [isNightWeekend, setIsNightWeekend] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Staffing Options
  const [hours, setHours] = useState(pricing.minHours || 4);

  // Calculate Price
  const calculateTotal = () => {
    let total = 0;

    if (pricing.model === 'MAINTENANCE_FIXED') {
      const base = pricing.baseRate;
      const multiplier = isNightWeekend ? 1.5 : 1;
      total = (base * multiplier) + (isUrgent ? 30 : 0);
    } 
    else if (pricing.model === 'STAFFING_HOURLY') {
      total = pricing.baseRate * hours;
    } 
    else if (pricing.model === 'PROJECT_VISIT') {
      total = pricing.baseRate;
    }

    return Math.floor(total);
  };

  const totalHT = calculateTotal();

  // Notify Parent
  useEffect(() => {
    onOptionsChange(totalHT, { 
      model: pricing.model, 
      isUrgent, 
      isNightWeekend,
      hours 
    });
  }, [totalHT, isUrgent, isNightWeekend, hours, pricing.model, onOptionsChange]);

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-colors">
      
      {/* PROJECT BANNER */}
      {pricing.model === 'PROJECT_VISIT' && (
        <div className="bg-blue-500/20 border-b border-blue-500/30 p-3 flex gap-3 items-start">
          <Ruler className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-100 leading-relaxed">
            Ce montant correspond à une <strong className="text-white">Visite Conseil & Chiffrage</strong>. 
            Le projet complet fera l'objet d'un devis ultérieur.
          </p>
        </div>
      )}

      <div className="p-5 border-b border-white/5">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <div className={clsx("w-2 h-2 rounded-full animate-pulse", 
              pricing.model === 'STAFFING_HOURLY' ? "bg-green-500" :
              pricing.model === 'PROJECT_VISIT' ? "bg-purple-500" : "bg-blue-500"
            )} />
            {pricing.model === 'STAFFING_HOURLY' && "Prestation Horaire"}
            {pricing.model === 'MAINTENANCE_FIXED' && "Forfait Dépannage"}
            {pricing.model === 'PROJECT_VISIT' && "Visite Préliminaire"}
          </span>

          {/* CONTROLS: Only for Maintenance */}
          {pricing.model === 'MAINTENANCE_FIXED' && (
            <div className="flex gap-2">
               <button 
                 onClick={() => setIsNightWeekend(!isNightWeekend)}
                 className={clsx(
                   "p-2 rounded-lg transition-all",
                   isNightWeekend ? "bg-purple-500/20 text-purple-300 border border-purple-500/50" : "bg-white/5 text-gray-500 hover:text-gray-300"
                 )}
                 title="Mode Nuit / Week-end"
               >
                 {isNightWeekend ? <Moon className="w-4 h-4 fill-current" /> : <Calendar className="w-4 h-4" />}
               </button>
               <button 
                 onClick={() => setIsUrgent(!isUrgent)}
                 className={clsx(
                   "p-2 rounded-lg transition-all",
                   isUrgent ? "bg-orange-500/20 text-orange-300 border border-orange-500/50" : "bg-white/5 text-gray-500 hover:text-gray-300"
                 )}
                 title="Urgence Prioritaire"
               >
                 <Zap className={clsx("w-4 h-4", isUrgent && "fill-current")} />
               </button>
            </div>
          )}
        </div>

        {/* MAIN PRICE DISPLAY */}
        <div className="flex items-baseline gap-2">
          <CountUp value={totalHT} />
          <span className="text-xl text-gray-400 font-medium">€ HT</span>
        </div>

        {/* DYNAMIC SUBTEXT / CONTROLS */}
        <div className="mt-3">
          
          {/* STAFFING SLIDER */}
          {pricing.model === 'STAFFING_HOURLY' && (
            <div className="bg-black/20 rounded-lg p-3 border border-white/5">
              <div className="flex justify-between text-sm mb-2 text-gray-300">
                <span>Durée du service</span>
                <span className="font-bold text-white">{hours}h</span>
              </div>
              <input 
                type="range" 
                min={pricing.minHours || 4} 
                max={12} 
                step={1} 
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <p className="text-[10px] text-gray-500 mt-1">Minimum {pricing.minHours}h requis pour ce poste.</p>
            </div>
          )}

          {/* MAINTENANCE TAGS */}
          {pricing.model === 'MAINTENANCE_FIXED' && (
            <div className="flex gap-2 h-6">
              <AnimatePresence>
                {isNightWeekend && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  >
                    NUIT / WE (+50%)
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
          )}
        </div>
      </div>

      {/* RECEIPT DETAILS (ACCORDION) */}
      <div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 text-sm text-gray-400 hover:bg-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4" /> Détail de l'estimation
          </span>
          <ChevronDown className={clsx("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-black/20"
            >
              <div className="p-4 pt-0 space-y-3 text-sm border-t border-white/5 mt-2 pt-4">
                
                {/* STAFFING RECEIPT */}
                {pricing.model === 'STAFFING_HOURLY' && (
                  <>
                    <div className="flex justify-between text-gray-300">
                      <span>Prestation ({hours}h x {pricing.baseRate}€)</span>
                      <span>{hours * pricing.baseRate}€</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Frais de gestion & Assurance</span>
                      <span className="text-green-400">Inclus</span>
                    </div>
                  </>
                )}

                {/* MAINTENANCE RECEIPT */}
                {pricing.model === 'MAINTENANCE_FIXED' && (
                  <>
                    <div className="flex justify-between text-gray-400">
                      <span>Déplacement & Véhicule</span>
                      <span>50€</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Diagnostic & 1h Main d'œuvre</span>
                      <span>{Math.round(pricing.baseRate - 50)}€</span>
                    </div>
                    {isNightWeekend && (
                      <div className="flex justify-between text-purple-300">
                        <span>Majoration Nuit / WE</span>
                        <span>+{Math.round(pricing.baseRate * 0.5)}€</span>
                      </div>
                    )}
                    {isUrgent && (
                      <div className="flex justify-between text-orange-300">
                        <span>Frais Dossier Express</span>
                        <span>+30€</span>
                      </div>
                    )}
                  </>
                )}

                {/* PROJECT RECEIPT */}
                {pricing.model === 'PROJECT_VISIT' && (
                  <>
                    <div className="flex justify-between text-gray-300">
                      <span>Visite Expert (2h approx)</span>
                      <span>{pricing.baseRate}€</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Rapport & Chiffrage travaux</span>
                      <span className="text-green-400">Inclus</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Déplacement</span>
                      <span className="text-green-400">Inclus</span>
                    </div>
                  </>
                )}

                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-bold text-white">
                  <span>Total HT</span>
                  <span>{totalHT}€</span>
                </div>
                
                <p className="text-[10px] text-gray-600 mt-2 leading-tight">
                  *TVA 20% ou 10% applicable selon éligibilité de l'entreprise.
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
      className="text-4xl font-bold text-white tracking-tight"
    >
      {value}
    </motion.span>
  );
}
