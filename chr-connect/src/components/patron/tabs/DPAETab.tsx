'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, FileText, Download, Printer, Clock,
  CheckCircle2, AlertCircle, Send, Users, ChevronRight,
  Crown, FileSignature, ShieldCheck, Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { SkeletonTable } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { useDPAEStore } from '@/store/useDPAEStore';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { useStore } from '@/store/useStore';
import { Mission } from '@/types/missions';
import { DPAEDeclaration } from '@/types/dpae';
import { downloadContract, printContract } from '@/lib/dpae-contract-generator';
import DPAEWizard from '../dpae/DPAEWizard';

type StatusFilter = 'ALL' | 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'ERROR';

const STATUS_CONFIG: Record<DPAEDeclaration['status'], { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Brouillon', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: Clock },
  SUBMITTED: { label: 'Envoyee', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Send },
  ACKNOWLEDGED: { label: 'Validee', color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: CheckCircle2 },
  ERROR: { label: 'Erreur', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: AlertCircle },
};

export default function DPAETab() {
  const { isPremium } = useStore();
  const { declarations } = useDPAEStore();
  const { missions } = useMissionsStore();
  const { activeVenueId } = useVenuesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showWizard, setShowWizard] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | undefined>(undefined);

  // Missions with confirmed workers that don't have a DPAE yet
  const pendingMissions = useMemo(() => {
    const declaredMissionIds = new Set(declarations.map(d => d.missionId).filter(Boolean));
    return missions.filter(m => {
      if (activeVenueId && m.venueId !== activeVenueId) return false;
      if (declaredMissionIds.has(m.id)) return false;
      // Missions with a confirmed worker (staffing missions in active statuses)
      const hasWorker = m.provider || m.pendingWorker;
      const isActiveStatus = ['ON_WAY', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'PENDING_VALIDATION', 'SCHEDULED'].includes(m.status);
      return hasWorker && isActiveStatus;
    });
  }, [missions, declarations, activeVenueId]);

  // Filtered declarations for history
  const filteredDeclarations = useMemo(() => {
    return declarations.filter(d => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = `${d.employeeFirstName} ${d.employeeLastName}`.toLowerCase().includes(q);
        const matchesRef = d.urssafReference?.toLowerCase().includes(q);
        const matchesJob = d.jobTitle.toLowerCase().includes(q);
        if (!matchesName && !matchesRef && !matchesJob) return false;
      }
      return true;
    });
  }, [declarations, statusFilter, searchQuery]);

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
    setShowWizard(true);
  };

  const handleNewDPAE = () => {
    setSelectedMission(undefined);
    setShowWizard(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const activeVenue = useVenuesStore.getState().venues.find(v => v.id === activeVenueId);

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="h-full flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full -ml-10 -mb-10" />

          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-8 h-8 text-black" />
            </div>

            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Fonctionnalite Premium
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              La DPAE et la generation de contrats CDD sont reservees aux abonnes Premium.
            </p>

            <div className="space-y-3 text-left mb-8">
              {[
                { icon: FileSignature, text: 'Declaration URSSAF automatisee en quelques clics' },
                { icon: Zap, text: 'Generation instantanee du contrat CDD conforme' },
                { icon: ShieldCheck, text: 'Conformite legale et suivi des declarations' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm text-[var(--text-primary)] font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('set-patron-tab', { detail: 'PREMIUM' }))}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Passer Premium — 100 EUR/mois
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isLoading) return <SkeletonTable />;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 md:gap-4 mb-8">
        <div className="text-center md:text-left w-full md:w-auto">
          <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">
            DPAE
          </h2>
          <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium">
            Declarations Prealables a l&apos;Embauche
          </p>
        </div>

        <button
          onClick={handleNewDPAE}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle DPAE
        </button>
      </div>

      {/* Pending Missions Section */}
      {pendingMissions.length > 0 && (
        <section className="mb-8">
          <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Missions en attente de DPAE
            <span className="ml-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full">
              {pendingMissions.length}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingMissions.map((mission) => (
              <motion.button
                key={mission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleMissionClick(mission)}
                className="bg-[var(--bg-card)] rounded-xl p-4 border border-amber-500/20 hover:border-amber-500/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[var(--text-primary)] truncate group-hover:text-blue-500 transition-colors">
                      {mission.title}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {mission.provider?.name || mission.pendingWorker?.name || 'Worker confirme'}
                      {mission.date && ` — ${mission.date}`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-amber-400 transition-colors shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* History Section */}
      <section className="flex-1 flex flex-col min-h-0">
        <h3 className="font-bold text-[var(--text-primary)] mb-4">Historique des declarations</h3>

        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Rechercher par nom, reference, poste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['ALL', 'ACKNOWLEDGED', 'SUBMITTED', 'DRAFT', 'ERROR'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border',
                  statusFilter === status
                    ? 'bg-[var(--text-primary)] text-[var(--bg-app)] border-[var(--text-primary)]'
                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]'
                )}
              >
                {status === 'ALL' ? 'Tout' : STATUS_CONFIG[status].label}
              </button>
            ))}
          </div>
        </div>

        {/* Declarations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-3">
            {filteredDeclarations.map((declaration) => {
              const statusCfg = STATUS_CONFIG[declaration.status];
              const StatusIcon = statusCfg.icon;
              return (
                <motion.div
                  key={declaration.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--border-strong)] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', statusCfg.color)}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[var(--text-primary)] truncate">
                          {declaration.employeeFirstName} {declaration.employeeLastName}
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {declaration.jobTitle} — {declaration.startDate}
                          {declaration.endDate && ` au ${declaration.endDate}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={clsx('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      {declaration.urssafReference && (
                        <span className="font-mono">{declaration.urssafReference}</span>
                      )}
                      <span>{declaration.employerName}</span>
                      <span>{declaration.hourlyRate.toFixed(2)} EUR/h</span>
                    </div>

                    {declaration.status === 'ACKNOWLEDGED' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadContract(declaration)}
                          className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors"
                          title="Telecharger le contrat"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => printContract(declaration)}
                          className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors"
                          title="Imprimer le contrat"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {filteredDeclarations.length === 0 && (
              <EmptyState
                icon={FileSignature}
                title="Aucune déclaration DPAE"
                description="Les déclarations DPAE apparaîtront ici après confirmation de vos missions."
              />
            )}
          </div>
        </div>
      </section>

      {/* DPAE Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <DPAEWizard
            isOpen={showWizard}
            onClose={() => { setShowWizard(false); setSelectedMission(undefined); }}
            mission={selectedMission}
            establishmentName={activeVenue?.name}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
