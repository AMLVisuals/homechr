'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, FileWarning, X } from 'lucide-react';
import { useState } from 'react';
import type { ComplianceDocument } from '@/types/compliance';

interface ComplianceAlertProps {
  expiringDocs: ComplianceDocument[];
  expiredDocs: ComplianceDocument[];
  onDismiss?: () => void;
}

const DOC_LABELS: Record<string, string> = {
  IDENTITY: "Pièce d'identité",
  ATTESTATION_PRO_KBIS: 'Attestation Pro / Kbis',
  URSSAF_ATTESTATION: 'Attestation URSSAF',
  RC_PRO: 'RC Professionnelle',
  RIB: 'RIB / IBAN',
  SOCIAL_SECURITY_CARD: 'Carte Vitale / Attestation sécu',
  CERTIFICATIONS: 'Certifications / Diplômes',
};

export default function ComplianceAlert({ expiringDocs, expiredDocs, onDismiss }: ComplianceAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (expiringDocs.length === 0 && expiredDocs.length === 0)) {
    return null;
  }

  const hasExpired = expiredDocs.length > 0;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative rounded-xl p-4 ${
        hasExpired
          ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
          : 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      }`}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
      >
        <X className="w-4 h-4 text-[var(--text-muted)]" />
      </button>

      <div className="flex items-start gap-3">
        {hasExpired ? (
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${
            hasExpired ? 'text-red-800 dark:text-red-300' : 'text-yellow-800 dark:text-yellow-300'
          }`}>
            {hasExpired ? 'Documents expirés' : 'Documents bientôt expirés'}
          </h4>

          {expiredDocs.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {expiredDocs.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
                  <FileWarning className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium">{DOC_LABELS[doc.type] || doc.type}</span>
                  <span className="text-red-500">— expiré le {new Date(doc.expiresAt).toLocaleDateString('fr-FR')}</span>
                </li>
              ))}
            </ul>
          )}

          {expiringDocs.length > 0 && (
            <ul className={`${expiredDocs.length > 0 ? 'mt-2' : 'mt-1.5'} space-y-1`}>
              {expiringDocs.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium">{DOC_LABELS[doc.type] || doc.type}</span>
                  <span className="text-yellow-600">— expire le {new Date(doc.expiresAt).toLocaleDateString('fr-FR')}</span>
                </li>
              ))}
            </ul>
          )}

          {hasExpired && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Mettez à jour vos documents pour continuer à accepter des missions.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
