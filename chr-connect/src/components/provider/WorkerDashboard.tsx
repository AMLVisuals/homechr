'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Star, FileText, Euro, CheckCircle2, Clock, MapPin,
} from 'lucide-react';
import { clsx } from 'clsx';

// ── Mock data ────────────────────────────────────────────────────────────────

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const MONTHLY_DATA: Record<string, { revenue: number; missions: number; quotes: number; rating: number }> = {
  '2026-02': { revenue: 4_820, missions: 14, quotes: 8, rating: 4.8 },
  '2026-01': { revenue: 3_650, missions: 11, quotes: 6, rating: 4.7 },
  '2025-12': { revenue: 5_100, missions: 16, quotes: 10, rating: 4.9 },
  '2025-11': { revenue: 4_200, missions: 13, quotes: 7, rating: 4.6 },
  '2025-10': { revenue: 3_900, missions: 12, quotes: 9, rating: 4.8 },
  '2025-09': { revenue: 2_800, missions: 9, quotes: 5, rating: 4.5 },
};

const RECENT_MISSIONS = [
  { id: 'wm1', title: 'Réparation chambre froide', venue: 'Le Fouquet\'s Paris', date: '27 Fév 2026', price: 450, rating: 5 },
  { id: 'wm2', title: 'Maintenance groupe froid', venue: 'La Tour d\'Argent', date: '25 Fév 2026', price: 320, rating: 4 },
  { id: 'wm3', title: 'Installation vitrine réfrigérée', venue: 'Hôtel Costes', date: '22 Fév 2026', price: 780, rating: 5 },
  { id: 'wm4', title: 'Dépannage climatisation salle', venue: 'L\'Ambroisie', date: '20 Fév 2026', price: 280, rating: 5 },
  { id: 'wm5', title: 'Remplacement compresseur', venue: 'Le Fouquet\'s Paris', date: '18 Fév 2026', price: 950, rating: 4 },
  { id: 'wm6', title: 'Diagnostic fuite gaz réfrigérant', venue: 'Brasserie Lipp', date: '15 Fév 2026', price: 180, rating: 5 },
];

const UPCOMING_MISSIONS = [
  { id: 'wu1', title: 'Maintenance préventive clim', venue: 'Le Fouquet\'s Paris', date: 'Demain, 09:00', price: 350 },
  { id: 'wu2', title: 'Contrôle annuel chambre froide', venue: 'La Tour d\'Argent', date: 'Lun. 3 Mars, 14:00', price: 420 },
];

// ── Component ────────────────────────────────────────────────────────────────

interface WorkerDashboardProps {
  currentProfile: { name: string; authorizedCategories: string[] };
}

