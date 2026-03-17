'use client';

import { motion } from 'framer-motion';
import {
  Zap, FileText, Infinity, CheckCircle2, Crown, Headphones, Shield,
  Clock, Building2, Users, Wrench, Bell, Receipt, Star,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStore, type SubscriptionTier } from '@/store/useStore';
import { APP_CONFIG } from '@/config/appConfig';

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

interface TierFeature {
  label: string;
  included: boolean;
}

interface TierDef {
  id: SubscriptionTier;
  name: string;
  price: string;
  priceNote: string;
  icon: typeof Crown;
  gradient: string;
  borderColor: string;
  features: TierFeature[];
  cta: string;
  popular?: boolean;
}

const TIERS: TierDef[] = [
  {
    id: 'FREE',
    name: 'Gratuit',
    price: `${APP_CONFIG.MISSION_FEE}€`,
    priceNote: 'par mission',
    icon: Zap,
    gradient: 'from-gray-500 to-gray-600',
    borderColor: 'border-[var(--border)]',
    cta: 'Plan actuel',
    features: [
      { label: 'Création de missions à l\'unité', included: true },
      { label: 'Accès aux workers vérifiés', included: true },
      { label: 'Dispatch standard', included: true },
      { label: 'Suivi mission temps réel', included: true },
      { label: 'Gestion équipements (garage)', included: true },
      { label: 'Avis post-mission', included: true },
      { label: 'Facture PDF simple', included: true },
      { label: 'Missions illimitées', included: false },
      { label: 'Facturation Factur-X', included: false },
      { label: 'DPAE + contrat CDD auto', included: false },
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: `${APP_CONFIG.PRO_MONTHLY_PRICE}€`,
    priceNote: '/mois',
    icon: Star,
    gradient: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-500/30',
    cta: 'Passer Pro',
    popular: true,
    features: [
      { label: 'Tout le Gratuit +', included: true },
      { label: 'Missions illimitées', included: true },
      { label: 'Facturation électronique Factur-X', included: true },
      { label: 'Alertes maintenance préventive', included: true },
      { label: 'Alertes expiration documents workers', included: true },
      { label: 'Historique complet interventions', included: true },
      { label: 'Support prioritaire (24h)', included: true },
      { label: 'DPAE + contrat CDD auto', included: false },
      { label: 'Fiches de paie', included: false },
      { label: 'Multi-établissements', included: false },
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: `${APP_CONFIG.PREMIUM_MONTHLY_PRICE}€`,
    priceNote: '/mois',
    icon: Crown,
    gradient: 'from-amber-400 to-yellow-500',
    borderColor: 'border-amber-500/30',
    cta: 'Passer Premium',
    features: [
      { label: 'Tout le Pro +', included: true },
      { label: 'DPAE + contrat CDD auto (API URSSAF)', included: true },
      { label: `${APP_CONFIG.PREMIUM_PAYSLIP_INCLUDED} fiches de paie incluses/mois`, included: true },
      { label: `Fiche supplémentaire : ${APP_CONFIG.PREMIUM_PAYSLIP_EXTRA_FEE}€/fiche`, included: true },
      { label: 'Garantie intervention 2h (techniciens)', included: true },
      { label: 'Remplacement gratuit si no-show', included: true },
      { label: 'Multi-établissements', included: true },
      { label: 'Support dédié (2h, téléphone)', included: true },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function PremiumTab() {
  const { subscriptionTier, setSubscriptionTier } = useStore();

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">
            Choisissez votre offre
          </h1>
          <p className="text-sm md:text-base text-[var(--text-secondary)]">
            Simplifiez la gestion de votre établissement CHR
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {TIERS.map((tier, i) => {
            const isCurrentTier = subscriptionTier === tier.id;
            const Icon = tier.icon;
            const isUpgrade = TIERS.findIndex(t => t.id === subscriptionTier) < i;
            const isDowngrade = TIERS.findIndex(t => t.id === subscriptionTier) > i;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={clsx(
                  'relative rounded-2xl md:rounded-3xl border overflow-hidden flex flex-col',
                  isCurrentTier ? 'ring-2 ring-blue-500/50' : '',
                  tier.borderColor,
                  tier.popular && !isCurrentTier ? 'md:-mt-3 md:mb-0' : ''
                )}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
                    Le plus populaire
                  </div>
                )}

                {/* Current tier badge */}
                {isCurrentTier && (
                  <div className="bg-green-500/10 text-green-400 text-center py-1.5 text-xs font-bold uppercase tracking-wider border-b border-green-500/20">
                    Plan actuel
                  </div>
                )}

                <div className="p-5 md:p-6 flex-1 flex flex-col">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={clsx(
                      'w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg shrink-0',
                      tier.gradient,
                      tier.id === 'PREMIUM' ? 'shadow-amber-500/20' : tier.id === 'PRO' ? 'shadow-blue-500/20' : 'shadow-gray-500/10'
                    )}>
                      <Icon className={clsx('w-5 h-5', tier.id === 'PREMIUM' ? 'text-black' : 'text-white')} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{tier.name}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[var(--text-primary)]">{tier.price}</span>
                      <span className="text-sm text-[var(--text-muted)]">{tier.priceNote}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 flex-1 mb-6">
                    {tier.features.map((feature, fi) => (
                      <div key={fi} className="flex items-start gap-2">
                        {feature.included ? (
                          <CheckCircle2 className={clsx(
                            'w-4 h-4 shrink-0 mt-0.5',
                            tier.id === 'PREMIUM' ? 'text-amber-400' : tier.id === 'PRO' ? 'text-blue-400' : 'text-green-400'
                          )} />
                        ) : (
                          <div className="w-4 h-4 shrink-0 mt-0.5 rounded-full border border-[var(--border)]" />
                        )}
                        <span className={clsx(
                          'text-sm',
                          feature.included ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                        )}>
                          {feature.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  {isCurrentTier ? (
                    <div className="py-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] text-center text-sm font-bold text-[var(--text-muted)]">
                      Plan actuel
                    </div>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => setSubscriptionTier(tier.id)}
                      className={clsx(
                        'w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg',
                        tier.id === 'PREMIUM'
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400 shadow-amber-500/20'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 shadow-blue-500/20'
                      )}
                    >
                      <Zap className="w-4 h-4" />
                      {tier.cta}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSubscriptionTier(tier.id)}
                      className="w-full py-3 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      Rétrograder
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ / Trust Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4"
        >
          {[
            { icon: Shield, label: 'Sans engagement', desc: 'Changez ou annulez à tout moment' },
            { icon: Receipt, label: 'Facturation claire', desc: 'Un seul prélèvement mensuel, facture Factur-X' },
            { icon: Headphones, label: 'Support réactif', desc: 'Équipe disponible par chat et téléphone' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
              <item.icon className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{item.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Dev Toggle */}
        <div className="flex justify-center gap-2 pt-4 pb-8">
          {(['FREE', 'PRO', 'PREMIUM'] as SubscriptionTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => setSubscriptionTier(tier)}
              className={clsx(
                'px-3 py-1.5 rounded-lg border border-dashed text-xs transition-colors',
                subscriptionTier === tier
                  ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              Dev: {tier}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
