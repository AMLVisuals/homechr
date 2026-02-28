'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldOff } from 'lucide-react';

interface MissionWarningPopupProps {
  type: 'warning' | 'suspension';
  visible: boolean;
  suspendedUntil?: number | null;
  onDismiss: () => void;
}

export default function MissionWarningPopup({
  type,
  visible,
  suspendedUntil,
  onDismiss,
}: MissionWarningPopupProps) {
  const [mounted, setMounted] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(5);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown for suspension timer
  useEffect(() => {
    if (type !== 'suspension' || !suspendedUntil) return;

    const update = () => {
      const diff = Math.max(0, suspendedUntil - Date.now());
      setRemainingMinutes(Math.ceil(diff / 60000));
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [type, suspendedUntil]);

  if (!mounted || !visible) return null;

  const isWarning = type === 'warning';

  const portal = (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay */}
          <div className={`absolute inset-0 ${isWarning ? 'bg-amber-950/80' : 'bg-red-950/80'} backdrop-blur-md`} />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className={`rounded-3xl overflow-hidden border ${
              isWarning
                ? 'bg-gradient-to-b from-amber-950/90 to-amber-900/90 border-amber-500/30'
                : 'bg-gradient-to-b from-red-950/90 to-red-900/90 border-red-500/30'
            } shadow-2xl`}>
              {/* Icon */}
              <div className="flex justify-center pt-8 pb-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isWarning
                    ? 'bg-amber-500/20 border-2 border-amber-500/40'
                    : 'bg-red-500/20 border-2 border-red-500/40'
                }`}>
                  {isWarning ? (
                    <AlertTriangle className="w-10 h-10 text-amber-400" />
                  ) : (
                    <ShieldOff className="w-10 h-10 text-red-400" />
                  )}
                </div>
              </div>

              {/* Text */}
              <div className="px-6 pb-4 text-center">
                <h2 className={`text-xl font-bold mb-2 ${isWarning ? 'text-amber-300' : 'text-red-300'}`}>
                  {isWarning ? 'Attention' : 'Compte suspendu'}
                </h2>
                <p className={`text-sm leading-relaxed ${isWarning ? 'text-amber-200/70' : 'text-red-200/70'}`}>
                  {isWarning
                    ? 'Vous avez refusé 3 missions consécutives. Encore 2 refus et votre compte sera temporairement suspendu.'
                    : `Vous avez refusé trop de missions consécutives. Votre disponibilité est suspendue pour ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`
                  }
                </p>
              </div>

              {/* Button */}
              <div className="px-6 pb-6">
                <button
                  onClick={onDismiss}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
                    isWarning
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : 'bg-red-500 text-white hover:bg-red-400'
                  }`}
                >
                  {isWarning ? "J'ai compris" : 'Retour au tableau de bord'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(portal, document.body);
}
