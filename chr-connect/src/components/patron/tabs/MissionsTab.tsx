'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Wrench, ChefHat, Monitor, Hammer,
  Clock, MapPin, CheckCircle2, AlertCircle, XCircle, MoreVertical, ArrowRight, UserCheck, ClipboardList, Plus, Users,
  Archive, CalendarDays, ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { SkeletonTable } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { Mission } from '@/types/missions';
import MissionDetailsModal from '../missions/MissionDetailsModal';
import WorkerValidationModal from '../WorkerValidationModal';
import CandidateReviewModal from '../CandidateReviewModal';

const ICON_MAP: Record<string, any> = {
  Wrench, ChefHat, Monitor, Hammer
};

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Clé mois/année courante
function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Archivée = COMPLETED/CANCELLED ET pas du mois en cours
function isArchived(mission: Mission): boolean {
  if (!['COMPLETED', 'CANCELLED'].includes(mission.status)) return false;
  // Les missions du mois en cours restent visibles dans la liste principale
  return getMissionMonthKeyRaw(mission) !== currentMonthKey();
}

// Version sans fallback pour éviter la circularité
function getMissionMonthKeyRaw(mission: Mission): string {
  const d = extractDate(mission);
  if (d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return currentMonthKey();
}

// Map mois français → numéro
const MONTH_FR_MAP: Record<string, number> = {
  'janvier': 0, 'février': 1, 'fevrier': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
  'juillet': 6, 'août': 7, 'aout': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11, 'decembre': 11,
};

// Parse une date française type "05 Juin" ou "05 Juin 2023"
function parseFrenchDate(s: string): Date | null {
  const match = s.match(/^(\d{1,2})\s+([a-zéûô]+)(?:\s+(\d{4}))?$/i);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const monthStr = match[2].toLowerCase();
  const month = MONTH_FR_MAP[monthStr];
  if (month === undefined) return null;
  const year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();
  const d = new Date(year, month, day);
  if (!isNaN(d.getTime())) return d;
  return null;
}

// Essaie de trouver une date exploitable sur la mission
function extractDate(mission: Mission): Date | null {
  const tryParse = (s?: string | null): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d;
    return null;
  };

  // 1. Date de facture (toujours ISO)
  return tryParse(mission.invoice?.date)
    // 2. Date de la mission si ISO
    ?? tryParse(mission.date)
    // 3. Date de la mission format français ("05 Juin", "12 Mars 2025")
    ?? (mission.date ? parseFrenchDate(mission.date) : null)
    // 4. scheduledDate
    ?? tryParse(mission.scheduledDate)
    // 5. staffValidation date
    ?? tryParse(mission.staffValidation?.validatedAt)
    ?? null;
}

