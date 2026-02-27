export type PayslipStatus = 'PAID' | 'PENDING' | 'FAILED' | 'PROCESSING';

export type PayslipPeriodType = 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY';

export type PayslipType = 'STANDARD' | 'OVERTIME' | 'BONUS' | 'DEDUCTION';

export interface Payslip {
  id: string;
  number: string;
  employeeId: string;
  employeeName: string;
  venueId: string;
  
  period: string;
  periodType: PayslipPeriodType;
  startDate: string;
  endDate: string;
  issueDate: string;
  
  grossAmount: number;
  netAmount: number;
  taxAmount: number;
  socialSecurity: number;
  
  status: PayslipStatus;
  type: PayslipType;
  
  hoursWorked?: number;
  hourlyRate?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  
  pdfUrl?: string;
  externalReference?: string;
  externalProviderId?: string;
  
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface PayslipEntry {
  id: string;
  label: string;
  hours?: number;
  rate: number;
  amount: number;
  type: 'WORK' | 'OVERTIME' | 'BONUS' | 'DEDUCTION';
}

export interface PayslipSummary {
  totalGross: number;
  totalNet: number;
  totalTax: number;
  totalSocialSecurity: number;
  totalPaid: number;
  totalPending: number;
  totalFailed: number;
  count: number;
}

export interface PayslipFilters {
  employeeId?: string;
  status?: PayslipStatus;
  period?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PayslipGenerationRequest {
  employeeId: string;
  employeeName: string;
  venueId: string;
  startDate: string;
  endDate: string;
  periodType: PayslipPeriodType;
  hoursWorked?: number;
  hourlyRate?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  bonuses?: PayslipEntry[];
  deductions?: PayslipEntry[];
}

export interface PayslipGenerationResponse {
  success: boolean;
  payslipId?: string;
  message?: string;
  error?: string;
  externalReference?: string;
}

export interface ExternalPayslipProvider {
  id: string;
  name: string;
  apiKey?: string;
  apiEndpoint?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PAYSLIP_STATUS_LABELS: Record<PayslipStatus, string> = {
  PAID: 'Payé',
  PENDING: 'En attente',
  FAILED: 'Échoué',
  PROCESSING: 'En cours',
};

export const PAYSLIP_STATUS_INFO: Record<PayslipStatus, { label: string; color: string; bgColor: string }> = {
  PAID: {
    label: 'Payé',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  PENDING: {
    label: 'En attente',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  FAILED: {
    label: 'Échoué',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
  PROCESSING: {
    label: 'En cours',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
};

export const PAYSLIP_TYPE_LABELS: Record<PayslipType, string> = {
  STANDARD: 'Standard',
  OVERTIME: 'Heures supplémentaires',
  BONUS: 'Prime',
  DEDUCTION: 'Déduction',
};

export const PAYSLIP_PERIOD_LABELS: Record<PayslipPeriodType, string> = {
  MONTHLY: 'Mensuel',
  WEEKLY: 'Hebdomadaire',
  BIWEEKLY: 'Bihebdomadaire',
};

// Provider abstraction types
export interface PayslipProviderConfig {
  type: 'mock' | 'external';
  name: string;
  apiKey?: string;
  apiEndpoint?: string;
}

export interface PayslipProviderInterface {
  name: string;
  generatePayslip(request: PayslipGenerationRequest): Promise<PayslipGenerationResponse>;
  getPayslipPdf(id: string): Promise<Blob>;
  validateData(data: Partial<PayslipGenerationRequest>): Promise<ValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PremiumFeature {
  id: string;
  label: string;
  description: string;
  icon: string;
}
