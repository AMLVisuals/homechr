
export interface DocumentRequirement {
  id: string;
  label: string;
  description?: string;
  type: 'IDENTITY' | 'COMPANY' | 'FINANCIAL' | 'INSURANCE' | 'CERTIFICATION';
  required: boolean;
  condition?: (skills: string[]) => boolean;
}

export const PATRON_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'kbis',
    label: 'Extrait Kbis',
    description: 'Preuve d\'existence de moins de 3 mois',
    type: 'COMPANY',
    required: true
  },
  {
    id: 'identity',
    label: "Pièce d'identité du Gérant",
    description: 'CNI ou Passeport (Recto/Verso)',
    type: 'IDENTITY',
    required: true
  },
  {
    id: 'rib',
    label: 'RIB / IBAN',
    description: 'Pour les prélèvements',
    type: 'FINANCIAL',
    required: true
  },
  {
    id: 'license',
    label: "Licence d'Exploitation",
    description: 'Licence IV ou Restaurant',
    type: 'COMPANY',
    required: false
  }
];

export const WORKER_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'sirene',
    label: 'Avis de Situation SIRENE / Kbis',
    description: 'Preuve d\'existence légale',
    type: 'COMPANY',
    required: true
  },
  {
    id: 'identity',
    label: "Pièce d'identité",
    description: 'CNI ou Passeport',
    type: 'IDENTITY',
    required: true
  },
  {
    id: 'urssaf',
    label: 'Attestation de Vigilance URSSAF',
    description: 'Obligatoire (Lutte contre le travail dissimulé)',
    type: 'COMPANY',
    required: true
  },
  {
    id: 'rc_pro',
    label: 'Assurance RC Pro',
    description: 'Responsabilité Civile Professionnelle',
    type: 'INSURANCE',
    required: true
  },
  {
    id: 'decennale',
    label: 'Assurance Décennale',
    description: 'Obligatoire pour les métiers du bâtiment',
    type: 'INSURANCE',
    required: true,
    condition: (skills: string[]) => {
      const decennaleSkills = ['plumbing', 'elec', 'cold', 'architect', 'carpenter', 'painter'];
      return skills.some(skill => decennaleSkills.includes(skill));
    }
  },
  {
    id: 'certifications',
    label: 'Certifications / Diplômes',
    description: 'Qualibat, HACCP, Diplômes...',
    type: 'CERTIFICATION',
    required: false
  }
];

export function getRequiredDocuments(role: 'PATRON' | 'WORKER', skills: string[] = []): DocumentRequirement[] {
  if (role === 'PATRON') {
    return PATRON_DOCUMENTS;
  }
  
  return WORKER_DOCUMENTS.filter(doc => {
    if (!doc.condition) return true;
    return doc.condition(skills);
  });
}
