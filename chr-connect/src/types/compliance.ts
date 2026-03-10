// ============================================================================
// COMPLIANCE TYPES - Conformité légale & KYB
// ============================================================================

// Catégorie d'emploi du prestataire — détermine tout le parcours légal
export type EmploymentCategory = 'EXTRA_EMPLOYEE' | 'FREELANCE_TECHNICIAN';

// Statut de conformité du prestataire
export type ComplianceStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'EXPIRED';

// Statut DPAE sur une mission
export type DPAEMissionStatus = 'NOT_REQUIRED' | 'PENDING' | 'VALIDATED' | 'ERROR';

// ============================================================================
// DOCUMENTS DE CONFORMITÉ
// ============================================================================

export type ComplianceDocType =
  | 'KBIS'                  // Extrait K-bis ou K (< 3 mois)
  | 'URSSAF_ATTESTATION'    // Attestation de vigilance URSSAF
  | 'RC_PRO'                // Assurance RC Professionnelle
  | 'DECENNALE'             // Garantie décennale (bâtiment)
  | 'HABILITATION_FRIGO'    // Manipulation fluides frigorigènes
  | 'HABILITATION_ELEC'     // Habilitation électrique
  | 'CARTE_BTP'             // Carte BTP
  | 'HACCP';                // Certification hygiène alimentaire

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
  EXTRA_EMPLOYEE: [],  // L'extra est salarié du patron, pas de docs entreprise requis
  FREELANCE_TECHNICIAN: ['KBIS', 'URSSAF_ATTESTATION', 'RC_PRO'],
};

// Documents optionnels par métier (le prestataire les ajoute si pertinent)
export const OPTIONAL_DOCS_BY_TRADE: Record<string, ComplianceDocType[]> = {
  TECHNICIENS: ['HABILITATION_FRIGO', 'HABILITATION_ELEC'],
  BATIMENTS: ['DECENNALE', 'CARTE_BTP'],
  PERSONNEL: ['HACCP'],
};

// ============================================================================
// CONSTANTES DE VALIDITÉ
// ============================================================================

export const COMPLIANCE_CONFIG = {
  KBIS_VALIDITY_MONTHS: 3,              // KBIS valide 3 mois
  URSSAF_VALIDITY_MONTHS: 6,            // Attestation URSSAF valide 6 mois
  RC_PRO_VALIDITY_MONTHS: 12,           // RC Pro valide 1 an
  DECENNALE_VALIDITY_MONTHS: 12,        // Décennale valide 1 an
  ALERT_DAYS_BEFORE_EXPIRY: 15,         // Notification J-15 avant expiration
  SUSPENSION_GRACE_DAYS: 0,             // Suspension immédiate à expiration
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
