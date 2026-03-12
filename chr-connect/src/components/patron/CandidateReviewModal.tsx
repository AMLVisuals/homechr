'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, CheckCircle2, XCircle, UserPlus, Clock, MapPin, CalendarClock, Users, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Mission, MissionCandidate } from '@/types/missions';
import { useMissionsStore } from '@/store/useMissionsStore';

interface CandidateReviewModalProps {
  mission: Mission | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMissionDetails?: (missionId: string) => void;
}

export default function CandidateReviewModal({ mission, isOpen, onClose, onOpenMissionDetails }: CandidateReviewModalProps) {
  const { selectCandidate, rejectCandidate } = useMissionsStore();
  const [confirmed, setConfirmed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mission || !mounted) return null;

  const candidates = mission.candidates || [];
  const required = mission.requiredWorkers || 1;
  const acceptedCount = candidates.filter(c => c.status === 'ACCEPTED').length;
  const pendingCount = candidates.filter(c => c.status === 'PENDING').length;
  const allFilled = acceptedCount >= required || mission.status === 'SCHEDULED';
  const remaining = required - acceptedCount;

  const handleSelect = (candidateId: string) => {
    selectCandidate(mission.id, candidateId);
    if (acceptedCount + 1 >= required) {
      setConfirmed(true);
    }
  };

  const handleReject = (candidateId: string) => {
    rejectCandidate(mission.id, candidateId);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-h-[80vh] md:rounded-3xl bg-[var(--bg-card)] border-0 md:border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarClock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase">Mission planifiée</span>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{mission.title}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(mission.scheduledDate)}
                    </span>
                  </div>
                  {mission.venue && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-[var(--text-muted)]">
                      <MapPin className="w-3.5 h-3.5" />
                      {mission.venue}
                    </div>
                  )}
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>
            </div>

            {/* Progress bar multi-sélection */}
            {required > 1 && (
              <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-hover)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {acceptedCount} / {required} sélectionné{required > 1 ? 's' : ''}
                    </span>
                  </div>
                  {!allFilled && remaining > 0 && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Encore {remaining} à choisir
                    </span>
                  )}
                  {allFilled && (
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                      Complet
                    </span>
                  )}
                </div>
                <div className="w-full h-2 bg-[var(--bg-active)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((acceptedCount / required) * 100, 100)}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Confirmation banner + next step */}
              {(confirmed || allFilled) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-green-400">
                        {required > 1
                          ? `${acceptedCount} prestataire${acceptedCount > 1 ? 's' : ''} sélectionné${acceptedCount > 1 ? 's' : ''}`
                          : 'Prestataire sélectionné'
                        }
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {required > 1
                          ? 'Les prestataires sélectionnés seront notifiés de votre choix.'
                          : 'Le prestataire sera notifié de votre choix.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* CTA : voir la mission */}
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenMissionDetails) onOpenMissionDetails(mission.id);
                    }}
                    className="w-full py-3.5 bg-[var(--bg-active)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    Voir la mission
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {mission.category === 'STAFFING' && (
                    <p className="text-[10px] text-[var(--text-muted)] text-center">
                      La DPAE sera à effectuer une fois le prestataire sur place
                    </p>
                  )}
                </motion.div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Candidatures ({candidates.length})
                </h3>
                {pendingCount > 0 && !allFilled && (
                  <span className="text-xs text-[var(--text-muted)]">
                    {pendingCount} en attente
                  </span>
                )}
              </div>

              {candidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserPlus className="w-12 h-12 text-[var(--text-muted)] mb-3 opacity-40" />
                  <p className="text-sm font-medium text-[var(--text-muted)]">Aucune candidature</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Les prestataires intéressés apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      isSelected={candidate.status === 'ACCEPTED'}
                      isRejected={candidate.status === 'REJECTED'}
                      hasSelection={allFilled}
                      onSelect={() => handleSelect(candidate.id)}
                      onReject={() => handleReject(candidate.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

function CandidateCard({
  candidate,
  isSelected,
  isRejected,
  hasSelection,
  onSelect,
  onReject,
}: {
  candidate: MissionCandidate;
  isSelected: boolean;
  isRejected: boolean;
  hasSelection: boolean;
  onSelect: () => void;
  onReject: () => void;
}) {
  return (
    <motion.div
      layout
      className={clsx(
        "rounded-2xl border p-4 transition-all",
        isSelected
          ? "bg-green-500/5 border-green-500/30"
          : isRejected
          ? "bg-[var(--bg-hover)] border-[var(--border)] opacity-50"
          : "bg-[var(--bg-hover)] border-[var(--border)] hover:border-blue-500/30"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={candidate.avatar || `https://i.pravatar.cc/150?u=${candidate.id}`}
            alt={candidate.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-[var(--border)]"
          />
          {isSelected && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-[var(--text-primary)]">{candidate.name}</h4>
            {isSelected && (
              <span className="text-[10px] font-bold text-green-400 uppercase bg-green-500/10 px-2 py-0.5 rounded-full">
                Sélectionné
              </span>
            )}
            {isRejected && (
              <span className="text-[10px] font-bold text-red-400 uppercase bg-red-500/10 px-2 py-0.5 rounded-full">
                Refusé
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{candidate.specialty}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-[var(--text-primary)]">{candidate.rating}</span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {candidate.completedMissions} missions
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Postulé {new Date(candidate.appliedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {candidate.message && (
            <p className="text-xs text-[var(--text-secondary)] mt-2 italic">&ldquo;{candidate.message}&rdquo;</p>
          )}
        </div>
      </div>

      {/* Actions */}
      {!hasSelection && candidate.status === 'PENDING' && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={onReject}
            className="flex-1 py-2.5 rounded-xl bg-[var(--bg-active)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-bold hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            Refuser
          </button>
          <button
            onClick={onSelect}
            className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sélectionner
          </button>
        </div>
      )}
    </motion.div>
  );
}
