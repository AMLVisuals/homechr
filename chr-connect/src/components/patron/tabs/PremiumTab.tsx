'use client';

import { motion } from 'framer-motion';
import { Zap, FileText, Infinity, Package, CheckCircle2, Crown, Headphones, ScrollText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { APP_CONFIG } from '@/config/appConfig';

const PREMIUM_FEATURES = [
  { icon: Infinity, label: 'Missions illimitées', desc: `Plus de frais de ${APP_CONFIG.MISSION_FEE}€ par mise en relation — créez autant de missions que nécessaire` },
  { icon: FileText, label: 'Fiches de paie', desc: 'Création de bulletins de paie complets en quelques clics' },
  { icon: ScrollText, label: 'DPAE', desc: 'Déclaration préalable à l\'embauche URSSAF en quelques clics' },
  { icon: Package, label: 'Gestion de stock', desc: 'Suivi inventaire par établissement avec alertes seuil bas' },
  { icon: Headphones, label: 'Support dédié', desc: 'Un manager dédié à votre écoute + chat prioritaire' },
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
      <div className="h-full overflow-y-auto p-3 sm:p-4 lg:p-8 flex flex-col">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3 sm:space-y-4"
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto">
              <Crown className="w-7 h-7 sm:w-10 sm:h-10 text-black" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                Vous êtes Premium
              </h1>
              <p className="text-[var(--text-secondary)] text-sm sm:text-base mt-1">
                Profitez de toutes les fonctionnalités.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--bg-card)] border border-amber-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--text-primary)] text-base sm:text-lg">CHR Connect Premium</h3>
                <p className="text-[var(--text-secondary)] text-xs sm:text-sm">Abonnement actif</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{APP_CONFIG.PREMIUM_MONTHLY_PRICE}€</span>
                <span className="text-[var(--text-secondary)] text-xs sm:text-sm">/mois</span>
              </div>
            </div>

            <div className="space-y-2">
              {PREMIUM_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-[var(--bg-hover)]">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{feature.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <button
                onClick={handleCancel}
                className="text-xs sm:text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                Annuler l'abonnement
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg border border-dashed border-amber-500/30 text-xs text-amber-400/60 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
              >
                Dev: Repasser Gratuit
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Not subscribed — sales page
  return (
    <div className="h-full overflow-y-auto p-4 lg:p-8 flex flex-col justify-center">
      <div className="max-w-lg mx-auto w-full space-y-6">
        {/* Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-amber-500/30 rounded-3xl overflow-hidden shadow-xl shadow-amber-900/10 relative"
        >
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Crown className="w-8 h-8 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">CHR Connect Premium</h2>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-green-400">Gratuit</span>
                  <span className="text-[var(--text-secondary)] text-sm">pendant {APP_CONFIG.PREMIUM_TRIAL_DAYS} jours</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">puis {APP_CONFIG.PREMIUM_MONTHLY_PRICE}€/mois — sans engagement</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-5 pt-5 border-t border-[var(--border)]">
              {PREMIUM_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-amber-500 shrink-0" />
                  <span className="text-base font-medium text-[var(--text-primary)]">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleUpgrade}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-base hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Essayer gratuitement {APP_CONFIG.PREMIUM_TRIAL_DAYS} jours
              </button>
              <p className="text-xs text-[var(--text-muted)] text-center">Aucune carte bancaire requise</p>
            </div>
          </div>
        </motion.div>

        {/* Dev Mode Toggle */}
        <div className="flex justify-center">
          <button
            onClick={handleUpgrade}
            className="px-4 py-2 rounded-lg border border-dashed border-amber-500/30 text-xs text-amber-400/60 hover:text-amber-400 transition-colors"
          >
            Dev: Passer Premium
          </button>
        </div>
      </div>
    </div>
  );
}
