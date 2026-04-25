'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, UserCheck, Users, FileText, ClipboardCheck,
  ShieldAlert, ChevronRight, Bell, Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { Mission } from '@/types/missions';

interface ActionAlert {
  id: string;
  missionId: string;
  missionTitle: string;
  type: 'DPAE_REQUIRED' | 'AWAITING_CONFIRMATION' | 'CANDIDATES_PENDING' | 'QUOTE_RECEIVED' | 'VALIDATION_REQUIRED';
  icon: typeof AlertTriangle;
  label: string;
  description: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
  dotColor: string;
}

function buildAlerts(missions: Mission[], activeVenueId: string | null): ActionAlert[] {
  const alerts: ActionAlert[] = [];

  const filtered = activeVenueId
    ? missions.filter(m => m.venueId === activeVenueId)
    : missions;

  for (const m of filtered) {
    // DPAE obligatoire non fait (missions staff en cours ou confirmées sans DPAE validé)
    if (
      m.category === 'STAFFING' &&
      ['IN_PROGRESS', 'ON_WAY', 'ON_SITE', 'SCHEDULED'].includes(m.status) &&
      m.dpaeStatus !== 'VALIDATED' && m.dpaeStatus !== 'NOT_REQUIRED'
    ) {
      alerts.push({
        id: `dpae-${m.id}`,
        missionId: m.id,
        missionTitle: m.title,
        type: 'DPAE_REQUIRED',
        icon: ShieldAlert,
        label: 'DPAE obligatoire',
        description: `${m.title} — À effectuer avant démarrage`,
        gradient: 'from-red-500/15 to-rose-500/10',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400',
        dotColor: 'bg-red-500',
      });
    }

    // Prestataire trouvé, à confirmer
    if (m.status === 'AWAITING_PATRON_CONFIRMATION') {
      alerts.push({
        id: `confirm-${m.id}`,
        missionId: m.id,
        missionTitle: m.title,
        type: 'AWAITING_CONFIRMATION',
        icon: UserCheck,
        label: 'Prestataire à confirmer',
        description: `${m.title} — ${m.pendingWorker?.name || 'Un prestataire'} a accepté`,
        gradient: 'from-amber-500/15 to-orange-500/10',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        dotColor: 'bg-amber-500',
      });
    }

    // Candidatures en attente (missions planifiées)
    if (m.scheduled && m.candidates && m.status !== 'SCHEDULED') {
      const pendingCount = m.candidates.filter(c => c.status === 'PENDING').length;
      if (pendingCount > 0) {
        alerts.push({
          id: `candidates-${m.id}`,
          missionId: m.id,
          missionTitle: m.title,
          type: 'CANDIDATES_PENDING',
          icon: Users,
          label: `${pendingCount} candidature${pendingCount > 1 ? 's' : ''}`,
          description: `${m.title} — À consulter et sélectionner`,
          gradient: 'from-purple-500/15 to-blue-500/10',
          borderColor: 'border-purple-500/30',
          iconColor: 'text-purple-400',
          dotColor: 'bg-purple-500',
        });
      }
    }

    // Devis reçu
    if (m.status === 'QUOTE_SENT') {
      alerts.push({
        id: `quote-${m.id}`,
        missionId: m.id,
        missionTitle: m.title,
        type: 'QUOTE_RECEIVED',
        icon: FileText,
        label: 'Devis reçu',
        description: `${m.title} — À accepter ou refuser`,
        gradient: 'from-orange-500/15 to-yellow-500/10',
        borderColor: 'border-orange-500/30',
        iconColor: 'text-orange-400',
        dotColor: 'bg-orange-500',
      });
    }

    // SEARCHING n'est PAS une action requise du patron (la plateforme cherche
    // le prestataire). Affichage retire de cette banniere ; l'onglet Missions
    // garde un badge "En recherche" pour la visibilite.

    // Mission en attente de pièces (STANDBY)
    if (m.status === 'STANDBY') {
      alerts.push({
        id: `standby-${m.id}`,
        missionId: m.id,
        missionTitle: m.title,
        type: 'VALIDATION_REQUIRED',
        icon: AlertTriangle,
        label: 'En attente de pièces',
        description: `${m.title} — ${m.partsDescription || 'Pièce(s) en commande'}`,
        gradient: 'from-yellow-500/15 to-orange-500/10',
        borderColor: 'border-yellow-500/30',
        iconColor: 'text-yellow-400',
        dotColor: 'bg-yellow-500',
      });
    }

    // Validation présence requise (le prestataire est arrivé sur place)
    if (m.status === 'PENDING_VALIDATION') {
      alerts.push({
        id: `validate-${m.id}`,
        missionId: m.id,
        missionTitle: m.title,
        type: 'VALIDATION_REQUIRED',
        icon: ClipboardCheck,
        label: 'Validation requise',
        description: `${m.title} — Le prestataire est sur place, confirmez sa présence`,
        gradient: 'from-amber-500/15 to-yellow-500/10',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        dotColor: 'bg-amber-500',
      });
    }
  }

  return alerts;
}

interface ActionAlertsBannerProps {
  onNavigateToMission: (missionId: string) => void;
  onNavigateToMissions: () => void;
}

export default function ActionAlertsBanner({ onNavigateToMission, onNavigateToMissions }: ActionAlertsBannerProps) {
  const { missions } = useMissionsStore();
  const { activeVenueId } = useVenuesStore();

  const alerts = useMemo(() => buildAlerts(missions, activeVenueId), [missions, activeVenueId]);

  if (alerts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-red-400" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
              {alerts.length}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-[var(--text-primary)]">
              Action{alerts.length > 1 ? 's' : ''} requise{alerts.length > 1 ? 's' : ''}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {alerts.length} mission{alerts.length > 1 ? 's' : ''} nécessite{alerts.length > 1 ? 'nt' : ''} votre attention
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToMissions}
          className="text-sm text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1 transition-colors"
        >
          Voir tout
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {alerts.slice(0, 4).map((alert, index) => (
            <motion.button
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigateToMission(alert.missionId)}
              className={clsx(
                "w-full text-left p-4 rounded-2xl border transition-all group",
                "bg-gradient-to-r hover:scale-[1.01] active:scale-[0.99]",
                alert.gradient,
                alert.borderColor,
                "hover:shadow-lg"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className={clsx("w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center")}>
                    <alert.icon className={clsx("w-5 h-5", alert.iconColor)} />
                  </div>
                  <div className={clsx("absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse", alert.dotColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={clsx("text-xs font-bold uppercase tracking-wider", alert.iconColor)}>
                      {alert.label}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] truncate">
                    {alert.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {alerts.length > 4 && (
          <button
            onClick={onNavigateToMissions}
            className="w-full py-2.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider"
          >
            + {alerts.length - 4} autre{alerts.length - 4 > 1 ? 's' : ''} action{alerts.length - 4 > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </motion.section>
  );
}
