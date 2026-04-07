'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Briefcase, UserPlus, Euro, CreditCard, BarChart3, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DashboardStats } from '@/types/admin';

export default function AdminOverviewTab() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    patrons: 0,
    workers: 0,
    premiumSubscribers: 0,
    activeMissions: 0,
    missionsThisMonth: 0,
    newUsersThisWeek: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday-based
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - dayOfWeek);
        firstDayOfWeek.setHours(0, 0, 0, 0);
        const firstDayOfWeekISO = firstDayOfWeek.toISOString();

        const [
          totalUsersRes,
          patronsRes,
          workersRes,
          premiumRes,
          missionsMonthRes,
          activeMissionsRes,
          newUsersWeekRes,
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).not('email', 'in', '("admin@home-chr.fr","support@home-chr.fr")'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'PATRON').not('email', 'in', '("admin@home-chr.fr","support@home-chr.fr")'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'WORKER'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('subscription_tier', 'FREE').not('email', 'in', '("admin@home-chr.fr","support@home-chr.fr")'),
          supabase.from('missions').select('id', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
          supabase.from('missions').select('id', { count: 'exact', head: true }).in('status', ['SEARCHING', 'AWAITING_PATRON_CONFIRMATION', 'IN_PROGRESS']),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', firstDayOfWeekISO),
        ]);

        setStats({
          totalUsers: totalUsersRes.count ?? 0,
          patrons: patronsRes.count ?? 0,
          workers: workersRes.count ?? 0,
          premiumSubscribers: premiumRes.count ?? 0,
          activeMissions: activeMissionsRes.count ?? 0,
          missionsThisMonth: missionsMonthRes.count ?? 0,
          newUsersThisWeek: newUsersWeekRes.count ?? 0,
          avgRating: 0, // No reviews yet
        });
      } catch (err) {
        console.error('[AdminOverviewTab] Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'CA du mois',
      value: '0 \u20ac',
      change: null,
      icon: Euro,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Abonnes Premium',
      value: loading ? '...' : String(stats.premiumSubscribers),
      change: null,
      icon: CreditCard,
      gradient: 'from-amber-400 to-yellow-500',
    },
    {
      label: 'Missions ce mois',
      value: loading ? '...' : String(stats.missionsThisMonth),
      change: null,
      icon: Briefcase,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Nouveaux inscrits',
      value: loading ? '...' : `${stats.newUsersThisWeek}/sem`,
      change: null,
      icon: UserPlus,
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Vue d&apos;ensemble</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Indicateurs cles de la plateforme</p>
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
            <h2 className="font-bold text-lg text-[var(--text-primary)]">Revenus detailles</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Frais de mise en relation</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">0 \u20ac</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Abonnements Premium</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">0 \u20ac</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--text-primary)]">Total CA MTD</span>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              0 \u20ac
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
            <h2 className="font-bold text-lg text-[var(--text-primary)]">Activite plateforme</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Utilisateurs total</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{loading ? '...' : stats.totalUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Patrons</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{loading ? '...' : stats.patrons}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Workers</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{loading ? '...' : stats.workers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Missions actives</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{loading ? '...' : stats.activeMissions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Note moyenne</span>
              <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '\u2014'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
