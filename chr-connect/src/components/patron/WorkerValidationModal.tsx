'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, CheckCircle2, XCircle, Briefcase, Clock } from 'lucide-react';
import { Mission } from '@/types/missions';
import { useMissionsStore } from '@/store/useMissionsStore';

interface WorkerValidationModalProps {
  mission: Mission | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkerValidationModal({ mission, isOpen, onClose }: WorkerValidationModalProps) {
  const updateMission = useMissionsStore((s) => s.updateMission);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRefusing, setIsRefusing] = useState(false);
  const [autoConfirmCountdown, setAutoConfirmCountdown] = useState(10);

  const worker = mission?.pendingWorker;

  // Auto-confirm simulation after 10s
  useEffect(() => {
    if (!isOpen || !mission) return;
    setAutoConfirmCountdown(10);

    const interval = setInterval(() => {
      setAutoConfirmCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mission?.id]);

  const handleConfirm = async () => {
    if (!mission) return;
    setIsConfirming(true);
    await new Promise((r) => setTimeout(r, 800));
    updateMission(mission.id, {
      status: 'ON_WAY',
      expert: worker?.name || 'Prestataire',
      provider: worker ? {
        id: worker.id,
        name: worker.name,
        rating: worker.rating,
        completedMissions: worker.completedMissions || 0,
        bio: worker.specialty,
        phone: '+33 6 00 00 00 00',
        avatar: worker.avatar,
      } : undefined,
    });
    setIsConfirming(false);
    onClose();
  };

  const handleRefuse = async () => {
    if (!mission) return;
    setIsRefusing(true);
    await new Promise((r) => setTimeout(r, 600));
    updateMission(mission.id, {
      status: 'SEARCHING',
      pendingWorker: undefined,
      expert: 'En attente',
    });
    setIsRefusing(false);
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mission || !worker || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-h-[80vh] md:rounded-3xl bg-[var(--bg-sidebar)] border-0 md:border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Prestataire trouvé</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--bg-card)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors">
              <X className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Worker Profile */}
          <div className="p-6 space-y-5">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--bg-active)] border border-[var(--border)]">
                {worker.avatar ? (
                  <img src={worker.avatar} alt={worker.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[var(--text-muted)]">
                    {worker.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{worker.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{worker.specialty}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-[var(--text-muted)]">Note</span>
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{worker.rating.toFixed(1)}/5</p>
              </div>
              <div className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-[var(--text-muted)]">Missions</span>
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{worker.completedMissions || 0}</p>
              </div>
            </div>

            {/* Mission info */}
            <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
              <p className="text-sm text-[var(--text-muted)] mb-1">Mission</p>
              <p className="font-medium text-[var(--text-primary)]">{mission.title}</p>
            </div>

            {/* Auto-confirm countdown */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Clock className="w-3 h-3" />
              <span>Confirmation automatique dans {autoConfirmCountdown}s</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleRefuse}
                disabled={isRefusing || isConfirming}
                className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all flex items-center justify-center gap-2"
              >
                {isRefusing ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-[var(--border)] border-t-current rounded-full" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Refuser
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming || isRefusing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isConfirming ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Confirmer
              </button>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>,
    document.body
  );
}
