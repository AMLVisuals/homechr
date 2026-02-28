'use client';

import { motion } from 'framer-motion';
import { Zap, FileText, Infinity, Package, CheckCircle2, Crown, X, Headphones, Shield, Star, ScrollText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';

const PREMIUM_FEATURES = [
  { icon: Infinity, label: 'Missions illimitées', desc: 'Plus de frais de 20€ par mise en relation — créez autant de missions que nécessaire' },
  { icon: FileText, label: 'Fiches de paie', desc: 'Création de bulletins de paie complets en quelques clics' },
  { icon: ScrollText, label: 'DPAE + contrat de travail', desc: 'Déclaration URSSAF automatique + CDD d\'usage auto-généré' },
  { icon: Package, label: 'Gestion de stock', desc: 'Suivi inventaire par établissement avec alertes seuil bas' },
  { icon: Headphones, label: 'Support dédié', desc: 'Un manager dédié à votre écoute + chat prioritaire' },
  { icon: Shield, label: 'Garantie intervention', desc: 'Remplacement garanti sous 2h en cas d\'annulation prestataire' },
];

const COMPARISON_ROWS = [
  { label: 'Création de missions', free: '20€/mission', premium: 'Illimité, 0€' },
  { label: 'Gestion des équipements', free: true, premium: true },
  { label: 'Planning & calendrier', free: true, premium: true },
  { label: 'Gestion d\'équipe', free: true, premium: true },
  { label: 'Suivi des factures', free: true, premium: true },
  { label: 'Fiches de paie', free: false, premium: true },
  { label: 'DPAE + contrat CDD auto', free: false, premium: true },
  { label: 'Gestion de stock', free: false, premium: true },
  { label: 'Support dédié & prioritaire', free: false, premium: true },
  { label: 'Garantie intervention 2h', free: false, premium: true },
];

export default function PremiumTab() {
  const { isPremium, setPremium } = useStore();

  const handleUpgrade = () => {
    setPremium(true);
  };

  const handleCancel = () => {
    setPremium(false);
  };

  // Already subscribed
  if (isPremium) {
    return (
      <div className="h-full overflow-y-auto p-4 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto">
              <Crown className="w-10 h-10 text-black" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
                Vous êtes Premium
              </h1>
              <p className="text-[var(--text-secondary)] text-lg mt-2">
                Merci pour votre confiance. Profitez de toutes les fonctionnalités.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--bg-card)] border border-amber-500/20 rounded-3xl p-6 md:p-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--text-primary)] text-lg">CHR Connect Premium</h3>
                <p className="text-[var(--text-secondary)] text-sm">Abonnement actif</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[var(--text-primary)]">100€</span>
                <span className="text-[var(--text-secondary)] text-sm">/mois</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PREMIUM_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-hover)]">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{feature.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <button
                onClick={handleCancel}
                className="text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                Annuler l'abonnement
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Not subscribed — sales page
  return (
    <div className="h-full overflow-y-auto p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border border-amber-500/30 text-amber-400 text-sm font-bold mx-auto"
          >
            <Star className="w-4 h-4" />
            Offre de lancement
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
            Passez à la vitesse supérieure
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Supprimez les frais de mise en relation et débloquez toutes les fonctionnalités avancées.
          </p>
        </div>

        {/* Plan Card + Features */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--bg-card)] border border-amber-500/30 rounded-3xl overflow-hidden shadow-xl shadow-amber-900/10 relative"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">POPULAIRE</div>
            </div>
            <div className="p-8 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Crown className="w-8 h-8 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">CHR Connect Premium</h2>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold text-[var(--text-primary)]">100€</span>
                  <span className="text-[var(--text-secondary)]">/mois</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                {PREMIUM_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)]">{feature.label}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpgrade}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Passer au Premium
              </button>
            </div>
          </motion.div>

          {/* Features Detail */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Pourquoi passer Premium ?</h3>
            <div className="grid gap-4">
              {PREMIUM_FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] flex gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-[var(--text-primary)]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)]">{feature.label}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden"
        >
          <div className="p-6 md:p-8 border-b border-[var(--border)]">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Comparatif des offres</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Tout ce qui est inclus dans chaque formule</p>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_80px] md:grid-cols-[1fr_120px_120px] px-6 md:px-8 py-4 bg-[var(--bg-hover)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <span>Fonctionnalité</span>
            <span className="text-center">Gratuit</span>
            <span className="text-center bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Premium</span>
          </div>

          {/* Table Rows */}
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={i}
              className={clsx(
                "grid grid-cols-[1fr_80px_80px] md:grid-cols-[1fr_120px_120px] px-6 md:px-8 py-3.5 items-center",
                i % 2 === 0 ? "bg-transparent" : "bg-[var(--bg-hover)]/50",
                i < COMPARISON_ROWS.length - 1 && "border-b border-[var(--border)]"
              )}
            >
              <span className="text-sm text-[var(--text-primary)] font-medium">{row.label}</span>
              <span className="flex justify-center">
                {typeof row.free === 'string' ? (
                  <span className="text-xs font-medium text-orange-400">{row.free}</span>
                ) : row.free ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                )}
              </span>
              <span className="flex justify-center">
                {typeof row.premium === 'string' ? (
                  <span className="text-xs font-medium text-amber-400">{row.premium}</span>
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                )}
              </span>
            </div>
          ))}

          {/* CTA Bottom */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border-t border-amber-500/20">
            <button
              onClick={handleUpgrade}
              className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mx-auto"
            >
              <Zap className="w-5 h-5" />
              Commencer l'essai gratuit
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
