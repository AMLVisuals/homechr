'use client';

import { motion } from 'framer-motion';
import { Lock, ShieldAlert, FileCheck, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FlowType } from '@/store/mission-engine';
import type { DPAEMissionStatus } from '@/types/compliance';

interface MissionStartGateProps {
  flowType: FlowType;
  // STAFF gate
  dpaeStatus: DPAEMissionStatus;
  // TECH gate
  complianceVerified: boolean;
  complianceReason?: string;
  // Actions
  onRequestDPAE?: () => void;
  onViewCompliance?: () => void;
}

/**
 * Affiche un blocage si les conditions légales ne sont pas remplies
 * pour démarrer la mission.
 * - STAFF : DPAE doit être validée
 * - TECH : Compliance freelance doit être vérifiée
 * Retourne null si tout est OK (pas de blocage).
 */
export default function MissionStartGate({
  flowType,
  dpaeStatus,
  complianceVerified,
  complianceReason,
  onRequestDPAE,
  onViewCompliance,
}: MissionStartGateProps) {
  // STAFF flow : check DPAE
  if (flowType === 'STAFF') {
    if (dpaeStatus === 'VALIDATED' || dpaeStatus === 'NOT_REQUIRED') {
      return null; // OK, pas de blocage
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border-2 border-dashed border-yellow-300 bg-yellow-50/80 dark:bg-yellow-900/20 dark:border-yellow-700 p-5"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          {dpaeStatus === 'PENDING' && (
            <>
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-yellow-600 animate-spin" />
              </div>
              <h4 className="text-base font-bold text-yellow-800 dark:text-yellow-300">
                DPAE en cours de validation
              </h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 max-w-xs">
                La Déclaration Préalable à l'Embauche a été soumise à l'URSSAF.
                La mission sera débloquée dès réception de l'accusé.
              </p>
            </>
          )}

          {dpaeStatus === 'ERROR' && (
            <>
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h4 className="text-base font-bold text-red-800 dark:text-red-300">
                Erreur DPAE
              </h4>
              <p className="text-xs text-red-700 dark:text-red-400 max-w-xs">
                La déclaration URSSAF a échoué. Le patron doit resoumettre la DPAE.
              </p>
            </>
          )}

          <div className="flex items-center gap-2 mt-1">
            <Lock className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Mission verrouillée
            </span>
          </div>

          {onRequestDPAE && dpaeStatus !== 'PENDING' && (
            <Button
              onClick={onRequestDPAE}
              size="sm"
              variant="outline"
              className="mt-2 border-yellow-400 text-yellow-700 hover:bg-yellow-100"
            >
              <FileCheck className="w-4 h-4 mr-1" />
              Demander la DPAE au patron
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // TECH flow : check compliance
  if (flowType === 'TECH') {
    if (complianceVerified) {
      return null; // OK, pas de blocage
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/80 dark:bg-orange-900/20 dark:border-orange-700 p-5"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-orange-600" />
          </div>
          <h4 className="text-base font-bold text-orange-800 dark:text-orange-300">
            Conformité requise
          </h4>
          <p className="text-xs text-orange-700 dark:text-orange-400 max-w-xs">
            {complianceReason || 'Vos documents de conformité (KBIS, URSSAF, RC Pro) doivent être vérifiés avant de démarrer.'}
          </p>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
              Mission verrouillée
            </span>
          </div>
          {onViewCompliance && (
            <Button
              onClick={onViewCompliance}
              size="sm"
              variant="outline"
              className="mt-2 border-orange-400 text-orange-700 hover:bg-orange-100"
            >
              <ShieldAlert className="w-4 h-4 mr-1" />
              Voir mes documents
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}
