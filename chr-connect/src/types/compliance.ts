// ============================================================================
// COMPLIANCE TYPES - Conformité légale & KYB
// ============================================================================

// Catégorie d'emploi du prestataire — détermine le parcours légal et les documents requis
// EXTRA      = Salarié temporaire (CDD d'usage HCR) → DPAE obligatoire, pas de docs entreprise
// FREELANCE  = Indépendant (auto-entrepreneur, SARL, SAS…) → Attestation Pro/Kbis, URSSAF, RC Pro
export type EmploymentCategory = 'EXTRA' | 'FREELANCE';

// Statut de conformité du prestataire
export type ComplianceStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'EXPIRED';

// Statut DPAE sur une mission
export type DPAEMissionStatus = 'NOT_REQUIRED' | 'PENDING' | 'VALIDATED' | 'ERROR';

// ============================================================================
// DOCUMENTS DE CONFORMITÉ
// ============================================================================

export type ComplianceDocType =
  // ── Documents communs ──
  | 'IDENTITY'              // Pièce d'identité (CNI / Passeport / Titre de séjour)
  // ── Documents Freelance ──
  | 'ATTESTATION_PRO_KBIS'  // Attestation Pro / Kbis
  | 'URSSAF_ATTESTATION'    // Attestation de vigilance URSSAF
  | 'RC_PRO'                // Assurance RC Professionnelle
  // ── Documents Extra ──
  | 'RIB'                   // RIB / IBAN (pour le paiement)
  | 'SOCIAL_SECURITY_CARD'  // Carte Vitale ou Attestation de sécurité sociale
  // ── Documents optionnels ──
  | 'CERTIFICATIONS';       // Certifications / Diplômes (HACCP, Qualibat, etc.)

export interface ComplianceDocument {
  id: string;
  type: ComplianceDocType;
  fileUrl: string;
  uploadedAt: string;             // ISO date
  verifiedAt?: string;            // ISO date — quand le document a été vérifié
  expiresAt: string;              // ISO date — date d'expiration
  status: 'UPLOADED' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';
  rejectionReason?: string;
}

// ============================================================================
// VÉRIFICATION KYB (Know Your Business)
// ============================================================================

export interface KYBVerification {
  siretNumber: string;
  companyName?: string;
  legalForm?: string;            // SAS, SARL, EI, Auto-entrepreneur...
  apeCode?: string;              // Code NAF/APE
  registrationDate?: string;     // Date de création
  isActive: boolean;             // Entreprise active ou radiée
  verifiedAt?: string;           // ISO date
  source: 'PAPPERS' | 'SIRENE' | 'MANUAL';
}

export interface URSSAFVerification {
  attestationNumber?: string;
  validFrom: string;             // ISO date
  validUntil: string;            // ISO date
  isValid: boolean;
  verifiedAt?: string;           // ISO date
}

// ============================================================================
// PROFIL DE CONFORMITÉ COMPLET DU PRESTATAIRE
// ============================================================================

export interface WorkerCompliance {
  workerId: string;
  employmentCategory: EmploymentCategory;
  complianceStatus: ComplianceStatus;

  // N° de sécurité sociale (Extra : saisi à l'inscription, requis pour DPAE)
  socialSecurityNumber?: string;

  // Vérification entreprise (freelance uniquement)
  kyb?: KYBVerification;
  urssaf?: URSSAFVerification;

  // Documents uploadés
  documents: ComplianceDocument[];

  // Alertes
  nextExpiryDate?: string;       // Date du prochain document qui expire
  alertSentAt?: string;          // Dernière alerte envoyée (J-15)

  // Historique
  lastVerifiedAt?: string;       // Dernière vérification complète
  suspendedAt?: string;          // Date de suspension (si applicable)
  suspensionReason?: string;
}

// ============================================================================
// DOCUMENTS REQUIS PAR CATÉGORIE
// ============================================================================

export const REQUIRED_DOCS: Record<EmploymentCategory, ComplianceDocType[]> = {
  EXTRA: ['IDENTITY', 'RIB', 'SOCIAL_SECURITY_CARD'],
  FREELANCE: ['IDENTITY', 'ATTESTATION_PRO_KBIS', 'URSSAF_ATTESTATION', 'RC_PRO'],
};

// Documents optionnels (le prestataire les ajoute si pertinent)
export const OPTIONAL_DOCS: ComplianceDocType[] = ['CERTIFICATIONS'];

// ============================================================================
// CONSTANTES DE VALIDITÉ
// ============================================================================

export const COMPLIANCE_CONFIG = {
  ATTESTATION_PRO_KBIS_VALIDITY_MONTHS: 3,  // Attestation Pro / Kbis valide 3 mois
  URSSAF_VALIDITY_MONTHS: 6,                // Attestation URSSAF valide 6 mois
  RC_PRO_VALIDITY_MONTHS: 12,               // RC Pro valide 1 an
  ALERT_DAYS_BEFORE_EXPIRY: 15,             // Notification J-15 avant expiration
  SUSPENSION_GRACE_DAYS: 0,                 // Suspension immédiate à expiration
} as const;

// ============================================================================
// RÉSULTAT DE VÉRIFICATION SIRET
// ============================================================================

export interface SiretVerificationResult {
  success: boolean;
  siret: string;
  companyName?: string;
  legalForm?: string;
  apeCode?: string;
  isActive?: boolean;
  error?: string;
}

// ============================================================================
// RÉSULTAT FIN DE MISSION STAFF (heures réelles + paie)
// ============================================================================

export interface StaffMissionEndData {
  missionId: string;
  actualHoursWorked: number;
  actualStartTime: string;
  actualEndTime: string;
  breakDuration?: number;         // Minutes de pause déduites
  patronNotes?: string;
  // Calculé par le service de paie
  grossAmount?: number;
  netAmount?: number;
  payslipUrl?: string;
}
