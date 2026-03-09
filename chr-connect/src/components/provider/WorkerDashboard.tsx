'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Star, FileText, Euro, CheckCircle2, Clock, MapPin,
  CalendarClock, UserPlus, CheckCircle, XCircle, DollarSign, Building2, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMissionsStore } from '@/store/useMissionsStore';
import { Mission } from '@/types/missions';
import { AnimatePresence } from 'framer-motion';

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
  const { missions, removeCandidate } = useMissionsStore();
  const [openCandidature, setOpenCandidature] = useState<Mission | null>(null);

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

      {/* Mes candidatures */}
      {(() => {
        const myCandidatures = missions.filter(m =>
          m.scheduled && m.candidates?.some(c => c.id === 'worker-self')
        );
        if (myCandidatures.length === 0) return null;
        return (
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-purple-500" />
                Mes candidatures
              </h3>
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">
                {myCandidatures.length}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {myCandidatures.map((mission) => {
                const myCandidate = mission.candidates?.find(c => c.id === 'worker-self');
                const status = myCandidate?.status || 'PENDING';
                return (
                  <div
                    key={mission.id}
                    onClick={() => setOpenCandidature(mission)}
                    className="p-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        status === 'ACCEPTED' ? "bg-green-500/10" : status === 'REJECTED' ? "bg-red-500/10" : "bg-purple-500/10"
                      )}>
                        {status === 'ACCEPTED' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : status === 'REJECTED' ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <UserPlus className="w-5 h-5 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[var(--text-primary)] truncate group-hover:text-blue-400 transition-colors">{mission.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{mission.venue}</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" />
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="shrink-0">{mission.scheduledDate ? new Date(mission.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm text-[var(--text-primary)]">{mission.price}</div>
                        <span className={clsx(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          status === 'ACCEPTED' ? "bg-green-500/20 text-green-400" :
                          status === 'REJECTED' ? "bg-red-500/20 text-red-400" :
                          "bg-purple-500/20 text-purple-400"
                        )}>
                          {status === 'ACCEPTED' ? 'Acceptée' : status === 'REJECTED' ? 'Refusée' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Modal détail candidature */}
      <AnimatePresence>
        {openCandidature && (() => {
          const myCandidate = openCandidature.candidates?.find(c => c.id === 'worker-self');
          const status = myCandidate?.status || 'PENDING';
          return (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpenCandidature(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:max-h-[80vh] bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-2xl z-[1001] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-[var(--border)]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={clsx(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          status === 'ACCEPTED' ? "bg-green-500/20 text-green-400" :
                          status === 'REJECTED' ? "bg-red-500/20 text-red-400" :
                          "bg-purple-500/20 text-purple-400"
                        )}>
                          {status === 'ACCEPTED' ? 'Acceptée' : status === 'REJECTED' ? 'Refusée' : 'En attente de réponse'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400">
                          Planifiée
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[var(--text-primary)]">{openCandidature.title}</h2>
                    </div>
                    <button onClick={() => setOpenCandidature(null)} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                      <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Infos grille */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--bg-hover)] rounded-2xl p-4 border border-[var(--border)] flex flex-col items-center text-center">
                      <CalendarClock className="w-5 h-5 text-blue-400 mb-1.5" />
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {openCandidature.scheduledDate ? new Date(openCandidature.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase mt-0.5">
                        {openCandidature.scheduledDate ? new Date(openCandidature.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="bg-[var(--bg-hover)] rounded-2xl p-4 border border-[var(--border)] flex flex-col items-center text-center">
                      <DollarSign className="w-5 h-5 text-green-400 mb-1.5" />
                      <span className="text-sm font-bold text-[var(--text-primary)]">{openCandidature.price}</span>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase mt-0.5">Rémunération</span>
                    </div>
                  </div>

                  {/* Établissement */}
                  <div className="bg-[var(--bg-hover)] rounded-2xl p-4 border border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {(openCandidature.venue || 'C').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{openCandidature.venue || 'Client'}</h4>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{openCandidature.distance || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {openCandidature.description && (
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Description</h4>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{openCandidature.description}</p>
                    </div>
                  )}

                  {/* Candidature envoyée le */}
                  {myCandidate && (
                    <div className="bg-[var(--bg-hover)] rounded-2xl p-4 border border-[var(--border)]">
                      <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Ma candidature</h4>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                        <span>Envoyée le {new Date(myCandidate.appliedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="p-6 border-t border-[var(--border)]">
                  {status === 'PENDING' ? (
                    <button
                      onClick={() => {
                        removeCandidate(openCandidature.id, 'worker-self');
                        setOpenCandidature(null);
                      }}
                      className="w-full py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <XCircle className="w-4 h-4" />
                      Annuler ma candidature
                    </button>
                  ) : status === 'ACCEPTED' ? (
                    <div className="w-full py-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Candidature acceptée
                    </div>
                  ) : (
                    <div className="w-full py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Candidature refusée
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

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
