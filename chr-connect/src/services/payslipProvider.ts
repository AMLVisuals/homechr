import type { PayslipProviderConfig, PayslipProviderInterface, PayslipGenerationResponse, ValidationResult } from '@/types/payslip';

export const defaultPayslipProvider: PayslipProviderInterface = {
  name: 'Default',
  generatePayslip: async () => ({ success: false, message: 'No provider configured' }),
  getPayslipPdf: async () => new Blob(),
  validateData: async () => ({ valid: true, errors: [] }),
};

export const createPayslipProvider = (config: PayslipProviderConfig): PayslipProviderInterface => ({
  name: config.name || 'Custom Provider',
  generatePayslip: async () => {
    return { success: false, message: 'Not implemented' };
  },
  getPayslipPdf: async () => new Blob(),
  validateData: async () => ({ valid: true, errors: [] }),
});
