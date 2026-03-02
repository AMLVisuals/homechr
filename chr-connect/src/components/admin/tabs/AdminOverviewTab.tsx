'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Briefcase, UserPlus, Euro, CreditCard, BarChart3, Star } from 'lucide-react';
import { MOCK_REVENUE, MOCK_DASHBOARD_STATS } from '@/data/mockAdminData';

const statCards = [
  {
    label: 'CA du mois',
    value: `${MOCK_REVENUE.caMTD.toLocaleString('fr-FR')} €`,
    change: `+${MOCK_REVENUE.growthPercent}%`,
    icon: Euro,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    label: 'Abonnés Premium',
    value: MOCK_DASHBOARD_STATS.premiumSubscribers.toString(),
    change: null,
    icon: CreditCard,
    gradient: 'from-amber-400 to-yellow-500',
  },
  {
    label: 'Missions ce mois',
    value: MOCK_DASHBOARD_STATS.missionsThisMonth.toString(),
    change: null,
    icon: Briefcase,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    label: 'Nouveaux inscrits',
    value: `${MOCK_DASHBOARD_STATS.newUsersThisWeek}/sem`,
    change: null,
    icon: UserPlus,
    gradient: 'from-purple-500 to-pink-500',
  },
];

const revenueDetails = [
  { label: 'Frais de mise en relation', value: MOCK_REVENUE.matchingFees },
  { label: 'Abonnements', value: MOCK_REVENUE.subscriptionRevenue },
  { label: 'Commissions', value: MOCK_REVENUE.commissions },
  { label: 'MRR', value: MOCK_REVENUE.mrr },
];

export default function AdminOverviewTab() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Vue d&apos;ensemble</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Indicateurs clés de la plateforme</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 relative overflow-hidden"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-10 blur-2xl rounded-full -mr-6 -mt-6`} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{card.value}</span>
              {card.change && (
                <span className="text-xs font-medium text-emerald-500 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  {card.change}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-lg text-[var(--text-primary)]">Revenus détaillés</h2>
          </div>
          <div className="space-y-4">
            {revenueDetails.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {item.value.toLocaleString('fr-FR')} €
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--text-primary)]">Total CA MTD</span>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              {MOCK_REVENUE.caMTD.toLocaleString('fr-FR')} €
            </span>
          </div>
        </motion.div>

        {/* Platform Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-lg text-[var(--text-primary)]">Activité plateforme</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Utilisateurs total</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{MOCK_DASHBOARD_STATS.totalUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Patrons</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{MOCK_DASHBOARD_STATS.patrons}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Workers</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{MOCK_DASHBOARD_STATS.workers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Missions actives</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{MOCK_DASHBOARD_STATS.activeMissions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Note moyenne</span>
              <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {MOCK_DASHBOARD_STATS.avgRating}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