function getMissionMonthKey(mission: Mission): string {
  const d = extractDate(mission);
  if (d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  // Fallback: mois courant
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthKey(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTHS_FR[parseInt(month, 10) - 1]} ${year}`;
}

const STATUS_FILTERS = [
  { id: 'ALL', label: 'Tout' },
  { id: 'ACTION_REQUIRED', label: 'Action requise' },
  { id: 'SCHEDULED', label: 'Acceptée' },
  { id: 'ARCHIVES', label: 'Archives' },
];

interface MissionsTabProps {
  onMissionClick: (missionId: string, status: string) => void;
}

export default function MissionsTab({ onMissionClick }: MissionsTabProps) {
  const { missions } = useMissionsStore();
  const { activeVenueId, venues } = useVenuesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationMission, setValidationMission] = useState<Mission | null>(null);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [candidateMission, setCandidateMission] = useState<Mission | null>(null);
  const [isCandidateOpen, setIsCandidateOpen] = useState(false);
  const [archiveMonthKey, setArchiveMonthKey] = useState<string>(currentMonthKey());
  const [isArchivePickerOpen, setIsArchivePickerOpen] = useState(false);
  const archivePickerRef = useRef<HTMLDivElement>(null);

  // Build archive data: group ALL completed/cancelled missions by month
  const archiveData = useMemo(() => {
    const venueMissions = activeVenueId
      ? missions.filter(m => m.venueId === activeVenueId)
      : missions;
    const archived = venueMissions.filter(m => ['COMPLETED', 'CANCELLED'].includes(m.status));
    const byMonth: Record<string, Mission[]> = {};
    // Toujours inclure le mois en cours
    byMonth[currentMonthKey()] = [];
    for (const m of archived) {
      const key = getMissionMonthKey(m);
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(m);
    }
    const sortedKeys = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));
    const totalCount = archived.length;
    return { byMonth, sortedKeys, totalCount };
  }, [missions, activeVenueId]);

  // Reset to current month when entering archives
  useEffect(() => {
    if (filter === 'ARCHIVES') {
      setArchiveMonthKey(currentMonthKey());
    }
  }, [filter]);

  // Close archive picker on outside click
  useEffect(() => {
    if (!isArchivePickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (archivePickerRef.current && !archivePickerRef.current.contains(e.target as Node)) {
        setIsArchivePickerOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isArchivePickerOpen]);

  const handleMissionClick = (mission: Mission) => {
    if (mission.status === 'AWAITING_PATRON_CONFIRMATION') {
      setValidationMission(mission);
      setIsValidationOpen(true);
      return;
    }
    // Always open MissionDetailsModal (candidates are now integrated inside it)
    setSelectedMission(mission);
    setIsModalOpen(true);
  };

  // Count missions awaiting confirmation
  const awaitingCount = missions.filter(m => m.status === 'AWAITING_PATRON_CONFIRMATION' && (!activeVenueId || m.venueId === activeVenueId)).length;

  const filteredMissions = useMemo(() => {
    // Mode Archives : missions terminées/annulées du mois sélectionné
    if (filter === 'ARCHIVES') {
      const list = archiveData.byMonth[archiveMonthKey] || [];
      if (searchQuery) {
        return list.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return list;
    }

    // Mode normal : missions actives (excluant les archivées des mois passés)
    return missions.filter(m => {
      // 1. Venue Filter
      if (activeVenueId && m.venueId !== activeVenueId) return false;

      // 2. Exclure les terminées/annulées des mois passés
      if (isArchived(m)) return false;

      // 3. Search Filter
      if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // 4. Status Filter
      if (filter === 'ALL') return true;

      if (filter === 'SCHEDULED') {
        return m.status === 'SCHEDULED' || (m.status === 'SEARCHING' && m.scheduled === true);
      }

      if (filter === 'ACTION_REQUIRED') {
        const hasActionStatus = ['PENDING_VALIDATION', 'QUOTE_SENT', 'AWAITING_PATRON_CONFIRMATION', 'SEARCHING'].includes(m.status);
        const hasPendingCandidates = m.scheduled && m.candidates && m.candidates.some(c => c.status === 'PENDING') && m.status !== 'SCHEDULED';
        const needsDPAE = m.category === 'STAFFING' && ['SCHEDULED', 'ON_WAY', 'ON_SITE', 'IN_PROGRESS'].includes(m.status) && m.dpaeStatus !== 'VALIDATED' && m.dpaeStatus !== 'NOT_REQUIRED';
        return hasActionStatus || hasPendingCandidates || needsDPAE;
      }

      if (filter === 'IN_PROGRESS') {
        return ['IN_PROGRESS', 'ON_WAY', 'ON_SITE', 'DIAGNOSING', 'STANDBY'].includes(m.status);
      }

      return m.status === filter;
    });
  }, [missions, activeVenueId, filter, searchQuery, archiveMonthKey, archiveData.byMonth]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || Wrench;
  };

  if (isLoading) return <SkeletonTable />;

  return (
    <div className="h-full flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 md:gap-4 mb-8">
        <div className="text-center md:text-left w-full md:w-auto">
          <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">Missions</h2>
          <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium animate-pulse">Suivez et gérez toutes vos interventions</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border)] w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-[var(--text-primary)] pl-9 w-full md:w-64 placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="w-px h-6 bg-[var(--bg-active)] shrink-0" />
          <button className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-1.5",
              filter === f.id
                ? f.id === 'ARCHIVES'
                  ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white border-slate-500"
                  : "bg-[var(--text-primary)] text-[var(--bg-app)] border-[var(--text-primary)]"
                : "bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            )}
          >
            {f.id === 'ARCHIVES' && <Archive className="w-3.5 h-3.5" />}
            {f.label}
            {f.id === 'ARCHIVES' && archiveData.totalCount > 0 && (
              <span className={clsx(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                filter === 'ARCHIVES' ? "bg-white/20 text-white" : "bg-[var(--bg-active)] text-[var(--text-muted)]"
              )}>
                {archiveData.totalCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Archive Month Picker — visible uniquement quand filtre Archives actif */}
      {filter === 'ARCHIVES' && (
        <div ref={archivePickerRef} className="relative mb-4">
          <button
            onClick={() => setIsArchivePickerOpen(!isArchivePickerOpen)}
            className="w-full flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 hover:border-[var(--border-strong)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-[var(--text-primary)] capitalize">{formatMonthKey(archiveMonthKey)}</span>
              {archiveMonthKey === currentMonthKey() && (
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Mois en cours</span>
              )}
              <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                {archiveData.byMonth[archiveMonthKey]?.length || 0} mission{(archiveData.byMonth[archiveMonthKey]?.length || 0) > 1 ? 's' : ''}
              </span>
            </div>
            <ChevronDown className={clsx("w-4 h-4 text-[var(--text-muted)] transition-transform", isArchivePickerOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {isArchivePickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-30 max-h-64 overflow-y-auto custom-scrollbar"
              >
                {archiveData.sortedKeys.map((key) => {
                  const isSelected = archiveMonthKey === key;
                  const isCurrent = key === currentMonthKey();
                  const count = archiveData.byMonth[key].length;
                  return (
                    <button
                      key={key}
                      onClick={() => { setArchiveMonthKey(key); setIsArchivePickerOpen(false); }}
                      className={clsx(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors capitalize flex items-center justify-between",
                        isSelected
                          ? "bg-blue-600/10 text-blue-400 font-bold"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <span>{formatMonthKey(key)}</span>
                      <div className="flex items-center gap-2">
                        {isCurrent && <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Actuel</span>}
                        <span className={clsx(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          isSelected
                            ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                            : "text-[var(--text-muted)] bg-[var(--bg-hover)] border-[var(--border)]"
                        )}>
                          {count} mission{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Missions Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-1 gap-4">
          {filteredMissions.map((mission) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleMissionClick(mission)}
              className="bg-[var(--bg-card)] rounded-xl p-4 md:p-6 border border-[var(--border)] hover:border-[var(--border-strong)] transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Status Stripe */}
              <div className={clsx(
                "absolute left-0 top-0 bottom-0 w-1",
                mission.status === 'IN_PROGRESS' ? "bg-blue-500" :
                mission.status === 'COMPLETED' ? "bg-green-500" :
                mission.status === 'SCHEDULED' ? "bg-purple-500" :
                mission.status === 'CANCELLED' ? "bg-red-500" :
                mission.status === 'AWAITING_PATRON_CONFIRMATION' ? "bg-amber-500" :
                mission.status === 'PENDING_VALIDATION' ? "bg-amber-500" :
                mission.status === 'QUOTE_SENT' ? "bg-orange-500" :
                mission.status === 'DIAGNOSING' ? "bg-purple-500" :
                mission.status === 'STANDBY' ? "bg-yellow-500" :
                "bg-[var(--bg-active)]"
              )} />

              <div className="flex flex-col md:flex-row justify-between items-start mb-3 md:mb-4 pl-3 md:pl-4 gap-3 md:gap-0">
                <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                  <div className={clsx(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shrink-0",
                    `bg-${mission.color}-500`
                  )}>
                    {(() => {
                      const Icon = getIcon(mission.iconName || 'Wrench');
                      return <Icon className="w-5 h-5 md:w-6 md:h-6" />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base md:text-lg text-[var(--text-primary)] group-hover:text-blue-400 transition-colors truncate">{mission.title}</h3>
                      {/* Badge statut d'emploi (AML Visuals point 8) */}
                      {mission.employmentType === 'EXTRA' && (
                        <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase">
                          Extra CDD
                        </span>
                      )}
                      {mission.employmentType === 'FREELANCE' && (
                        <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                          Auto-entrepreneur
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--text-secondary)] flex-wrap">
                      <span className="font-medium text-[var(--text-secondary)] truncate">{mission.category}</span>
                      <span className="shrink-0">•</span>
                      <span className="shrink-0">{mission.date ? new Date(mission.date).toLocaleDateString('fr-FR') : "Aujourd'hui"}</span>
                      {mission.venue && (
                        <>
                          <span className="shrink-0">•</span>
                          <span className="shrink-0 truncate">{mission.venue}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-1 md:mt-0 gap-1">
                  <p className="font-bold text-[var(--text-primary)] text-base md:text-lg order-2 md:order-1">{mission.price}</p>
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider order-1 md:order-2",
                    mission.status === 'IN_PROGRESS' ? "bg-blue-500/20 text-blue-400" :
                    mission.status === 'COMPLETED' ? "bg-green-500/20 text-green-400" :
                    mission.status === 'SCHEDULED' ? "bg-purple-500/20 text-purple-400" :
                    mission.status === 'AWAITING_PATRON_CONFIRMATION' ? "bg-amber-500/20 text-amber-400" :
                    mission.status === 'PENDING_VALIDATION' ? "bg-amber-500/20 text-amber-400" :
                    mission.status === 'QUOTE_SENT' ? "bg-orange-500/20 text-orange-400" :
                    mission.status === 'DIAGNOSING' ? "bg-purple-500/20 text-purple-400" :
                    mission.status === 'STANDBY' ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-[var(--bg-active)] text-[var(--text-secondary)]"
                  )}>
                    {(mission.status === 'IN_PROGRESS' || mission.status === 'PENDING_VALIDATION' || mission.status === 'QUOTE_SENT' || mission.status === 'AWAITING_PATRON_CONFIRMATION') && <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", mission.status === 'AWAITING_PATRON_CONFIRMATION' ? 'bg-amber-400' : mission.status === 'PENDING_VALIDATION' ? 'bg-amber-400' : mission.status === 'QUOTE_SENT' ? 'bg-orange-400' : 'bg-blue-400')} />}
                    {mission.status === 'AWAITING_PATRON_CONFIRMATION' ? 'À confirmer' :
                     mission.status === 'IN_PROGRESS' ? 'En cours' :
                     mission.status === 'COMPLETED' ? 'Archivée' :
                     mission.status === 'SCHEDULED' ? 'Acceptée' :
                     mission.status === 'PENDING_VALIDATION' ? 'À valider' :
                     mission.status === 'QUOTE_SENT' ? 'Devis reçu' :
                     mission.status === 'DIAGNOSING' ? 'Diagnostic' :
                     mission.status === 'STANDBY' ? 'Attente pièce' :
                     'En attente'}
                  </span>
                  {mission.paymentStatus && mission.paymentStatus !== 'NONE' && (
                    <span className={clsx(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase order-3",
                      mission.paymentStatus === 'AUTHORIZED' ? "bg-blue-500/10 text-blue-400" :
                      mission.paymentStatus === 'CAPTURED' ? "bg-emerald-500/10 text-emerald-400" :
                      mission.paymentStatus === 'RELEASED' ? "bg-[var(--bg-active)] text-[var(--text-muted)]" :
                      mission.paymentStatus === 'REFUNDED' ? "bg-red-500/10 text-red-400" :
                      mission.paymentStatus === 'FAILED' ? "bg-red-500/10 text-red-400" :
                      "bg-[var(--bg-active)] text-[var(--text-muted)]"
                    )}>
                      {mission.paymentStatus === 'AUTHORIZED' ? '💳 Bloqué' :
                       mission.paymentStatus === 'CAPTURED' ? '✓ Payé' :
                       mission.paymentStatus === 'RELEASED' ? 'Libéré' :
                       mission.paymentStatus === 'REFUNDED' ? 'Remboursé' :
                       mission.paymentStatus === 'FAILED' ? 'Échec' :
                       'En attente'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6 pl-3 md:pl-4 text-xs md:text-sm text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{venues.find(v => v.id === mission.venueId)?.name || mission.location?.address || 'Non assigné'}</span>
                </div>
                {mission.expert && mission.expert !== 'En attente' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] md:text-xs text-white font-bold">
                      {mission.expert.charAt(0)}
                    </div>
                    {mission.expert}
                  </div>
                )}
              </div>

              {/* Action chips — intégrés dans le flow */}
              {(() => {
                const pendingCandidates = mission.scheduled && mission.candidates && mission.status !== 'SCHEDULED'
                  ? mission.candidates.filter(c => c.status === 'PENDING').length
                  : 0;
                const showConfirm = mission.status === 'AWAITING_PATRON_CONFIRMATION';
                const showQuote = mission.status === 'QUOTE_SENT';
                const showValidation = mission.status === 'PENDING_VALIDATION';
                const showSearching = mission.status === 'SEARCHING' && !mission.scheduled;

                if (!pendingCandidates && !showConfirm && !showQuote && !showValidation && !showSearching) return null;

                return (
                  <div className="flex flex-wrap gap-2 mt-3 pl-3 md:pl-4">
                    {pendingCandidates > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] font-bold text-purple-400">
                        <Users className="w-3 h-3" />
                        {pendingCandidates} candidature{pendingCandidates > 1 ? 's' : ''}
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      </span>
                    )}
                    {showConfirm && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-400">
                        <UserCheck className="w-3 h-3" />
                        Prestataire à confirmer
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      </span>
                    )}
                    {showQuote && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[11px] font-bold text-orange-400">
                        Devis à consulter
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      </span>
                    )}
                    {showValidation && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-400">
                        Présence à valider
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      </span>
                    )}
                    {showSearching && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-400">
                        <Search className="w-3 h-3" />
                        En recherche
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      </span>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          ))}
          
          {filteredMissions.length === 0 && (
            filter === 'ARCHIVES' ? (
              <EmptyState
                icon={Archive}
                title="Aucune mission archivée"
                description={`Aucune mission terminée ou annulée pour ${formatMonthKey(archiveMonthKey)}.`}
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="Aucune mission"
                description="Créez votre première mission pour trouver un prestataire."
                actionLabel="Créer une mission"
                onAction={() => window.dispatchEvent(new CustomEvent('open-create-mission'))}
              />
            )
          )}

          {/* Total récapitulatif en bas de liste (AML Visuals retour produit) */}
          {filteredMissions.length > 0 && (
            <div className="mt-2 p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-between">
              <div className="text-sm">
                <p className="font-bold text-[var(--text-primary)]">
                  Total · {filteredMissions.length} demande{filteredMissions.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {filter === 'ARCHIVES' ? formatMonthKey(archiveMonthKey) : 'Filtre actif'}
                </p>
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {(() => {
                  const total = filteredMissions.reduce((sum, m) => {
                    const p = typeof m.price === 'number'
                      ? m.price
                      : parseFloat(String(m.price || '0').replace(/[^\d.]/g, '')) || 0;
                    return sum + p;
                  }, 0);
                  return total.toFixed(0) + ' €';
                })()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-create-mission'))}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isModalOpen && selectedMission && (
        <MissionDetailsModal
          mission={missions.find(m => m.id === selectedMission.id) || selectedMission}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <WorkerValidationModal
        mission={validationMission ? missions.find(m => m.id === validationMission.id) || validationMission : null}
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
      />

      <CandidateReviewModal
        mission={candidateMission ? missions.find(m => m.id === candidateMission.id) || candidateMission : null}
        isOpen={isCandidateOpen}
        onClose={() => setIsCandidateOpen(false)}
        onOpenMissionDetails={(missionId) => {
          const m = missions.find(mi => mi.id === missionId);
          if (m) {
            setSelectedMission(m);
            setIsModalOpen(true);
          }
        }}
      />
    </div>
  );
}
