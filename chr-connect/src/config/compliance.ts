// ============================================================================
// COMPLIANCE CONFIG - Règles légales par catégorie de prestataire
// ============================================================================

import type { EmploymentCategory, ComplianceDocType } from '@/types/compliance';

// ============================================================================
// PARCOURS A : Extra / Personnel (Salariat via le patron)
// ============================================================================
// L'extra est SALARIÉ du patron (CDD d'usage HCR).
// Le patron est l'employeur légal. CHR Connect facilite :
//   1. La mise en relation (20€ ou premium)
//   2. La génération de DPAE (obligatoire, bloquante)
//   3. La génération du contrat CDD d'usage
//   4. Le calcul de paie (heures réelles → net à payer)
//
// La mission NE PEUT PAS démarrer tant que la DPAE n'a pas été validée.
// C'est le PATRON qui soumet la DPAE (il est l'employeur).
// ============================================================================

// ============================================================================
// PARCOURS B : Techniciens / Bâtiment (Indépendants)
// ============================================================================
// Le technicien est INDÉPENDANT (auto-entrepreneur, SARL, SAS...).
// Il facture directement le patron. CHR Connect vérifie :
//   1. SIRET actif (API Sirene/Pappers)
//   2. Attestation de vigilance URSSAF à jour
//   3. Assurance RC Pro valide
//
// La mission NE PEUT PAS démarrer tant que compliance_status !== 'VERIFIED'.
// Pas de DPAE requise (le technicien n'est pas salarié).
// ============================================================================

export const EMPLOYMENT_CATEGORY_LABELS: Record<EmploymentCategory, string> = {
  EXTRA_EMPLOYEE: 'Extra / Personnel (salarié du patron)',
  FREELANCE_TECHNICIAN: 'Indépendant / Technicien',
  FREELANCE_PERSONNEL: 'Indépendant / Personnel (auto-entrepreneur)',
};

export const EMPLOYMENT_CATEGORY_DESCRIPTIONS: Record<EmploymentCategory, string> = {
  EXTRA_EMPLOYEE: 'Vous intervenez en tant que salarié temporaire (CDD d\'usage). Le patron sera votre employeur et devra effectuer une DPAE avant le début de la mission.',
  FREELANCE_TECHNICIAN: 'Vous intervenez en tant que professionnel indépendant. Vous devez fournir votre KBIS, attestation URSSAF et assurance RC Pro.',
  FREELANCE_PERSONNEL: 'Vous intervenez en tant qu\'indépendant (auto-entrepreneur). Vous devez fournir votre KBIS, attestation URSSAF et assurance RC Pro. Pas de DPAE requise.',
};

// Documents requis pour qu'un indépendant soit "VERIFIED"
export const FREELANCE_REQUIRED_DOCS: ComplianceDocType[] = [
  'KBIS',
  'URSSAF_ATTESTATION',
  'RC_PRO',
];

// Documents optionnels selon le métier
export const TRADE_SPECIFIC_DOCS: Record<string, { doc: ComplianceDocType; label: string }[]> = {
  tech_froid: [{ doc: 'HABILITATION_FRIGO', label: 'Attestation de capacité fluides frigorigènes' }],
  electricien: [{ doc: 'HABILITATION_ELEC', label: 'Habilitation électrique (BR, B2V...)' }],
  installateur_electricite: [{ doc: 'HABILITATION_ELEC', label: 'Habilitation électrique' }],
  architecte: [{ doc: 'DECENNALE', label: 'Garantie décennale' }],
  macon: [{ doc: 'DECENNALE', label: 'Garantie décennale' }],
  carreleur: [{ doc: 'DECENNALE', label: 'Garantie décennale' }],
  peintre: [{ doc: 'DECENNALE', label: 'Garantie décennale' }],
  plombier: [{ doc: 'DECENNALE', label: 'Garantie décennale' }],
  installateur_plomberie: [{ doc: 'DECENNALE', label: 'Garantie décennale' }],
  menuisier: [{ doc: 'DECENNALE', label: 'Garantie décennale' }],
  menuisier_metal: [{ doc: 'DECENNALE', label: 'Garantie décennale' }],
};

// Règles de blocage mission
export const MISSION_START_RULES = {
  // Parcours A (Extra) : DPAE validée obligatoire
  EXTRA_EMPLOYEE: {
    requiresDPAE: true,
    requiresCompliance: false, // L'extra n'a pas de SIRET
    blockingMessage: 'La DPAE doit être validée par l\'URSSAF avant de démarrer la mission.',
    patronAction: 'Générer la DPAE',
  },
  // Parcours B (Indépendant technicien) : compliance vérifiée obligatoire
  FREELANCE_TECHNICIAN: {
    requiresDPAE: false,
    requiresCompliance: true,
    blockingMessage: 'Le prestataire doit avoir ses documents de conformité vérifiés (KBIS, URSSAF, RC Pro).',
    patronAction: null, // C'est au prestataire de mettre à jour ses docs
  },
  // Parcours C (Indépendant personnel) : même règles que freelance tech, pas de DPAE
  FREELANCE_PERSONNEL: {
    requiresDPAE: false,
    requiresCompliance: true,
    blockingMessage: 'Le prestataire doit avoir ses documents de conformité vérifiés (KBIS, URSSAF, RC Pro).',
    patronAction: null,
  },
} as const;

// Convention collective HCR
export const HCR_CONVENTION = {
  name: 'Convention collective nationale des hôtels, cafés restaurants (HCR)',
  idcc: '1979',
  brochure: '3292',
  // Grille salariale simplifiée (brut horaire minimum par niveau)
  salaryGrid: {
    NIVEAU_1: { label: 'Employé(e)', minHourly: 11.88 }, // SMIC
    NIVEAU_2: { label: 'Employé(e) qualifié(e)', minHourly: 12.10 },
    NIVEAU_3: { label: 'Agent de maîtrise', minHourly: 13.50 },
    NIVEAU_4: { label: 'Cadre', minHourly: 16.00 },
  },
  // Majoration heures supplémentaires
  overtimeRates: {
    first8: 1.10,  // +10% de la 36e à la 43e heure
    beyond: 1.20,  // +20% au-delà de 43h (rare en extra)
  },
  // Avantage en nature repas HCR
  mealBenefit: {
    perMeal: 4.15, // Montant 2024 par repas
    description: 'Avantage en nature nourriture (convention HCR)',
  },
} as const;
