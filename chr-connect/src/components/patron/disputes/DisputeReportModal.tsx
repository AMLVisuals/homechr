'use client';

import { useState } from 'react';
import { X, AlertTriangle, Camera, Send, ShieldAlert, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { DisputeReason, DISPUTE_REASONS } from '@/types/missions';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';

interface DisputeReportModalProps {
  missionId: string;
  missionTitle: string;
  providerName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DisputeReportModal({
  missionId,
  missionTitle,
  providerName,
  isOpen,
  onClose,
}: DisputeReportModalProps) {
  const { syncReportDispute } = useMissionsStore();
  const { syncAddNotification } = useNotificationsStore();
  const [step, setStep] = useState<'REASON' | 'DETAILS' | 'SUCCESS'>('REASON');
  const [selectedReason, setSelectedReason] = useState<DisputeReason | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reasonIcons: Partial<Record<DisputeReason, typeof AlertTriangle>> = {
    NO_SHOW: ShieldAlert,
    QUALITY_ISSUE: AlertTriangle,
    DAMAGE: AlertTriangle,
  };

  const handleSubmit = async () => {
    if (!selectedReason || !description.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const result = await syncReportDispute(
      missionId,
      selectedReason,
      description.trim(),
      photos.length > 0 ? photos : undefined
    );

    if (!result.ok) {
      setSubmitError(result.error || 'Erreur serveur');
      setSubmitting(false);
      return;
    }

    syncAddNotification({
      title: 'Litige ouvert',
      description: `Votre signalement pour "${missionTitle}" a été enregistré. Notre équipe va l'examiner.`,
      type: 'dispute',
    });

    if (selectedReason === 'NO_SHOW') {
      syncAddNotification({
        title: 'Remplacement gratuit',
        description: `Suite au no-show sur "${missionTitle}", vous pouvez créer une mission de remplacement gratuitement.`,
        type: 'mission',
      });
    }

    setSubmitting(false);
    setStep('SUCCESS');
  };

  const handleClose = () => {
    setStep('REASON');
    setSelectedReason(null);
    setDescription('');
    setPhotos([]);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotos(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
      />
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px] md:max-h-[85vh] md:rounded-3xl bg-[var(--bg-card)] border-0 md:border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col rounded-t-3xl"
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Signaler un problème</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{missionTitle}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Reason */}
            {step === 'REASON' && (
              <motion.div
                key="reason"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Quel problème avez-vous rencontré ?
                </p>

                {(Object.entries(DISPUTE_REASONS) as [DisputeReason, string][]).map(([key, label]) => {
                  const Icon = reasonIcons[key] || AlertTriangle;
                  const isNoShow = key === 'NO_SHOW';
                  return (
                    <button
                      key={key}
                      onClick={() => { setSelectedReason(key); setStep('DETAILS'); }}
                      className={clsx(
                        'w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3 group',
                        isNoShow
                          ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40'
                          : 'border-[var(--border)] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] hover:border-[var(--border-strong)]'
                      )}
                    >
                      <div className={clsx(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        isNoShow ? 'bg-red-500/10' : 'bg-[var(--bg-active)]'
                      )}>
                        <Icon className={clsx('w-4 h-4', isNoShow ? 'text-red-400' : 'text-[var(--text-muted)]')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'text-sm font-bold',
                          isNoShow ? 'text-red-400' : 'text-[var(--text-primary)]'
                        )}>
                          {label}
                        </p>
                        {isNoShow && (
                          <p className="text-[10px] text-red-400/70 mt-0.5 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Mission de remplacement gratuite
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 'DETAILS' && selectedReason && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                {/* Selected reason badge */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep('REASON')}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    ← Changer le motif
                  </button>
                </div>
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm font-bold text-red-400">{DISPUTE_REASONS[selectedReason]}</p>
                  {providerName && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">Prestataire : {providerName}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                    Décrivez le problème
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Expliquez en détail ce qui s'est passé..."
                    rows={4}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-red-500/50 placeholder:text-[var(--text-muted)]"
                    autoFocus
                  />
                </div>

                {/* Photos */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                    Photos (optionnel)
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-red-500/30 bg-[var(--bg-hover)] flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <Camera className="w-5 h-5 text-[var(--text-muted)] mb-1" />
                      <span className="text-[9px] text-[var(--text-muted)] font-bold">Ajouter</span>
                      <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                    </label>
                    {photos.map((url, i) => (
                      <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* No-show info */}
                {selectedReason === 'NO_SHOW' && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-400">Remplacement gratuit</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        En cas de no-show confirmé, vous pourrez créer une mission de remplacement sans frais de mise en relation.
                      </p>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {submitError}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!description.trim() || submitting}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Envoyer le signalement
                </button>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 'SUCCESS' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Signalement enregistré</h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
                  Notre équipe support va examiner votre demande et vous contacter dans les plus brefs délais.
                </p>

                {selectedReason === 'NO_SHOW' && (
                  <div className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">Mission de remplacement</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Vous pouvez créer une nouvelle mission gratuitement depuis le tableau de bord.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text-primary)] transition-colors"
                >
                  Fermer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
