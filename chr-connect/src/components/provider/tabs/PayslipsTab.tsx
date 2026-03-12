'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Building2, Star, TrendingUp,
  CalendarCheck, MapPin, ArrowLeft, ChevronRight,
  Clock, CheckCircle, Calendar,
} from 'lucide-react';
import { clsx } from 'clsx';

// ── Shared mock data ─────────────────────────────────────────────────────────
const MOCK_MISSIONS = [
  {
    id: 'M-1204',
    title: 'Réparation Machine à Glaçons',
    venue: 'Le Perchoir Marais',
    date: '10 Mar 2026, 10:30',
    isoDate: '2026-03-10',
    duration: '1h 45min',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=300&auto=format&fit=crop',
    report: {
      text: 'Remplacement de la pompe de vidange. Test de cycle complet OK.',
      before: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'M-1198',
    title: 'Installation Vitrine Réfrigérée',
    venue: 'La Felicità',
    date: '07 Mar 2026, 14:15',
    isoDate: '2026-03-07',
    duration: '3h 00min',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=300&auto=format&fit=crop',
    report: {
      text: 'Installation complète et raccordement électrique. Mise en service effectuée.',
      before: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'M-1150',
    title: 'Maintenance Préventive',
    venue: 'Big Mamma',
    date: '15 Fév 2026, 09:00',
    isoDate: '2026-02-15',
    duration: '2h 30min',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=300&auto=format&fit=crop',
    report: {
      text: 'Nettoyage des condenseurs et vérification des niveaux de gaz.',
      before: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'M-1120',
    title: 'Dépannage Chambre Froide',
    venue: 'Bouillon Chartier',
    date: '28 Jan 2026, 16:00',
    isoDate: '2026-01-28',
    duration: '2h 15min',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=300&auto=format&fit=crop',
    report: {
      text: 'Fuite de gaz réfrigérant détectée et réparée. Recharge effectuée.',
      before: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'M-1080',
    title: 'Remplacement Compresseur',
    venue: 'Le Perchoir Marais',
    date: '12 Déc 2025, 08:00',
    isoDate: '2025-12-12',
    duration: '4h 00min',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=300&auto=format&fit=crop',
    report: {
      text: 'Remplacement du compresseur principal. Tests de pression OK.',
      before: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'M-1045',
    title: 'Entretien Hotte Professionnelle',
    venue: 'Big Mamma',
    date: '03 Déc 2025, 11:00',
    isoDate: '2025-12-03',
    duration: '2h 00min',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=300&auto=format&fit=crop',
    report: {
      text: 'Nettoyage complet des filtres et conduits. Vérification moteur extraction.',
      before: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'M-1010',
    title: 'Réparation Four Professionnel',
    venue: 'La Felicità',
    date: '18 Nov 2025, 15:30',
    isoDate: '2025-11-18',
    duration: '1h 30min',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=300&auto=format&fit=crop',
    report: {
      text: 'Remplacement thermostat et résistance supérieure. Calibration effectuée.',
      before: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'M-0990',
    title: 'Diagnostic Chambre Froide',
    venue: 'Bouillon Chartier',
    date: '05 Nov 2025, 09:30',
    isoDate: '2025-11-05',
    duration: '1h 00min',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=300&auto=format&fit=crop',
    report: {
      text: 'Diagnostic complet. Préconisation remplacement joint de porte.',
      before: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'M-0950',
    title: 'Installation Lave-vaisselle Pro',
    venue: 'Le Perchoir Marais',
    date: '20 Oct 2025, 14:00',
    isoDate: '2025-10-20',
    duration: '3h 30min',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=300&auto=format&fit=crop',
    report: {
      text: 'Installation et raccordement complet. Formation équipe sur utilisation.',
      before: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'M-0920',
    title: 'Révision Groupe Froid',
    venue: 'Big Mamma',
    date: '08 Oct 2025, 10:00',
    isoDate: '2025-10-08',
    duration: '2h 00min',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=300&auto=format&fit=crop',
    report: {
      text: 'Révision complète. Remplacement filtre déshydrateur.',
      before: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop',
    },
  },
];

type Mission = typeof MOCK_MISSIONS[number];
type DetailView = 'missions' | 'venues' | 'ratings' | null;

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export function ActivityTab() {
  const [detailView, setDetailView] = useState<DetailView>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const missions = MOCK_MISSIONS;

  const totalMissions = missions.length;

  const avgRating = useMemo(() => {
    if (missions.length === 0) return 0;
    return missions.reduce((sum, m) => sum + m.rating, 0) / missions.length;
  }, [missions]);

  const uniqueVenues = useMemo(() => {
    return [...new Set(missions.map((m) => m.venue))];
  }, [missions]);

  // ── Mission detail view ──────────────────────────────────────────────────
  if (selectedMission) {
    return (
      <MissionDetail
        mission={selectedMission}
        onBack={() => setSelectedMission(null)}
      />
    );
  }

  // ── Detail sub-views ─────────────────────────────────────────────────────
  if (detailView === 'missions') {
    return (
      <MissionsDetailView
        missions={missions}
        onBack={() => setDetailView(null)}
        onSelectMission={setSelectedMission}
      />
    );
  }

  if (detailView === 'venues') {
    return (
      <VenuesDetailView
        missions={missions}
        venues={uniqueVenues}
        onBack={() => setDetailView(null)}
        onSelectMission={setSelectedMission}
      />
    );
  }

  if (detailView === 'ratings') {
    return (
      <RatingsDetailView
        missions={missions}
        avgRating={avgRating}
        onBack={() => setDetailView(null)}
        onSelectMission={setSelectedMission}
      />
    );
  }

  // ── Dashboard view (3 clickable cards) ───────────────────────────────────
  return (
    <div className="space-y-4">
      <ClickableStatCard
        icon={Briefcase}
        label="Missions réalisées"
        value={totalMissions.toString()}
        subtitle={`${uniqueVenues.length} établissement${uniqueVenues.length > 1 ? 's' : ''}`}
        color="blue"
        onClick={() => setDetailView('missions')}
      />
      <ClickableStatCard
        icon={Building2}
        label="Établissements"
        value={uniqueVenues.length.toString()}
        subtitle={uniqueVenues.slice(0, 3).join(', ') + (uniqueVenues.length > 3 ? '...' : '')}
        color="purple"
        onClick={() => setDetailView('venues')}
      />
      <ClickableStatCard
        icon={Star}
        label="Note moyenne"
        value={avgRating.toFixed(1)}
        subtitle={`Sur ${missions.length} évaluation${missions.length > 1 ? 's' : ''}`}
        color="amber"
        onClick={() => setDetailView('ratings')}
        extra={
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={clsx(
                  'w-3.5 h-3.5',
                  s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)]'
                )}
              />
            ))}
          </div>
        }
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CLICKABLE STAT CARD
// ═════════════════════════════════════════════════════════════════════════════

function ClickableStatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  onClick,
  extra,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'purple' | 'amber';
  onClick: () => void;
  extra?: React.ReactNode;
}) {
  const colors = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', hover: 'hover:border-blue-500/40' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', hover: 'hover:border-purple-500/40' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', hover: 'hover:border-amber-500/40' },
  };
  const c = colors[color];

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'w-full flex items-center gap-4 rounded-xl p-4 border transition-all cursor-pointer group text-left',
        c.bg, c.border, c.hover
      )}
    >
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', c.bg, `border ${c.border}`)}>
        <Icon className={clsx('w-6 h-6', c.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">{label}</div>
        <div className={clsx('text-2xl font-bold', c.text)}>{value}</div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{subtitle}</div>
        {extra}
      </div>
      <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors shrink-0" />
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BACK BUTTON
// ═════════════════════════════════════════════════════════════════════════════

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MISSIONS DETAIL VIEW
// ═════════════════════════════════════════════════════════════════════════════

function MissionsDetailView({
  missions,
  onBack,
  onSelectMission,
}: {
  missions: Mission[];
  onBack: () => void;
  onSelectMission: (m: Mission) => void;
}) {
  const monthlyBreakdown = useMemo(() => {
    const map = new Map<string, Mission[]>();
    for (const m of missions) {
      const key = getMonthKey(m.isoDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [missions]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <BackButton onClick={onBack} label="Mon activité" />

      <div className="flex items-center gap-2 mb-2">
        <Briefcase className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Missions réalisées</h3>
        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
          {missions.length}
        </span>
      </div>

      {monthlyBreakdown.map(([monthKey, monthMissions]) => (
        <div key={monthKey}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider capitalize">
              {formatMonth(monthKey)}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              — {monthMissions.length} mission{monthMissions.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2 mb-4">
            {monthMissions.map((mission) => (
              <MissionRow key={mission.id} mission={mission} onClick={() => onSelectMission(mission)} />
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VENUES DETAIL VIEW
// ═════════════════════════════════════════════════════════════════════════════

function VenuesDetailView({
  missions,
  venues,
  onBack,
  onSelectMission,
}: {
  missions: Mission[];
  venues: string[];
  onBack: () => void;
  onSelectMission: (m: Mission) => void;
}) {
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <BackButton onClick={onBack} label="Mon activité" />

      <div className="flex items-center gap-2 mb-2">
        <Building2 className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Établissements</h3>
        <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
          {venues.length}
        </span>
      </div>

      <div className="space-y-3">
        {venues.map((venue) => {
          const venueMissions = missions.filter((m) => m.venue === venue);
          const venueAvg = venueMissions.reduce((s, m) => s + m.rating, 0) / venueMissions.length;
          const lastDate = new Date(Math.max(...venueMissions.map((m) => new Date(m.isoDate).getTime())));
          const isExpanded = expandedVenue === venue;

          return (
            <div key={venue} className="bg-[var(--bg-hover)] rounded-xl border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => setExpandedVenue(isExpanded ? null : venue)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--bg-active)] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--text-primary)] truncate">{venue}</div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                    <CalendarCheck className="w-3 h-3" />
                    <span>{venueMissions.length} mission{venueMissions.length > 1 ? 's' : ''}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                    <span>Dernière : {lastDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {venueAvg > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {venueAvg.toFixed(1)}
                    </span>
                  )}
                  <ChevronRight className={clsx('w-4 h-4 text-[var(--text-muted)] transition-transform', isExpanded && 'rotate-90')} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-[var(--border)] pt-3">
                      {venueMissions.map((mission) => (
                        <MissionRow key={mission.id} mission={mission} onClick={() => onSelectMission(mission)} compact />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RATINGS DETAIL VIEW
// ═════════════════════════════════════════════════════════════════════════════

function RatingsDetailView({
  missions,
  avgRating,
  onBack,
  onSelectMission,
}: {
  missions: Mission[];
  avgRating: number;
  onBack: () => void;
  onSelectMission: (m: Mission) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      <BackButton onClick={onBack} label="Mon activité" />

      <div className="flex items-center gap-2 mb-2">
        <Star className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Notes reçues</h3>
      </div>

      {/* Average + distribution */}
      <div className="bg-[var(--bg-hover)] rounded-xl p-5 border border-[var(--border)]">
        <div className="flex items-center gap-4 mb-5">
          <div className="text-4xl font-bold text-amber-400">{avgRating.toFixed(1)}</div>
          <div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={clsx(
                    'w-5 h-5',
                    s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)]'
                  )}
                />
              ))}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              Sur {missions.length} évaluation{missions.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {/* Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = missions.filter((m) => Math.round(m.rating) === star).length;
            const percent = missions.length > 0 ? (count / missions.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)] w-3 text-right">{star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2.5 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${percent}%` }} />
                </div>
                <span className="text-[var(--text-muted)] w-4 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* All rated missions */}
      <div>
        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Toutes les évaluations
        </h4>
        <div className="space-y-2">
          {[...missions]
            .sort((a, b) => b.rating - a.rating)
            .map((mission) => (
              <button
                key={mission.id}
                onClick={() => onSelectMission(mission)}
                className="w-full flex items-center gap-3 bg-[var(--bg-hover)] rounded-xl p-3 border border-[var(--border)] hover:border-amber-500/30 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--bg-active)] shrink-0">
                  <img src={mission.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--text-primary)] truncate">{mission.title}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{mission.venue}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                    <span>{mission.date.split(',')[0]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-amber-400 shrink-0">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {mission.rating.toFixed(1)}
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors shrink-0" />
              </button>
            ))}
        </div>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MISSION ROW (reusable)
// ═════════════════════════════════════════════════════════════════════════════

function MissionRow({ mission, onClick, compact }: { mission: Mission; onClick: () => void; compact?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'w-full flex items-center gap-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl transition-all cursor-pointer group text-left hover:border-blue-500/30',
        compact ? 'p-3' : 'p-4'
      )}
    >
      <div className={clsx('rounded-lg overflow-hidden bg-[var(--bg-active)] shrink-0', compact ? 'w-10 h-10' : 'w-14 h-14')}>
        <img src={mission.image} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-[var(--text-primary)] truncate">{mission.title}</div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-0.5">
          <MapPin className="w-2.5 h-2.5" />
          <span className="truncate">{mission.venue}</span>
          <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
          <Calendar className="w-2.5 h-2.5" />
          <span>{mission.date.split(',')[0]}</span>
        </div>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/20">
              TERMINÉE
            </span>
            <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" /> {mission.duration}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          {mission.rating.toFixed(1)}
        </span>
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
      </div>
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MISSION DETAIL
// ═════════════════════════════════════════════════════════════════════════════

function MissionDetail({ mission, onBack }: { mission: Mission; onBack: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      <BackButton onClick={onBack} label="Retour" />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">{mission.title}</h2>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <MapPin className="w-4 h-4" />
          {mission.venue}
          <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
          <span>{mission.date}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--bg-hover)] rounded-xl p-3 border border-[var(--border)] text-center">
          <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-sm font-bold text-[var(--text-primary)]">{mission.duration}</div>
          <div className="text-[10px] text-[var(--text-muted)]">Durée</div>
        </div>
        <div className="bg-[var(--bg-hover)] rounded-xl p-3 border border-[var(--border)] text-center">
          <CheckCircle className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-sm font-bold text-green-400">Terminée</div>
          <div className="text-[10px] text-[var(--text-muted)]">Statut</div>
        </div>
        <div className="bg-[var(--bg-hover)] rounded-xl p-3 border border-[var(--border)] text-center">
          <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-sm font-bold text-amber-400">{mission.rating.toFixed(1)}</div>
          <div className="text-[10px] text-[var(--text-muted)]">Note</div>
        </div>
      </div>

      {/* Before / After */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Avant</span>
          <div className="aspect-video rounded-xl overflow-hidden bg-[var(--bg-hover)] border border-[var(--border)]">
            <img src={mission.report.before} alt="Avant" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Après</span>
          <div className="aspect-video rounded-xl overflow-hidden bg-[var(--bg-hover)] border border-[var(--border)] relative">
            <img src={mission.report.after} alt="Après" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 right-2 bg-green-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Validé
            </div>
          </div>
        </div>
      </div>

      {/* Report */}
      <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
        <h3 className="font-bold text-sm text-[var(--text-primary)] mb-2">Rapport d&apos;intervention</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{mission.report.text}</p>
      </div>
    </motion.div>
  );
}
