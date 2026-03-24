// ============================================================================
// COMPLIANCE CONFIG - Règles légales par catégorie de prestataire
// ============================================================================

import type { EmploymentCategory } from '@/types/compliance';

// ============================================================================
// PARCOURS A : Extra (Salariat via le patron)
// ============================================================================
// L'extra est SALARIÉ du patron (CDD d'usage HCR).
// Le patron est l'employeur légal. Home CHR facilite :
//   1. La mise en relation (20€ ou premium)
//   2. La génération de DPAE (obligatoire, bloquante)
//   3. La génération du contrat CDD d'usage
//   4. Le calcul de paie (heures réelles → net à payer)
//
// La mission NE PEUT PAS démarrer tant que la DPAE n'a pas été validée.
// C'est le PATRON qui soumet la DPAE (il est l'employeur).
// ============================================================================

// ============================================================================
// PARCOURS B : Freelance (Indépendants)
// ============================================================================
// Le freelance est INDÉPENDANT (auto-entrepreneur, SARL, SAS...).
// Il facture directement le patron. Home CHR vérifie :
//   1. Attestation Pro / Kbis
//   2. Attestation de vigilance URSSAF à jour
//   3. Assurance RC Pro valide
//
// La mission NE PEUT PAS démarrer tant que compliance_status !== 'VERIFIED'.
// Pas de DPAE requise (le freelance n'est pas salarié).
// ============================================================================

export const EMPLOYMENT_CATEGORY_LABELS: Record<EmploymentCategory, string> = {
  EXTRA: 'Extra / CDD d\'usage',
  FREELANCE: 'Indépendant / Freelance',
};

export const EMPLOYMENT_CATEGORY_DESCRIPTIONS: Record<EmploymentCategory, string> = {
  EXTRA: 'Vous intervenez en tant que salarié temporaire (CDD d\'usage). Le patron sera votre employeur et devra effectuer une DPAE avant le début de la mission.',
  FREELANCE: 'Vous intervenez en tant que professionnel indépendant. Vous devez fournir votre Attestation Pro / Kbis, attestation URSSAF et assurance RC Pro.',
};

// Documents requis pour qu'un indépendant soit "VERIFIED"
export const FREELANCE_REQUIRED_DOCS = [
  'ATTESTATION_PRO_KBIS',
  'URSSAF_ATTESTATION',
  'RC_PRO',
] as const;

// Règles de blocage mission
export const MISSION_START_RULES = {
  // Parcours A (Extra) : DPAE validée obligatoire
  EXTRA: {
    requiresDPAE: true,
    requiresCompliance: false,
    blockingMessage: 'La DPAE doit être validée par l\'URSSAF avant de démarrer la mission.',
    patronAction: 'Générer la DPAE',
  },
  // Parcours B (Freelance) : compliance vérifiée obligatoire
  FREELANCE: {
    requiresDPAE: false,
    requiresCompliance: true,
    blockingMessage: 'Le prestataire doit avoir ses documents de conformité vérifiés (Attestation Pro / Kbis, URSSAF, RC Pro).',
    patronAction: null,
  },
} as const;

// Convention collective HCR
export const HCR_CONVENTION = {
  name: 'Convention collective nationale des hôtels, cafés restaurants (HCR)',
  idcc: '1979',
  brochure: '3292',
  salaryGrid: {
    NIVEAU_1: { label: 'Employé(e)', minHourly: 11.88 },
    NIVEAU_2: { label: 'Employé(e) qualifié(e)', minHourly: 12.10 },
    NIVEAU_3: { label: 'Agent de maîtrise', minHourly: 13.50 },
    NIVEAU_4: { label: 'Cadre', minHourly: 16.00 },
  },
  overtimeRates: {
    first8: 1.10,
    beyond: 1.20,
  },
  mealBenefit: {
    perMeal: 4.15,
    description: 'Avantage en nature nourriture (convention HCR)',
  },
} as const;
