'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, FileText, Download, Clock, Server, CheckCircle2, Crown } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface PremiumUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREMIUM_FEATURES = [
  { icon: FileText, label: 'Creation de bulletins de paie', desc: 'Generez des fiches de paie completes en quelques clics' },
  { icon: Download, label: 'Export PDF professionnel', desc: 'Telechargez des bulletins au format PDF officiel' },
  { icon: Clock, label: 'Historique complet', desc: 'Accedez a l\'historique illimite de tous vos bulletins' },
  { icon: Server, label: 'API externe', desc: 'Connectez PayFit, Silae ou tout autre fournisseur de paie' },
];

export default function PremiumUpsellModal({ isOpen, onClose }: PremiumUpsellModalProps) {
  const { setPremium } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleUpgrade = () => {
    setPremium(true);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:max-h-[90vh] md:rounded-3xl bg-[var(--bg-sidebar)] border border-[var(--border)] shadow-2xl z-[9999] flex flex-col overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="relative p-6 pb-8 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Crown className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">CHR Connect Pro</h2>
                  <p className="text-sm text-amber-500">Debloquez toutes les fonctionnalites</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--text-primary)]">29€</span>
                <span className="text-[var(--text-secondary)]">/mois</span>
              </div>
            </div>

            {/* Features */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {PREMIUM_FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">{feature.label}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="p-6 border-t border-[var(--border)] space-y-3">
              <button
                onClick={handleUpgrade}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-sm hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Passer au Premium
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Peut-etre plus tard
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
