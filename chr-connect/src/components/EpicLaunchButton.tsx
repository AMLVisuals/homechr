'use client';

import { motion } from 'framer-motion';
import { Search, AlertTriangle, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface EpicLaunchButtonProps {
  urgency: 'NORMAL' | 'HIGH' | 'CRITICAL';
  onClick: () => void;
  isLoading?: boolean;
  price?: number;
  customLabel?: string;
}

export default function EpicLaunchButton({ urgency, onClick, isLoading, price, customLabel }: EpicLaunchButtonProps) {
  const isCritical = urgency === 'CRITICAL';
  const isHigh = urgency === 'HIGH';
  
  const displayPrice = price ? `${price}€` : (isCritical ? '90€' : '45€');

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isLoading}
      className={clsx(
        "w-full relative overflow-hidden rounded-xl p-[1px] group transition-all duration-300",
        isCritical ? "shadow-[0_0_40px_-10px_rgba(239,68,68,0.6)]" : "shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]"
      )}
    >
      {/* Animated Gradient Border */}
      <span className={clsx(
        "absolute inset-[-1000%] animate-[spin_2s_linear_infinite]",
        isCritical 
          ? "bg-[conic-gradient(from_90deg_at_50%_50%,#EF4444_0%,#7F1D1D_50%,#EF4444_100%)]"
          : "bg-[conic-gradient(from_90deg_at_50%_50%,#3B82F6_0%,#1E3A8A_50%,#3B82F6_100%)]"
      )} />
      
      {/* Button Content */}
      <span className={clsx(
        "relative flex items-center justify-center gap-3 h-full w-full rounded-xl px-6 py-4 backdrop-blur-3xl transition-colors",
        isCritical ? "bg-red-950/90 text-red-100" : "bg-gray-950/90 text-white"
      )}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-current animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-current animate-bounce delay-100" />
            <span className="w-2 h-2 rounded-full bg-current animate-bounce delay-200" />
          </span>
        ) : (
          <>
             {isCritical ? <AlertTriangle className="w-6 h-6 animate-pulse text-red-500" /> : <Zap className="w-5 h-5 text-blue-400" />}
             
             <div className="flex flex-col items-start text-left">
               <span className="font-bold text-lg leading-none uppercase tracking-wide">
                 {customLabel ? customLabel : (isCritical ? "SOS IMMÉDIAT" : isHigh ? "URGENCE HAUTE" : "Lancer Recherche")}
               </span>
               <span className={clsx("text-xs font-medium opacity-80", isCritical ? "text-red-300" : "text-blue-300")}>
                 {isCritical ? `Est. ${displayPrice} • Arrivée < 1h` : isHigh ? `Est. ${displayPrice} • Arrivée < 4h` : `Commander (${displayPrice})`}
               </span>
             </div>

             <Search className="w-5 h-5 ml-auto opacity-50" />
          </>
        )}
      </span>
    </motion.button>
  );
}
