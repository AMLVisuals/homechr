export interface DPAEDeclaration {
  id: string;
  missionId: string;

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
  urssafReference?: string;
  submittedAt?: string;
  contractPdfUrl?: string;
}

export interface DPAEContract {
  id: string;
  declarationId: string;
  missionId: string;
  generatedAt: string;
  htmlContent: string;
  status: 'DRAFT' | 'SIGNED' | 'SENT';
}
