'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  UserCircle, Briefcase, Power, BarChart3,
  Star, CheckCircle2, ChevronRight, Euro, ChevronLeft,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useStore } from '@/store/useStore';
import { useMissionDispatchStore } from '@/store/useMissionDispatchStore';
import { useState } from 'react';

interface WorkerHubProps {
  currentProfile: { id: string; name: string; specialty: string; authorizedCategories: string[] };
  onGoOnline?: () => void;
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const MONTHLY_DATA: Record<string, { revenue: number; missions: number; rating: number }> = {
  '2026-03': { revenue: 2_150, missions: 7, rating: 4.9 },
  '2026-02': { revenue: 4_820, missions: 14, rating: 4.8 },
  '2026-01': { revenue: 3_650, missions: 11, rating: 4.7 },
  '2025-12': { revenue: 5_100, missions: 16, rating: 4.9 },
};

export default function WorkerHub({ currentProfile, onGoOnline }: WorkerHubProps) {
  const router = useRouter();
  const { missions } = useMissionsStore();
  const { isOnAir, toggleOnAir } = useStore();
  const [monthOffset, setMonthOffset] = useState(0);

  const myCandidatures = useMemo(() =>
    missions.filter(m => m.scheduled && m.candidates?.some(c => c.id === 'worker-self')),
    [missions]
  );
  const pendingCount = myCandidatures.filter(m =>
    m.candidates?.find(c => c.id === 'worker-self')?.status === 'PENDING'
  ).length;
  const completedCount = useMemo(() =>
    missions.filter(m => m.status === 'COMPLETED').length,
    [missions]
  );

  // Stats with month nav
  const now = new Date();
  const selectedDate = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOffset]);
  const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const stats = MONTHLY_DATA[monthKey] || { revenue: 0, missions: 0, rating: 0 };

  const firstName = currentProfile.name.split(' ')[0];

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-4">
      {/* Welcome header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shrink-0 shadow-lg shadow-blue-500/20">
          <div className="w-full h-full rounded-2xl bg-[var(--bg-card)] flex items-center justify-center overflow-hidden">
            <span className="font-bold text-xl text-[var(--text-primary)]">
              {currentProfile.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Bienvenue, {firstName}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {currentProfile.specialty}
          </p>
        </div>
      </div>

      {/* ── Se rendre disponible ─────────── */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          if (isOnAir) {
            // Already online → go to missions
            router.push('/prestataire/mes-missions');
          } else if (onGoOnline) {
            // Show confirmation popup
            onGoOnline();
          } else {
            useMissionDispatchStore.getState().reset();
            toggleOnAir();
            router.push('/prestataire/mes-missions');
          }
        }}
        className={clsx(
          "w-full rounded-2xl p-5 flex items-center gap-4 transition-all border shadow-lg",
          isOnAir
            ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-400/30 shadow-green-500/20"
            : "bg-gradient-to-r from-green-600 to-emerald-700 border-green-500/30 shadow-green-500/20"
        )}
      >
        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Power className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-lg font-bold text-white">
            {isOnAir ? 'Vous êtes disponible' : 'Se rendre disponible'}
          </h3>
          <p className="text-sm text-white/70 mt-0.5">
            {isOnAir ? 'Accéder au radar missions' : 'Recevoir des missions immédiates'}
          </p>
        </div>
        <ChevronRight className="w-6 h-6 text-white/60" />
      </motion.button>

      {/* ── Mon Profil ─────────────────────── */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push('/prestataire/mon-profil')}
        className="w-full bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-4 hover:border-violet-500/30 transition-all"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
          <UserCircle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <h3 className="font-bold text-[var(--text-primary)]">Mon Profil</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Identité, CV, historique</p>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
      </motion.button>

      {/* ── Mes Missions ───────────────────── */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push('/prestataire/mes-missions')}
        className="w-full bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-4 hover:border-blue-500/30 transition-all"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <h3 className="font-bold text-[var(--text-primary)]">Mes Missions</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {completedCount} effectuées • {myCandidatures.length} candidature{myCandidatures.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pendingCount > 0 && (
            <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
        </div>
      </motion.button>

      {/* ── Résumé du mois ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="p-4 flex items-center gap-3 border-b border-[var(--border)]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Résumé</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMonthOffset(prev => Math.min(prev + 1, Object.keys(MONTHLY_DATA).length - 1))}
              className="w-7 h-7 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] flex items-center justify-center transition-colors border border-[var(--border)]"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            </button>
            <span className="text-xs font-bold text-[var(--text-primary)] min-w-[100px] text-center">{monthLabel}</span>
            <button
              onClick={() => setMonthOffset(prev => Math.max(prev - 1, 0))}
              disabled={monthOffset === 0}
              className={clsx(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-colors border border-[var(--border)]",
                monthOffset === 0 ? "opacity-30 cursor-not-allowed" : "bg-[var(--bg-hover)] hover:bg-[var(--bg-active)]"
              )}
            >
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
          <div className="p-4 text-center">
            <Euro className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-[var(--text-primary)]">{stats.revenue.toLocaleString('fr-FR')}&euro;</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase">CA</p>
          </div>
          <div className="p-4 text-center">
            <CheckCircle2 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-[var(--text-primary)]">{stats.missions}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase">Missions</p>
          </div>
          <div className="p-4 text-center">
            <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-[var(--text-primary)]">{stats.rating > 0 ? stats.rating.toFixed(1) : '—'}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase">Note</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
