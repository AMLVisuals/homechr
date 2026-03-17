'use client';

import { useMemo, useState } from 'react';
import { Wrench, AlertTriangle, Clock, ChevronDown, ChevronUp, PlusCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import type { Equipment, EquipmentCategory } from '@/types/equipment';

// ============================================================================
// RECOMMENDED MAINTENANCE FREQUENCIES (in days)
// ============================================================================

const MAINTENANCE_FREQUENCY_DAYS: Partial<Record<EquipmentCategory, number>> = {
  FRIDGE: 180,          // 6 mois
  FREEZER: 180,         // 6 mois
  COLD_ROOM: 90,        // 3 mois
  COFFEE_MACHINE: 90,   // 3 mois
  OVEN: 180,            // 6 mois
  DISHWASHER: 180,      // 6 mois
  ICE_MACHINE: 120,     // 4 mois
  BEER_TAP: 90,         // 3 mois
  VENTILATION: 180,     // 6 mois — nettoyage hottes
  COOKING: 365,         // 1 an
};

const CATEGORY_LABELS: Partial<Record<EquipmentCategory, string>> = {
  FRIDGE: 'Réfrigérateur',
  FREEZER: 'Congélateur',
  COLD_ROOM: 'Chambre froide',
  COFFEE_MACHINE: 'Machine à café',
  OVEN: 'Four',
  DISHWASHER: 'Lave-vaisselle',
  ICE_MACHINE: 'Machine à glaçons',
  BEER_TAP: 'Tireuse à bière',
  VENTILATION: 'Hotte / Ventilation',
  COOKING: 'Plaque / Friteuse',
};

// ============================================================================
// TYPES
// ============================================================================

interface MaintenanceAlert {
  equipment: Equipment;
  daysOverdue: number;
  recommendedFrequencyDays: number;
  lastServiceDate: string;
  level: 'OVERDUE' | 'DUE_SOON' | 'INFO';
}

// ============================================================================
// COMPUTATION
// ============================================================================

function computeMaintenanceAlerts(equipment: Equipment[]): MaintenanceAlert[] {
  const now = new Date();
  const alerts: MaintenanceAlert[] = [];

  for (const eq of equipment) {
    if (eq.isDeleted || eq.status === 'FAULT' || eq.status === 'MAINTENANCE') continue;

    const frequency = MAINTENANCE_FREQUENCY_DAYS[eq.category];
    if (!frequency) continue; // No recommendation for this category

    const lastService = eq.lastServiceDate ? new Date(eq.lastServiceDate) : null;
    if (!lastService) continue; // No service history

    const daysSinceService = Math.floor((now.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24));
    const daysOverdue = daysSinceService - frequency;

    if (daysOverdue > 30) {
      // Significantly overdue (>1 month past recommended)
      alerts.push({
        equipment: eq,
        daysOverdue,
        recommendedFrequencyDays: frequency,
        lastServiceDate: eq.lastServiceDate!,
        level: 'OVERDUE',
      });
    } else if (daysOverdue > 0) {
      // Recently overdue
      alerts.push({
        equipment: eq,
        daysOverdue,
        recommendedFrequencyDays: frequency,
        lastServiceDate: eq.lastServiceDate!,
        level: 'DUE_SOON',
      });
    } else if (daysOverdue > -15) {
      // Due within 15 days
      alerts.push({
        equipment: eq,
        daysOverdue,
        recommendedFrequencyDays: frequency,
        lastServiceDate: eq.lastServiceDate!,
        level: 'INFO',
      });
    }
  }

  // Sort: most overdue first
  alerts.sort((a, b) => b.daysOverdue - a.daysOverdue);

  return alerts;
}

function formatFrequency(days: number): string {
  if (days >= 365) return `${Math.round(days / 365)} an`;
  if (days >= 30) return `${Math.round(days / 30)} mois`;
  return `${days} jours`;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface MaintenanceAlertsBannerProps {
  onCreateMission?: (equipmentId: string, equipmentName: string) => void;
}

export default function MaintenanceAlertsBanner({ onCreateMission }: MaintenanceAlertsBannerProps) {
  const equipment = useEquipmentStore((s) => s.equipment);
  const alerts = useMemo(() => computeMaintenanceAlerts(equipment), [equipment]);
  const [expanded, setExpanded] = useState(false);

  if (alerts.length === 0) return null;

  const overdueCount = alerts.filter(a => a.level === 'OVERDUE').length;
  const dueSoonCount = alerts.filter(a => a.level === 'DUE_SOON').length;
  const hasOverdue = overdueCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'rounded-2xl border overflow-hidden',
        hasOverdue
          ? 'bg-orange-500/10 border-orange-500/20'
          : 'bg-blue-500/10 border-blue-500/20'
      )}
    >
      {/* Summary */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <div className={clsx(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
          hasOverdue ? 'bg-orange-500/20' : 'bg-blue-500/20'
        )}>
          <Wrench className={clsx('w-4 h-4', hasOverdue ? 'text-orange-400' : 'text-blue-400')} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-bold', hasOverdue ? 'text-orange-400' : 'text-blue-400')}>
            {hasOverdue
              ? `${overdueCount} maintenance${overdueCount > 1 ? 's' : ''} en retard`
              : `${dueSoonCount} maintenance${dueSoonCount > 1 ? 's' : ''} à planifier`}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {alerts.length} équipement{alerts.length > 1 ? 's' : ''} nécessite{alerts.length > 1 ? 'nt' : ''} une attention
          </p>
        </div>
        <div className={clsx('shrink-0', hasOverdue ? 'text-orange-400' : 'text-blue-400')}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {alerts.map((alert) => {
                const eqName = alert.equipment.nickname
                  || `${alert.equipment.brand} ${alert.equipment.model}`;
                const catLabel = CATEGORY_LABELS[alert.equipment.category] || alert.equipment.category;
                const lastDate = new Date(alert.lastServiceDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

                return (
                  <div
                    key={alert.equipment.id}
                    className={clsx(
                      'flex items-start gap-3 p-3 rounded-xl border bg-[var(--bg-card)]',
                      alert.level === 'OVERDUE' ? 'border-orange-500/20' :
                      alert.level === 'DUE_SOON' ? 'border-amber-500/20' :
                      'border-[var(--border)]'
                    )}
                  >
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                      alert.level === 'OVERDUE' ? 'bg-orange-500/10' :
                      alert.level === 'DUE_SOON' ? 'bg-amber-500/10' :
                      'bg-blue-500/10'
                    )}>
                      {alert.level === 'OVERDUE'
                        ? <AlertTriangle className="w-4 h-4 text-orange-400" />
                        : <Clock className="w-4 h-4 text-amber-400" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{eqName}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)]">
                          {catLabel}
                        </span>
                        {alert.level === 'OVERDUE' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                            +{alert.daysOverdue}j de retard
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Dernière : {lastDate}
                        </span>
                        <span>•</span>
                        <span>Fréq. recommandée : {formatFrequency(alert.recommendedFrequencyDays)}</span>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {alert.equipment.location}
                      </p>
                    </div>

                    {/* 1-click create mission button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateMission?.(alert.equipment.id, eqName);
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Créer mission</span>
                      <span className="sm:hidden">Mission</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
