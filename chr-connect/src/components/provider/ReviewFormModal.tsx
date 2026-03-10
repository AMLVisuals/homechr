import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send } from 'lucide-react';
import { ProviderProfile } from '../../types/provider';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderProfile;
  onSubmit: (rating: number, comment: string) => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  isOpen,
  onClose,
  provider,
  onSubmit
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit(rating, comment);
    onClose();
    // Reset form
    setRating(0);
    setComment('');
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[9999] w-full md:w-[560px] bg-[var(--bg-sidebar)] border border-[var(--border)] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Noter la prestation</h2>
            <p className="text-sm text-[var(--text-secondary)]">Pour {provider.firstName} {provider.lastName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-active)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating Stars */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Votre note globale</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'fill-transparent text-[var(--text-muted)]'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="h-5 text-sm font-medium text-yellow-500">
              {rating === 1 && "À éviter"}
              {rating === 2 && "Peu satisfaisant"}
              {rating === 3 && "Correct"}
              {rating === 4 && "Très bien"}
              {rating === 5 && "Excellent !"}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Votre avis</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Racontez votre expérience avec ce prestataire..."
              className="w-full h-32 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={rating === 0}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Publier l'avis
          </button>
        </form>
      </motion.div>
    </>,
    document.body
  );
};
