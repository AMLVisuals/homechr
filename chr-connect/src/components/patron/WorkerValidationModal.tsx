'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, CheckCircle2, XCircle, Briefcase, Clock, ShieldAlert, FileText, MapPin, Shield, Tag, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
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
  const [dpaeAcknowledged, setDpaeAcknowledged] = useState(false);

  const worker = mission?.pendingWorker;
  // Fallback sécurisé : si employmentCategory manquant + mission STAFFING → considérer comme EXTRA (DPAE obligatoire)
  const requiresDPAE = worker?.employmentCategory === 'EXTRA'
    || (worker?.employmentCategory === undefined && mission?.category === 'STAFFING');

  // Auto-confirm only if DPAE not required or already acknowledged
  useEffect(() => {
    if (!isOpen || !mission) return;
    setAutoConfirmCountdown(10);
    setDpaeAcknowledged(false);

    // Don't auto-confirm if DPAE is required — patron must explicitly acknowledge
    if (requiresDPAE) return;

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
  }, [isOpen, mission?.id, requiresDPAE]);

  const handleConfirm = async () => {
    if (!mission) return;
    // Block if DPAE required but not acknowledged
    if (requiresDPAE && !dpaeAcknowledged) return;

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

  const canConfirm = !requiresDPAE || dpaeAcknowledged;
  const reliabilityRate = worker.reliabilityRate ?? 95;
  const reliabilityColor = reliabilityRate >= 90 ? 'text-green-400' : reliabilityRate >= 70 ? 'text-amber-400' : 'text-red-400';
  const reliabilityBg = reliabilityRate >= 90 ? 'bg-green-500' : reliabilityRate >= 70 ? 'bg-amber-500' : 'bg-red-500';

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
          className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-h-[85vh] md:rounded-3xl bg-[var(--bg-sidebar)] border-0 md:border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Prestataire trouvé</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--bg-card)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors">
              <X className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Worker Profile */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Avatar + Name + Distance */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--bg-active)] border border-[var(--border)] shrink-0">
                {worker.avatar ? (
                  <img src={worker.avatar} alt={worker.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[var(--text-muted)]">
                    {worker.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{worker.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{worker.specialty}</p>
                {worker.distanceKm !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-400 font-medium">
                      à {worker.distanceKm < 1 ? `${Math.round(worker.distanceKm * 1000)}m` : `${worker.distanceKm.toFixed(1)}km`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid — 4 stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-[var(--bg-card)] rounded-xl p-2.5 border border-[var(--border)] text-center">
                <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <p className="text-base font-bold text-[var(--text-primary)]">{worker.rating.toFixed(1)}</p>
                <p className="text-[9px] text-[var(--text-muted)] font-medium">Note</p>
              </div>
              <div className="bg-[var(--bg-card)] rounded-xl p-2.5 border border-[var(--border)] text-center">
                <Briefcase className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-base font-bold text-[var(--text-primary)]">{worker.completedMissions || 0}</p>
                <p className="text-[9px] text-[var(--text-muted)] font-medium">Missions</p>
              </div>
              <div className="bg-[var(--bg-card)] rounded-xl p-2.5 border border-[var(--border)] text-center">
                <Shield className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className={clsx('text-base font-bold', reliabilityColor)}>{reliabilityRate}%</p>
                <p className="text-[9px] text-[var(--text-muted)] font-medium">Fiabilité</p>
              </div>
              <div className="bg-[var(--bg-card)] rounded-xl p-2.5 border border-[var(--border)] text-center">
                <MapPin className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-base font-bold text-[var(--text-primary)]">{worker.distanceKm?.toFixed(1) ?? '—'}</p>
                <p className="text-[9px] text-[var(--text-muted)] font-medium">km</p>
              </div>
            </div>

            {/* Reliability bar */}
            <div className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[var(--text-muted)]">Taux de fiabilité</span>
                <span className={clsx('text-xs font-bold', reliabilityColor)}>{reliabilityRate}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--bg-active)] rounded-full overflow-hidden">
                <motion.div
                  className={clsx('h-full rounded-full', reliabilityBg)}
                  initial={{ width: 0 }}
                  animate={{ width: `${reliabilityRate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Missions terminées sans incident / total missions
              </p>
            </div>

            {/* Skills / Compétences */}
            {worker.skills && worker.skills.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Compétences</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {worker.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Reviews */}
            {worker.recentReviews && worker.recentReviews.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Avis récents</span>
                </div>
                <div className="space-y-2">
                  {worker.recentReviews.slice(0, 3).map((review, i) => (
                    <div key={i} className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={clsx('w-3 h-3', review.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-600')} />
                          ))}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {new Date(review.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] italic">&ldquo;{review.comment}&rdquo;</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">— {review.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Employment category badge */}
            {worker.employmentCategory && (
              <div className={clsx(
                'rounded-xl p-3 border flex items-center gap-2',
                worker.employmentCategory === 'EXTRA'
                  ? 'bg-orange-500/10 border-orange-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'
              )}>
                <div className={clsx(
                  'w-2 h-2 rounded-full',
                  worker.employmentCategory === 'EXTRA' ? 'bg-orange-400' : 'bg-emerald-400'
                )} />
                <span className={clsx(
                  'text-xs font-bold',
                  worker.employmentCategory === 'EXTRA' ? 'text-orange-400' : 'text-emerald-400'
                )}>
                  {worker.employmentCategory === 'EXTRA'
                    ? 'Salarié temporaire — DPAE obligatoire'
                    : 'Auto-entrepreneur — Pas de DPAE'
                  }
                </span>
              </div>
            )}

            {/* DPAE GATE — bloquant pour EXTRA */}
            {requiresDPAE && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">Obligation légale : DPAE</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Ce prestataire intervient en tant que <strong>salarié temporaire</strong> (CDD d&apos;usage HCR).
                      En tant qu&apos;employeur, vous devez effectuer la DPAE
                      auprès de l&apos;URSSAF <strong>avant le début de la mission</strong>.
                    </p>
                    <p className="text-xs text-red-400 font-bold mt-2">
                      Amende : 1 056 € par salarié (art. R1227-1 Code du travail).
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer bg-[var(--bg-card)] rounded-lg p-3 border border-[var(--border)] hover:border-red-500/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={dpaeAcknowledged}
                    onChange={(e) => setDpaeAcknowledged(e.target.checked)}
                    className="w-4 h-4 text-red-500 focus:ring-red-500 rounded mt-0.5 shrink-0"
                  />
                  <span className="text-xs text-[var(--text-primary)] leading-relaxed">
                    Je m&apos;engage à effectuer la DPAE avant le début de la mission.
                  </span>
                </label>

                {dpaeAcknowledged && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <FileText className="w-3 h-3" />
                    <span>Vous pourrez effectuer la DPAE depuis le détail de la mission une fois confirmée.</span>
                  </div>
                )}
              </div>
            )}

            {/* Mission info */}
            <div className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Mission</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{mission.title}</p>
            </div>

            {/* Auto-confirm countdown (only for non-DPAE cases) */}
            {!requiresDPAE && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Clock className="w-3 h-3" />
                <span>Confirmation automatique dans {autoConfirmCountdown}s</span>
              </div>
            )}

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
                disabled={!canConfirm || isConfirming || isRefusing}
                className={clsx(
                  'flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                  canConfirm
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25'
                    : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                )}
              >
                {isConfirming ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {requiresDPAE && !dpaeAcknowledged ? 'Engagement DPAE requis' : 'Confirmer'}
              </button>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>,
    document.body
  );
}
