'use client';

import { useState } from 'react';
import { X, Star, Send, Camera, Video, Eye, EyeOff, UserCircle2, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';

interface PostMissionReviewModalProps {
  missionId: string;
  missionTitle: string;
  providerName: string;
  providerAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Simulated worker review (mock — in real app, worker submits their own review)
function generateMockWorkerReview(patronName: string) {
  const templates = [
    { rating: 5, comment: 'Patron très professionnel, accueil chaleureux. Les conditions de travail étaient excellentes. Je recommande !' },
    { rating: 4, comment: 'Bonne expérience. L\'établissement est bien organisé, équipe agréable.' },
    { rating: 5, comment: 'Parfait. Communication claire, paiement rapide. Un plaisir de travailler ici.' },
    { rating: 4, comment: 'Mission intéressante, bon accueil. Quelques détails à améliorer sur le briefing initial.' },
  ];
  const pick = templates[Math.floor(Math.random() * templates.length)];
  return {
    rating: pick.rating,
    comment: pick.comment,
    author: 'Le prestataire',
    date: new Date().toISOString(),
  };
}

export default function PostMissionReviewModal({
  missionId,
  missionTitle,
  providerName,
  providerAvatar,
  isOpen,
  onClose,
}: PostMissionReviewModalProps) {
  const { addReview } = useMissionsStore();
  const { addNotification } = useNotificationsStore();

  const [step, setStep] = useState<'RATE' | 'REVEAL' | 'DONE'>('RATE');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Worker's mock review (generated on reveal)
  const [workerReview, setWorkerReview] = useState<{ rating: number; comment: string } | null>(null);

  if (!isOpen) return null;

  const ratingLabels = ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bon', 'Excellent'];
  const displayRating = hoverRating || rating;

  const handleSubmit = () => {
    if (rating === 0) return;

    // Save patron's review
    addReview(missionId, {
      rating,
      comment: comment.trim(),
      photos,
      videos: [],
      date: new Date().toISOString(),
    });

    // Generate mock worker review for simultaneous reveal
    const mockReview = generateMockWorkerReview('Le patron');
    setWorkerReview(mockReview);

    addNotification({
      title: 'Avis envoyé',
      description: `Votre avis sur "${missionTitle}" a été enregistré.`,
      type: 'mission',
    });

    setStep('REVEAL');
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

  const handleClose = () => {
    setStep('RATE');
    setRating(0);
    setHoverRating(0);
    setComment('');
    setPhotos([]);
    setWorkerReview(null);
    onClose();
  };

  const renderStars = (value: number, size: 'sm' | 'lg' = 'lg', interactive = false) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={clsx(
            'transition-transform',
            interactive && 'hover:scale-110 cursor-pointer',
            !interactive && 'cursor-default'
          )}
        >
          <Star
            className={clsx(
              'transition-colors',
              size === 'lg' ? 'w-10 h-10' : 'w-5 h-5',
              value >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-600'
            )}
          />
        </button>
      ))}
    </div>
  );

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
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {step === 'RATE' ? 'Noter la prestation' : 'Avis croisés'}
                </h2>
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
            {/* Step 1: Rate */}
            {step === 'RATE' && (
              <motion.div
                key="rate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Provider info */}
                <div className="flex items-center gap-3 justify-center">
                  {providerAvatar ? (
                    <img src={providerAvatar} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-[var(--border)]" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
                      <UserCircle2 className="w-8 h-8 text-[var(--text-muted)]" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{providerName}</p>
                    <p className="text-xs text-[var(--text-muted)]">Comment s&apos;est passée la prestation ?</p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex flex-col items-center gap-2">
                  {renderStars(displayRating, 'lg', true)}
                  <p className={clsx(
                    'text-sm font-bold transition-colors h-5',
                    displayRating >= 4 ? 'text-green-400' : displayRating >= 3 ? 'text-amber-400' : displayRating >= 1 ? 'text-red-400' : 'text-transparent'
                  )}>
                    {ratingLabels[displayRating] || ''}
                  </p>
                </div>

                {/* Simultaneous reveal notice */}
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <EyeOff className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="text-xs text-blue-400">
                    <strong>Révélation simultanée</strong> — Votre avis et celui du prestataire seront dévoilés en même temps.
                  </p>
                </div>

                {/* Comment */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                    Commentaire
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Décrivez votre expérience... (optionnel)"
                    rows={3}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-amber-500/50 placeholder:text-[var(--text-muted)]"
                  />
                </div>

                {/* Photos */}
                <div className="flex gap-2 flex-wrap">
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-amber-500/30 bg-[var(--bg-hover)] flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Camera className="w-4 h-4 text-[var(--text-muted)] mb-0.5" />
                    <span className="text-[8px] text-[var(--text-muted)] font-bold">Photo</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                  </label>
                  {photos.map((url, i) => (
                    <div key={i} className="w-16 h-16 rounded-xl overflow-hidden relative group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Envoyer mon avis
                </button>
              </motion.div>
            )}

            {/* Step 2: Simultaneous Reveal */}
            {step === 'REVEAL' && workerReview && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Reveal header */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3"
                  >
                    <Eye className="w-6 h-6 text-green-400" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Avis dévoilés !</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Les deux avis sont maintenant visibles</p>
                </div>

                {/* Patron's review */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--text-primary)]">Votre avis</p>
                      <p className="text-[10px] text-[var(--text-muted)]">sur {providerName}</p>
                    </div>
                    {renderStars(rating, 'sm')}
                  </div>
                  {comment && (
                    <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{comment}&rdquo;</p>
                  )}
                  {!comment && (
                    <p className="text-xs text-[var(--text-muted)] italic">Pas de commentaire</p>
                  )}
                </motion.div>

                {/* Worker's review */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="p-4 rounded-2xl bg-[var(--bg-hover)] border border-amber-500/20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                      {providerAvatar ? (
                        <img src={providerAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <UserCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--text-primary)]">Avis du prestataire</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{providerName} sur votre établissement</p>
                    </div>
                    {renderStars(workerReview.rating, 'sm')}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{workerReview.comment}&rdquo;</p>
                </motion.div>

                {/* Close */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={handleClose}
                  className="w-full py-3.5 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text-primary)] transition-colors"
                >
                  Fermer
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
