'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, CalendarClock, UserPlus, Radar, Search,
  MapPin, Clock, Star, Euro, XCircle, ChevronRight, Send, Loader2, Briefcase,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { Mission } from '@/types/missions';
import { getSearchingMissions, applyToMission, getMyCandidatures, cancelCandidature } from '@/lib/supabase-helpers';
import { subscribeToSearchingMissions, subscribeToMyCandidatures } from '@/lib/missions-realtime';
import MissionRadar from './MissionRadar';

interface WorkerMissionsPageProps {
  authorizedCategories: string[];
  /** Pass-through children for radar overlays etc */
  radarOverlay?: React.ReactNode;
  initialTab?: string;
}

const TABS = [
  { id: 'SEARCH', label: 'Rechercher', icon: Search, color: 'text-amber-400' },
  { id: 'CANDIDATURES', label: 'Candidatures', icon: UserPlus, color: 'text-purple-400' },
  { id: 'UPCOMING', label: 'À venir', icon: CalendarClock, color: 'text-blue-400' },
  { id: 'COMPLETED', label: 'Effectuées', icon: CheckCircle2, color: 'text-green-400' },
];

export default function WorkerMissionsPage({ authorizedCategories, radarOverlay, initialTab }: WorkerMissionsPageProps) {
  const { missions, removeCandidate } = useMissionsStore();
  const isOnAir = useStore((s) => s.isOnAir);
  const [activeTab, setActiveTab] = useState(initialTab || 'SEARCH');

  // All tabs including Radar (only when available)
  const allTabs = useMemo(() => {
    if (isOnAir) {
      return [...TABS, { id: 'RADAR', label: 'Radar', icon: Radar, color: 'text-emerald-400' }];
    }
    return TABS;
  }, [isOnAir]);

  // Auto-switch to RADAR when going online (including on mount), back when offline
  const prevOnAir = useRef<boolean | null>(null);
  useEffect(() => {
    // On first mount: if already online, switch to RADAR
    if (prevOnAir.current === null && isOnAir) {
      setActiveTab('RADAR');
    }
    // On change: online → RADAR, offline → COMPLETED
    if (prevOnAir.current !== null) {
      if (isOnAir && !prevOnAir.current) {
        setActiveTab('RADAR');
      }
      if (!isOnAir && prevOnAir.current && activeTab === 'RADAR') {
        setActiveTab('SEARCH');
      }
    }
    prevOnAir.current = isOnAir;
  }, [isOnAir, activeTab]);

  const effectiveTab = activeTab === 'RADAR' && !isOnAir ? 'SEARCH' : activeTab;

  // Data
  const completedMissions = useMemo(() =>
    missions.filter(m => m.status === 'COMPLETED'),
    [missions]
  );

  const upcomingMissions = useMemo(() =>
    missions.filter(m =>
      m.status === 'SCHEDULED' ||
      (m.scheduled && m.candidates?.some(c => c.id === 'worker-self' && c.status === 'ACCEPTED'))
    ),
    [missions]
  );

  const myCandidatures = useMemo(() =>
    missions.filter(m => m.scheduled && m.candidates?.some(c => c.id === 'worker-self')),
    [missions]
  );

  const pendingCount = myCandidatures.filter(m =>
    m.candidates?.find(c => c.id === 'worker-self')?.status === 'PENDING'
  ).length;

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-1.5 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] mb-4 overflow-x-auto no-scrollbar" style={{ boxShadow: 'var(--shadow-card)' }}>
        {allTabs.map((tab) => {
          const isActive = effectiveTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-1 justify-center",
                isActive
                  ? tab.id === 'RADAR'
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id === 'CANDIDATURES' && pendingCount > 0 && !isActive && (
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
              {tab.id === 'RADAR' && isOnAir && !isActive && (
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {effectiveTab === 'SEARCH' && (
            <TabContent key="search">
              <AvailableMissionsList />
            </TabContent>
          )}
          {effectiveTab === 'COMPLETED' && (
            <TabContent key="completed">
              <CompletedList missions={completedMissions} />
            </TabContent>
          )}
          {effectiveTab === 'UPCOMING' && (
            <TabContent key="upcoming">
              <UpcomingList missions={upcomingMissions} />
            </TabContent>
          )}
          {effectiveTab === 'CANDIDATURES' && (
            <TabContent key="candidatures">
              <SupabaseCandidaturesList />
            </TabContent>
          )}
          {effectiveTab === 'RADAR' && (
            <TabContent key="radar" full>
              <div className="h-full w-full rounded-2xl overflow-hidden border border-[var(--border)] relative shadow-2xl">
                <MissionRadar authorizedCategories={authorizedCategories} />
                {radarOverlay}
              </div>
            </TabContent>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabContent({ children, full }: { children: React.ReactNode; full?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className={full ? "h-full" : "h-full overflow-y-auto custom-scrollbar"}
    >
      {children}
    </motion.div>
  );
}

/* ── Available Missions (from Supabase) ───────────── */

function AvailableMissionsList() {
  const { profile } = useAuth();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    loadMissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    const unsubMissions = subscribeToSearchingMissions(() => {
      loadMissions();
    });
    const unsubCandidatures = subscribeToMyCandidatures(profile.id, () => {
      loadMissions();
    });

    return () => {
      unsubMissions();
      unsubCandidatures();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function loadMissions() {
    setLoading(true);
    setError('');
    try {
      const [missionsRes, candidaturesRes] = await Promise.all([
        getSearchingMissions(),
        profile ? getMyCandidatures(profile.id) : Promise.resolve({ data: [], error: null }),
      ]);
      if (missionsRes.error) {
        console.error('[AvailableMissions] error:', missionsRes.error);
        setError('Impossible de charger les missions');
      } else {
        setMissions(missionsRes.data || []);
      }
      if (candidaturesRes.data) {
        const ids = new Set(candidaturesRes.data.map((c: any) => c.missionId));
        setAppliedIds(ids);
      }
    } catch (err) {
      console.error('[AvailableMissions] exception:', err);
      setError('Erreur de chargement');
    }
    setLoading(false);
  }

  async function handleApply(mission: any) {
    if (!profile) return;
    setApplyingId(mission.id);
    setError('');
    const workerName = `${profile.first_name} ${profile.last_name}`.trim();
    const { data, error } = await applyToMission({
      missionId: mission.id,
      workerId: profile.id,
      name: workerName,
      specialty: profile.skills?.[0] || '',
      message: '',
    });
    if (error) {
      setError(error.message || 'Erreur lors de la candidature');
    } else {
      setAppliedIds(prev => new Set(prev).add(mission.id));
      fetch('/api/missions/notify-patron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: mission.id,
          event: 'NEW_CANDIDATE',
          workerName,
        }),
      }).catch(() => {
        /* best-effort */
      });
    }
    setApplyingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  // Filtrer les missions déjà postulées
  const availableMissions = missions.filter(m => !appliedIds.has(m.id));

  if (availableMissions.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title={missions.length > 0 ? "Vous avez postulé à toutes les missions" : "Aucune mission disponible"}
        subtitle={missions.length > 0 ? "Consultez l'onglet Candidatures pour suivre vos candidatures" : "Les missions publiées par les patrons apparaîtront ici"}
      />
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      {availableMissions.map((m: any) => {
        const hasApplied = appliedIds.has(m.id);
        const isApplying = applyingId === m.id;
        return (
          <div key={m.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 transition-all hover:border-amber-500/30" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">{m.title || 'Mission sans titre'}</h4>
                {m.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{m.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)] flex-wrap">
                  {m.staffingRole && (
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-medium">{m.staffingRole}</span>
                  )}
                  {m.staffingDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(m.staffingDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {m.staffingStartTime && ` ${m.staffingStartTime}`}
                      {m.staffingEndTime && `-${m.staffingEndTime}`}
                    </span>
                  )}
                  {m.priority === 'URGENT' && (
                    <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">URGENT</span>
                  )}
                </div>
                {(m.priceEstimatedMin || m.priceEstimatedMax || m.staffingHourlyRate) && (
                  <div className="flex items-center gap-1 mt-2 text-sm font-bold text-[var(--text-primary)]">
                    <Euro className="w-3.5 h-3.5 text-emerald-400" />
                    {m.staffingHourlyRate
                      ? `${m.staffingHourlyRate}€/h`
                      : m.priceEstimatedMin && m.priceEstimatedMax
                        ? `${m.priceEstimatedMin}€ - ${m.priceEstimatedMax}€`
                        : m.priceEstimatedMin ? `À partir de ${m.priceEstimatedMin}€` : ''
                    }
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleApply(m)}
              disabled={hasApplied || isApplying}
              className={clsx(
                "w-full mt-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors",
                hasApplied
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20"
              )}
            >
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : hasApplied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Candidature envoyée
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Postuler
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Candidatures from Supabase ───────────────────── */

function SupabaseCandidaturesList() {
  const { profile } = useAuth();
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) loadCandidatures();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function loadCandidatures() {
    setLoading(true);
    const { data } = await getMyCandidatures(profile!.id);
    setCandidatures(data || []);
    setLoading(false);
  }

  async function handleCancel(candidateId: string) {
    setCancellingId(candidateId);
    await cancelCandidature(candidateId);
    setCandidatures(prev => prev.filter(c => c.id !== candidateId));
    setCancellingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (candidatures.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="Aucune candidature"
        subtitle="Postulez à des missions depuis l'onglet Rechercher"
      />
    );
  }

  return (
    <div className="space-y-3">
      {candidatures.map((c: any) => {
        const m = c.mission;
        const st = c.status || 'PENDING';
        return (
          <div key={c.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 transition-all" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-4">
              <div className={clsx(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                st === 'ACCEPTED' ? "bg-green-500/10" : st === 'REJECTED' ? "bg-red-500/10" : "bg-purple-500/10"
              )}>
                {st === 'ACCEPTED' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> :
                 st === 'REJECTED' ? <XCircle className="w-5 h-5 text-red-400" /> :
                 <UserPlus className="w-5 h-5 text-purple-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">{m?.title || 'Mission'}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                  {m?.staffingDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(m.staffingDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {m.staffingStartTime && ` ${m.staffingStartTime}`}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(c.appliedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <span className={clsx(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0",
                st === 'ACCEPTED' ? "bg-green-500/20 text-green-400" :
                st === 'REJECTED' ? "bg-red-500/20 text-red-400" :
                "bg-purple-500/20 text-purple-400"
              )}>
                {st === 'ACCEPTED' ? 'Acceptée' : st === 'REJECTED' ? 'Refusée' : 'En attente'}
              </span>
            </div>
            {st === 'PENDING' && (
              <button
                onClick={() => handleCancel(c.id)}
                disabled={cancellingId === c.id}
                className="w-full mt-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                {cancellingId === c.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    Annuler ma candidature
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Completed Missions ────────────────────────── */

function CompletedList({ missions }: { missions: Mission[] }) {
  if (missions.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Aucune mission effectuée"
        subtitle="Vos missions terminées apparaîtront ici"
      />
    );
  }
  return (
    <div className="space-y-3">
      {missions.map((m) => (
        <div key={m.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 hover:border-green-500/30 transition-all cursor-pointer" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">{m.title}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{m.venue || 'Client'}</span>
                {m.date && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                    <span>{m.date}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm text-[var(--text-primary)]">{m.price}</p>
              {m.review && (
                <div className="flex items-center gap-0.5 justify-end mt-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={clsx("w-3 h-3", i <= m.review!.rating ? "text-amber-400 fill-amber-400" : "text-[var(--text-muted)]")} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Upcoming Missions ─────────────────────────── */

function UpcomingList({ missions }: { missions: Mission[] }) {
  if (missions.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Aucune mission à venir"
        subtitle="Vos missions planifiées et confirmées apparaîtront ici"
      />
    );
  }
  return (
    <div className="space-y-3">
      {missions.map((m) => (
        <div key={m.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 hover:border-blue-500/30 transition-all cursor-pointer" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">{m.title}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{m.venue || 'Client'}</span>
                {m.scheduledDate && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                    <Clock className="w-3 h-3" />
                    <span>{new Date(m.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm text-[var(--text-primary)]">{m.price}</p>
              <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded-full">
                Confirmée
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Candidatures ──────────────────────────────── */

function CandidaturesList({ missions, onCancel }: { missions: Mission[]; onCancel: (missionId: string, candidateId: string) => void }) {
  if (missions.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="Aucune candidature"
        subtitle="Positionnez-vous sur des missions planifiées depuis le radar"
      />
    );
  }
  return (
    <div className="space-y-3">
      {missions.map((m) => {
        const myC = m.candidates?.find(c => c.id === 'worker-self');
        const st = myC?.status || 'PENDING';
        return (
          <div key={m.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 transition-all" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-4">
              <div className={clsx(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                st === 'ACCEPTED' ? "bg-green-500/10" : st === 'REJECTED' ? "bg-red-500/10" : "bg-purple-500/10"
              )}>
                {st === 'ACCEPTED' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> :
                 st === 'REJECTED' ? <XCircle className="w-5 h-5 text-red-400" /> :
                 <UserPlus className="w-5 h-5 text-purple-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">{m.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{m.venue}</span>
                  {m.scheduledDate && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                      <Clock className="w-3 h-3" />
                      <span>{new Date(m.scheduledDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                <p className="font-bold text-sm text-[var(--text-primary)]">{m.price}</p>
                <span className={clsx(
                  "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                  st === 'ACCEPTED' ? "bg-green-500/20 text-green-400" :
                  st === 'REJECTED' ? "bg-red-500/20 text-red-400" :
                  "bg-purple-500/20 text-purple-400"
                )}>
                  {st === 'ACCEPTED' ? 'Acceptée' : st === 'REJECTED' ? 'Refusée' : 'En attente'}
                </span>
              </div>
            </div>
            {st === 'PENDING' && (
              <button
                onClick={() => onCancel(m.id, 'worker-self')}
                className="w-full mt-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-3.5 h-3.5" />
                Annuler ma candidature
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Empty State ───────────────────────────────── */

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
      </div>
      <h3 className="font-bold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] max-w-xs">{subtitle}</p>
    </div>
  );
}
