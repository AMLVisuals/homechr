import type { SiretVerificationResult, ComplianceStatus, WorkerCompliance, ComplianceDocument } from '@/types/compliance';
import { COMPLIANCE_CONFIG } from '@/types/compliance';

// ============================================================================
// COMPLIANCE SERVICE — Vérification SIRET, URSSAF, expiration documents
// ============================================================================
// En production : appels API Pappers/Sirene + API URSSAF
// Actuellement : mock avec délais simulés
// ============================================================================

/**
 * Vérifie un numéro SIRET via l'API Sirene / Pappers
 * Mock : valide si 14 chiffres et commence par un chiffre > 0
 */
export async function verifySiret(siret: string): Promise<SiretVerificationResult> {
  await new Promise((r) => setTimeout(r, 1500));

  const cleaned = siret.replace(/\s/g, '');

  if (!/^\d{14}$/.test(cleaned)) {
    return {
      success: false,
      siret: cleaned,
      error: 'Le SIRET doit contenir exactement 14 chiffres.',
    };
  }

  // Mock : 90% succès
  if (Math.random() > 0.9) {
    return {
      success: false,
      siret: cleaned,
      error: 'Entreprise non trouvée dans le répertoire SIRENE.',
      isActive: false,
    };
  }

  return {
    success: true,
    siret: cleaned,
    companyName: 'Entreprise ' + cleaned.slice(0, 4),
    legalForm: 'Auto-entrepreneur',
    apeCode: '4322A',
    isActive: true,
  };
}

/**
 * Vérifie une attestation de vigilance URSSAF
 * Mock : valide si le fichier a été uploadé
 */
export async function verifyURSSAFAttestation(attestationFileUrl: string): Promise<{
  success: boolean;
  validFrom?: string;
  validUntil?: string;
  error?: string;
}> {
  await new Promise((r) => setTimeout(r, 1200));

  if (!attestationFileUrl) {
    return { success: false, error: 'Aucun fichier fourni.' };
  }

  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setMonth(validUntil.getMonth() + COMPLIANCE_CONFIG.URSSAF_VALIDITY_MONTHS);

  return {
    success: true,
    validFrom: now.toISOString(),
    validUntil: validUntil.toISOString(),
  };
}

/**
 * Calcule le statut de conformité d'un prestataire indépendant
 * basé sur ses documents uploadés
 */
export function computeComplianceStatus(documents: ComplianceDocument[]): ComplianceStatus {
  const requiredTypes = ['KBIS', 'URSSAF_ATTESTATION', 'RC_PRO'] as const;
  const now = new Date();

  for (const docType of requiredTypes) {
    const doc = documents.find(d => d.type === docType);

    if (!doc) return 'PENDING';
    if (doc.status === 'REJECTED') return 'PENDING';
    if (doc.status === 'EXPIRED' || new Date(doc.expiresAt) < now) return 'EXPIRED';
    if (doc.status === 'UPLOADED') return 'PENDING'; // Pas encore vérifié
  }

  return 'VERIFIED';
}

/**
 * Vérifie les documents proches de l'expiration
 * Retourne les documents qui expirent dans les N prochains jours
 */
export function getExpiringDocuments(
  documents: ComplianceDocument[],
  daysBeforeExpiry: number = COMPLIANCE_CONFIG.ALERT_DAYS_BEFORE_EXPIRY
): ComplianceDocument[] {
  const now = new Date();
  const alertDate = new Date(now);
  alertDate.setDate(alertDate.getDate() + daysBeforeExpiry);

  return documents.filter(doc => {
    const expiry = new Date(doc.expiresAt);
    return doc.status !== 'EXPIRED' && expiry <= alertDate && expiry > now;
  });
}

/**
 * Vérifie les documents expirés et les marque comme tels
 */
export function getExpiredDocuments(documents: ComplianceDocument[]): ComplianceDocument[] {
  const now = new Date();
  return documents.filter(doc => {
    return doc.status !== 'EXPIRED' && new Date(doc.expiresAt) <= now;
  });
}

/**
 * Vérifie si un prestataire peut accepter une mission
 */
export function canWorkerAcceptMission(compliance: WorkerCompliance): {
  allowed: boolean;
  reason?: string;
} {
  if (compliance.employmentCategory === 'EXTRA_EMPLOYEE') {
    // Les extras n'ont pas besoin de compliance entreprise
    return { allowed: true };
  }

  // Indépendants : compliance obligatoire
  if (compliance.complianceStatus === 'VERIFIED') {
    return { allowed: true };
  }

  if (compliance.complianceStatus === 'SUSPENDED' || compliance.complianceStatus === 'EXPIRED') {
    return {
      allowed: false,
      reason: 'Vos documents de conformité ont expiré. Veuillez les mettre à jour pour accepter des missions.',
    };
  }

  return {
    allowed: false,
    reason: 'Vos documents de conformité sont en attente de vérification (KBIS, URSSAF, RC Pro).',
  };
}