export default function WorkerDashboard({ currentProfile }: WorkerDashboardProps) {
  const router = useRouter();

  // Month navigation
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const selectedDate = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    return d;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOffset]);

  const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const data = MONTHLY_DATA[monthKey] || { revenue: 0, missions: 0, quotes: 0, rating: 0 };

  const prevKey = (() => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const prevData = MONTHLY_DATA[prevKey];

  const revenueTrend = prevData ? ((data.revenue - prevData.revenue) / prevData.revenue * 100) : null;
  const missionsTrend = prevData ? ((data.missions - prevData.missions) / prevData.missions * 100) : null;

  const hasQuotes = ['cold', 'hot', 'plumbing', 'electricity', 'coffee', 'beer', 'light', 'video', 'sound', 'pos', 'network', 'architecture', 'decoration', 'painting', 'carpentry'].some(
    cat => currentProfile.authorizedCategories.includes(cat)
  );

  return (
    <div className="space-y-8">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Bienvenue, {currentProfile.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset(prev => Math.min(prev + 1, Object.keys(MONTHLY_DATA).length - 1))}
            className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] flex items-center justify-center transition-colors border border-[var(--border)]"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <span className="text-sm font-bold text-[var(--text-primary)] min-w-[140px] text-center">{monthLabel}</span>
          <button
            onClick={() => setMonthOffset(prev => Math.max(prev - 1, 0))}
            disabled={monthOffset === 0}
            className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-[var(--border)]",
              monthOffset === 0 ? "opacity-30 cursor-not-allowed bg-[var(--bg-hover)]" : "bg-[var(--bg-hover)] hover:bg-[var(--bg-active)]"
            )}
          >
            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={clsx("grid gap-4", hasQuotes ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3")}>
        {/* CA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 relative overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-3xl rounded-full -mr-8 -mt-8" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Euro className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Chiffre d&apos;affaires</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{data.revenue.toLocaleString('fr-FR')}&euro;</span>
            {revenueTrend !== null && (
              <span className={clsx("text-xs font-medium flex items-center gap-0.5", revenueTrend >= 0 ? "text-green-500" : "text-red-500")}>
                {revenueTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {revenueTrend >= 0 ? '+' : ''}{Math.round(revenueTrend)}%
              </span>
            )}
          </div>
        </motion.div>

        {/* Missions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 relative overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full -mr-8 -mt-8" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Missions réalisées</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{data.missions}</span>
            {missionsTrend !== null && (
              <span className={clsx("text-xs font-medium flex items-center gap-0.5", missionsTrend >= 0 ? "text-green-500" : "text-red-500")}>
                {missionsTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {missionsTrend >= 0 ? '+' : ''}{Math.round(missionsTrend)}%
              </span>
            )}
          </div>
        </motion.div>

        {/* Devis — only for technicians */}
        {hasQuotes && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 relative overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-3xl rounded-full -mr-8 -mt-8" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Devis établis</span>
            </div>
            <span className="text-3xl font-bold text-[var(--text-primary)]">{data.quotes}</span>
          </motion.div>
        )}

        {/* Note moyenne */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 relative overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full -mr-8 -mt-8" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Note moyenne</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{data.rating > 0 ? data.rating.toFixed(1) : '—'}</span>
            {data.rating > 0 && (
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={clsx("w-3.5 h-3.5", i <= Math.round(data.rating) ? "text-amber-400 fill-amber-400" : "text-[var(--text-muted)]")} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Recent missions */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Dernières missions
              </h3>
              <button onClick={() => router.push('/prestataire/mes-missions')} className="text-sm text-blue-500 hover:text-blue-400 font-medium">Tout voir</button>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {RECENT_MISSIONS.map((mission) => (
                <div key={mission.id} className="p-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">{mission.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{mission.venue}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" />
                        <span className="shrink-0">{mission.date}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm text-[var(--text-primary)]">{mission.price}&euro;</div>
                      <div className="flex items-center gap-0.5 justify-end mt-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={clsx("w-3 h-3", i <= mission.rating ? "text-amber-400 fill-amber-400" : "text-[var(--text-muted)]")} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Upcoming + Revenue summary */}
        <div className="space-y-6">
          {/* Revenue breakdown */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6 relative overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
            <h3 className="font-bold text-[var(--text-muted)] mb-4 uppercase text-xs tracking-wider">Résumé</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">CA moyen / mission</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {data.missions > 0 ? `${Math.round(data.revenue / data.missions)}€` : '—'}
                </span>
              </div>
              {hasQuotes && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-secondary)]">Taux conversion devis</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {data.quotes > 0 ? `${Math.round(data.missions / data.quotes * 100)}%` : '—'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Missions / semaine</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {data.missions > 0 ? (data.missions / 4).toFixed(1) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming missions */}
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--text-primary)]">À venir</h3>
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            <div className="divide-y divide-[var(--border)]">
              {UPCOMING_MISSIONS.map((mission) => (
                <div key={mission.id} className="p-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
                  <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">{mission.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <MapPin className="w-3 h-3" />
                    <span>{mission.venue}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Clock className="w-3 h-3" /> {mission.date}</span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{mission.price}&euro;</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/prestataire/mes-missions')} className="w-full py-3 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors uppercase tracking-wider">
              Voir toutes les missions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
