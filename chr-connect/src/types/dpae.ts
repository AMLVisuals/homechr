export interface DPAEDeclaration {
  id: string;
  missionId?: string;

  // Employeur
  employerSiret: string;
  employerName: string;
  employerAddress: string;
  employerAPE: string;

  // Salarié
  employeeLastName: string;
  employeeFirstName: string;
  employeeBirthDate: string;
  employeeSSN: string;
  employeeNationality: string;

  // Contrat
  contractType: 'CDD_USAGE';
  startDate: string;
  endDate: string;
  workHours: string;
  hourlyRate: number;
  jobTitle: string;
  collectiveAgreement: string; // HCR par défaut

  // Status
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'ERROR';
  urssafReference?: string;       // Numéro de référence URSSAF
  aeeNumber?: string;             // Accusé d'Enregistrement Électronique
  submittedAt?: string;
  acknowledgedAt?: string;        // Date de réception de l'AEE
  contractPdfUrl?: string;

  // Lien avec la conformité mission
  missionUnlocked?: boolean;      // true = la mission peut démarrer
}

export interface DPAEContract {
  id: string;
  declarationId: string;
  missionId?: string;
  generatedAt: string;
  htmlContent: string;
  status: 'DRAFT' | 'SIGNED' | 'SENT';
}
