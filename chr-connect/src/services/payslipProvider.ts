import type { PayslipProviderConfig, PayslipProviderInterface } from '@/types/payslip';

export const defaultPayslipProvider: PayslipProviderInterface = {
  name: 'Default',
  isConnected: false,
  generatePayslip: async () => null,
  getPayrollPeriods: async () => [],
  getEmployees: async () => [],
};

export const createPayslipProvider = (config: PayslipProviderConfig): PayslipProviderInterface => ({
  name: config.name || 'Custom Provider',
  isConnected: !!config.apiKey,
  generatePayslip: async (request) => {
    console.log('Generating payslip:', request);
    return null;
  },
  getPayrollPeriods: async () => [],
  getEmployees: async () => [],
});
