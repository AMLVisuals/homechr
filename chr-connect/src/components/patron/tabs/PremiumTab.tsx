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
                <span className="text-2xl font-bold text-[var(--text-primary)]">{APP_CONFIG.PREMIUM_MONTHLY_PRICE}€</span>
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

            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <button
                onClick={handleCancel}
                className="text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors"
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
    <div className="h-full overflow-y-auto p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
            Passez à la vitesse supérieure
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Supprimez les frais de mise en relation et débloquez toutes les fonctionnalités avancées.
          </p>
        </div>

        {/* Plan Card */}
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--bg-card)] border border-amber-500/30 rounded-3xl overflow-hidden shadow-xl shadow-amber-900/10 relative"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">{APP_CONFIG.PREMIUM_TRIAL_DAYS}J GRATUITS</div>
            </div>
            <div className="p-8 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Crown className="w-8 h-8 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">CHR Connect Premium</h2>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-bold text-green-400">Gratuit</span>
                  <span className="text-[var(--text-secondary)]">pendant {APP_CONFIG.PREMIUM_TRIAL_DAYS} jours</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-1">puis {APP_CONFIG.PREMIUM_MONTHLY_PRICE}€/mois — sans engagement</p>
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
                Essayer gratuitement {APP_CONFIG.PREMIUM_TRIAL_DAYS} jours
              </button>
              <p className="text-xs text-[var(--text-muted)] text-center">Aucune carte bancaire requise</p>
            </div>
          </motion.div>
        </div>

        {/* Dev Mode Toggle */}
        <div className="flex justify-center">
          <button
            onClick={handleUpgrade}
            className="px-4 py-2 rounded-lg border border-dashed border-amber-500/30 text-xs text-amber-400/60 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
          >
            Dev: Passer Premium
          </button>
        </div>
      </div>
    </div>
  );
}
