'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, TrendingUp, AlertTriangle, Check } from 'lucide-react';
import { Mission } from '@/types/missions';

interface MissionPopupProps {
  mission: Mission | null;
  countdown: number;
  onAccept: () => void;
  onRefuse: () => void;
}

const COUNTDOWN_MAX = 30;

// SVG ring countdown
function CountdownRing({ seconds }: { seconds: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / COUNTDOWN_MAX;
  const offset = circumference * (1 - progress);

  const color = seconds > 10 ? '#22c55e' : seconds > 5 ? '#f59e0b' : '#ef4444';
  const isPulsing = seconds <= 5;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/10" />
        {/* Progress ring */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center ${isPulsing ? 'animate-pulse' : ''}`}>
        <span className="text-3xl font-black tabular-nums" style={{ color }}>
          {seconds}
        </span>
      </div>
    </div>
  );
}

export default function MissionPopup({
  mission,
  countdown,
  onAccept,
  onRefuse,
}: MissionPopupProps) {
  const [exitDirection, setExitDirection] = useState<'left' | 'scale' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !mission) return null;

  const handleAccept = () => {
    setExitDirection('scale');
    setTimeout(onAccept, 300);
  };

  const handleRefuse = () => {
    setExitDirection('left');
    setTimeout(onRefuse, 300);
  };

  const exitVariants = {
    left: { x: '-120%', opacity: 0, transition: { duration: 0.3, ease: 'easeIn' as const } },
    scale: { scale: 0.8, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' as const } },
  };

  const priceDisplay = typeof mission.price === 'number'
    ? `${mission.price}€`
    : mission.price || '—';

  const portal = (
    <AnimatePresence mode="wait">
      {mission && (
        <motion.div
          key={mission.id}
          className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg mx-4 mb-4 sm:mb-8"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={exitDirection ? exitVariants[exitDirection] : { y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border border-white/10 shadow-2xl">
              {/* Countdown + Badge */}
              <div className="pt-6 pb-2">
                <CountdownRing seconds={countdown} />
                {mission.urgent && (
                  <div className="flex justify-center mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Urgent
                    </span>
                  </div>
                )}
              </div>

              {/* Mission Info */}
              <div className="px-6 pb-4">
                <h2 className="text-xl font-bold text-white text-center mb-1">
                  {mission.title}
                </h2>
                <p className="text-sm text-blue-300/80 text-center mb-4">
                  {mission.venue || 'Établissement'}
                  {mission.distance && (
                    <span className="text-white/40 ml-2">· {mission.distance}</span>
                  )}
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                    <p className="text-lg font-bold text-emerald-400">{priceDisplay}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Prix</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <p className="text-lg font-bold text-blue-400">{mission.distance || '—'}</p>
                    </div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Trajet</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                      <p className="text-lg font-bold text-purple-400">{mission.matchScore ?? '—'}%</p>
                    </div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Match</p>
                  </div>
                </div>

                {/* Description */}
                {mission.description && (
                  <p className="text-sm text-white/60 text-center line-clamp-2 mb-4">
                    {mission.description}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="px-6 pb-6 flex items-center gap-3">
                {/* Refuse button - small */}
                <button
                  onClick={handleRefuse}
                  className="w-14 h-14 flex-shrink-0 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center hover:bg-red-500/25 active:scale-95 transition-all"
                >
                  <X className="w-6 h-6 text-red-400" />
                </button>

                {/* Accept button - large */}
                <button
                  onClick={handleAccept}
                  className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-green-400 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 font-bold text-white"
                >
                  <Check className="w-5 h-5" />
                  Accepter la mission
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
