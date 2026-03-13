import type { ComplianceDocType, EmploymentCategory } from '@/types/compliance';

// ============================================================================
// DOCUMENTS D'INSCRIPTION — Listes par rôle et statut
// ============================================================================

export interface DocumentRequirement {
  id: ComplianceDocType;
  label: string;
  description?: string;
  required: boolean;
}

// ── Worker : Extra (CDD d'usage) ──

export const EXTRA_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'IDENTITY',
    label: "Pièce d'identité",
    description: 'CNI, Passeport ou Titre de séjour',
    required: true,
  },
  {
    id: 'RIB',
    label: 'RIB / IBAN',
    description: 'Pour le versement de votre salaire',
    required: true,
  },
  {
    id: 'SOCIAL_SECURITY_CARD',
    label: 'Carte Vitale ou Attestation de sécurité sociale',
    description: 'Justificatif de votre numéro de sécurité sociale',
    required: true,
  },
  {
    id: 'CERTIFICATIONS',
    label: 'Certifications / Diplômes',
    description: 'HACCP, diplômes, etc.',
    required: false,
  },
];

// ── Worker : Freelance (Indépendant) ──

export const FREELANCE_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'IDENTITY',
    label: "Pièce d'identité",
    description: 'CNI, Passeport ou Titre de séjour',
    required: true,
  },
  {
    id: 'ATTESTATION_PRO_KBIS',
    label: 'Attestation Pro / Kbis',
    description: "Preuve d'existence légale de votre activité",
    required: true,
  },
  {
    id: 'URSSAF_ATTESTATION',
    label: 'Attestation de Vigilance URSSAF',
    description: 'Obligatoire (lutte contre le travail dissimulé)',
    required: true,
  },
  {
    id: 'RC_PRO',
    label: 'Assurance RC Pro',
    description: 'Responsabilité Civile Professionnelle',
    required: true,
  },
  {
    id: 'CERTIFICATIONS',
    label: 'Certifications / Diplômes',
    description: 'Qualibat, HACCP, habilitations, etc.',
    required: false,
  },
];

// ── Patron ──

export const PATRON_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'IDENTITY',
    label: "Pièce d'identité du Gérant",
    description: 'CNI, Passeport ou Titre de séjour (Recto/Verso)',
    required: true,
  },
  {
    id: 'ATTESTATION_PRO_KBIS',
    label: 'Kbis',
    description: "Preuve d'existence de moins de 3 mois",
    required: true,
  },
  {
    id: 'RIB',
    label: 'RIB / IBAN',
    description: 'Pour les prélèvements',
    required: true,
  },
];

// ── Helper : récupérer les documents par rôle + catégorie ──

export function getWorkerDocuments(category: EmploymentCategory): DocumentRequirement[] {
  return category === 'EXTRA' ? EXTRA_DOCUMENTS : FREELANCE_DOCUMENTS;
}

export function getRequiredDocuments(
  role: 'PATRON' | 'WORKER',
  category?: EmploymentCategory,
): DocumentRequirement[] {
  if (role === 'PATRON') return PATRON_DOCUMENTS;
  return getWorkerDocuments(category ?? 'EXTRA');
}
