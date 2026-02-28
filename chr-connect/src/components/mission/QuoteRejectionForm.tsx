'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuoteRejectionFormProps {
  missionTitle: string;
  quoteTotal: number;
  displacementFeeAmount: number;
  onSubmit: (rejection: {
    reason: 'too_expensive' | 'not_needed';
    comment: string;
    rejectedAt: string;
    displacementFeeApplied: boolean;
    displacementFeeAmount: number;
  }) => void;
  onCancel: () => void;
}

export default function QuoteRejectionForm({
  missionTitle,
  quoteTotal,
  displacementFeeAmount,
  onSubmit,
  onCancel
}: QuoteRejectionFormProps) {
  const [reason, setReason] = useState<'too_expensive' | 'not_needed' | null>(null);
  const [comment, setComment] = useState('');
  const [acceptFees, setAcceptFees] = useState(false);

  const canSubmit = reason && comment.trim().length >= 10 && acceptFees;

  const handleSubmit = () => {
    if (!reason || !canSubmit) return;
    onSubmit({
      reason,
      comment: comment.trim(),
      rejectedAt: new Date().toISOString(),
      displacementFeeApplied: true,
      displacementFeeAmount
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-lg bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)]">Refuser le devis</h3>
              <p className="text-xs text-[var(--text-muted)]">{missionTitle} — {quoteTotal.toFixed(2)} € TTC</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-[var(--bg-active)] rounded-full">
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Warning banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-sm text-amber-400 font-medium">
              Vous avez fait déplacer un professionnel. Merci d'expliquer la raison de votre refus.
            </p>
          </div>

          {/* Reason selection */}
          <div>
            <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
              Raison du refus *
            </label>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                reason === 'too_expensive'
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}>
                <input
                  type="radio"
                  name="reason"
                  checked={reason === 'too_expensive'}
                  onChange={() => setReason('too_expensive')}
                  className="w-4 h-4 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-[var(--text-primary)]">Le montant me semble trop élevé</span>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                reason === 'not_needed'
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}>
                <input
                  type="radio"
                  name="reason"
                  checked={reason === 'not_needed'}
                  onChange={() => setReason('not_needed')}
                  className="w-4 h-4 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-[var(--text-primary)]">Je n'en ai finalement plus besoin</span>
              </label>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
              Commentaire obligatoire *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Expliquez pourquoi vous refusez ce devis (10 caractères minimum)..."
              className="w-full h-28 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-red-500 resize-none"
            />
            {comment.length > 0 && comment.trim().length < 10 && (
              <p className="text-xs text-red-400 mt-1">Minimum 10 caractères ({comment.trim().length}/10)</p>
            )}
          </div>

          {/* Displacement fee banner */}
          <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[var(--text-primary)]">Frais de déplacement</span>
              <span className="text-lg font-bold text-[var(--text-primary)]">{displacementFeeAmount.toFixed(2)} €</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Ces frais couvrent le déplacement du professionnel sur votre site. Ils sont dus même en cas de refus du devis.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptFees}
                onChange={(e) => setAcceptFees(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-red-500 focus:ring-red-500 rounded"
              />
              <span className="text-sm text-[var(--text-primary)]">
                J'accepte les frais de déplacement de {displacementFeeAmount.toFixed(2)} €
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--border)] flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            Confirmer le refus
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
