'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Clock, ShieldOff, FileText, ChevronDown, ChevronUp, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { ComplianceDocument, ComplianceDocType } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

type AlertLevel = 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'INFO';

interface DocumentAlert {
  document: ComplianceDocument;
  level: AlertLevel;
  daysUntilExpiry: number;
  label: string;
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DOC_LABELS: Record<ComplianceDocType, string> = {
  IDENTITY: 'Pièce d\'identité',
  ATTESTATION_PRO_KBIS: 'Attestation Pro / Kbis',
  URSSAF_ATTESTATION: 'Attestation URSSAF',
  RC_PRO: 'Assurance RC Pro',
  RIB: 'RIB',
  SOCIAL_SECURITY_CARD: 'Carte Vitale',
  CERTIFICATIONS: 'Certifications',
};

const ALERT_CONFIG: Record<AlertLevel, { color: string; bgColor: string; borderColor: string; icon: typeof AlertTriangle }> = {
  EXPIRED: { color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', icon: ShieldOff },
  CRITICAL: { color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', icon: AlertTriangle },
  WARNING: { color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', icon: Clock },
  INFO: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', icon: Clock },
};

// ============================================================================
// ALERT COMPUTATION
// ============================================================================

function computeAlerts(documents: ComplianceDocument[]): DocumentAlert[] {
  const now = new Date();
  const alerts: DocumentAlert[] = [];

  for (const doc of documents) {
    if (!doc.expiresAt) continue;

    const expiryDate = new Date(doc.expiresAt);
    const diffMs = expiryDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const label = DOC_LABELS[doc.type] || doc.type;

    if (daysUntilExpiry < 0) {
      // Already expired
      alerts.push({
        document: doc,
        level: 'EXPIRED',
        daysUntilExpiry,
        label,
        message: `Expiré depuis ${Math.abs(daysUntilExpiry)} jour${Math.abs(daysUntilExpiry) > 1 ? 's' : ''} — Votre profil est désactivé`,
      });
    } else if (daysUntilExpiry <= 7) {
      // J-7 critical
      alerts.push({
        document: doc,
        level: 'CRITICAL',
        daysUntilExpiry,
        label,
        message: `Expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''} — Renouvellement urgent`,
      });
    } else if (daysUntilExpiry <= 15) {
      // J-15 warning
      alerts.push({
        document: doc,
        level: 'WARNING',
        daysUntilExpiry,
        label,
        message: `Expire dans ${daysUntilExpiry} jours — Pensez à renouveler`,
      });
    } else if (daysUntilExpiry <= 30) {
      // J-30 info
      alerts.push({
        document: doc,
        level: 'INFO',
        daysUntilExpiry,
        label,
        message: `Expire dans ${daysUntilExpiry} jours`,
      });
    }
  }

  // Sort: expired first, then by days ascending
  alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  return alerts;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface DocumentExpiryBannerProps {
  documents?: ComplianceDocument[];
}

export default function DocumentExpiryBanner({ documents }: DocumentExpiryBannerProps) {
  const docs = documents || [];
  const alerts = useMemo(() => computeAlerts(docs), [docs]);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.document.id));

  if (visibleAlerts.length === 0) return null;

  const hasExpired = visibleAlerts.some(a => a.level === 'EXPIRED');
  const hasCritical = visibleAlerts.some(a => a.level === 'CRITICAL');
  const worstLevel: AlertLevel = hasExpired ? 'EXPIRED' : hasCritical ? 'CRITICAL' : visibleAlerts[0].level;
  const config = ALERT_CONFIG[worstLevel];
  const Icon = config.icon;

  const profileDeactivated = hasExpired;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'rounded-2xl border overflow-hidden',
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Summary bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', config.bgColor)}>
          <Icon className={clsx('w-4 h-4', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-bold', config.color)}>
            {profileDeactivated
              ? 'Profil désactivé — Document expiré'
              : `${visibleAlerts.length} document${visibleAlerts.length > 1 ? 's' : ''} à renouveler`}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {profileDeactivated
              ? 'Vous ne pouvez plus accepter de missions tant que vos documents ne sont pas à jour.'
              : 'Cliquez pour voir les détails'}
          </p>
        </div>
        <div className={clsx('shrink-0', config.color)}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded details */}
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
              {visibleAlerts.map((alert) => {
                const alertConfig = ALERT_CONFIG[alert.level];
                const AlertIcon = alertConfig.icon;
                const expiryDate = new Date(alert.document.expiresAt);

                return (
                  <div
                    key={alert.document.id}
                    className={clsx(
                      'flex items-start gap-3 p-3 rounded-xl border bg-[var(--bg-card)]',
                      alertConfig.borderColor
                    )}
                  >
                    <AlertIcon className={clsx('w-4 h-4 shrink-0 mt-0.5', alertConfig.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{alert.label}</span>
                        <span className={clsx(
                          'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full',
                          alert.level === 'EXPIRED' ? 'bg-red-500/20 text-red-400' :
                          alert.level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                          alert.level === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        )}>
                          {alert.level === 'EXPIRED' ? 'Expiré' : `J-${alert.daysUntilExpiry}`}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{alert.message}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        {alert.level === 'EXPIRED'
                          ? `Expiré le ${expiryDate.toLocaleDateString('fr-FR')}`
                          : `Expire le ${expiryDate.toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        Renouveler
                      </button>
                      {alert.level !== 'EXPIRED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDismissed(prev => [...prev, alert.document.id]); }}
                          className="p-1 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
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
