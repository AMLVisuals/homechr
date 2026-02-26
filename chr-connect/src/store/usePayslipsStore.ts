import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Payslip,
  PayslipEntry,
  PayslipFilters,
  PayslipGenerationRequest,
  PayslipSummary,
} from '@/types/payslip';
import { mockPayslipApi } from '@/services/payslipApi.mock';

interface PayslipState {
  payslips: Payslip[];
  selectedPayslipId: string | null;
  filters: PayslipFilters;
  isLoading: boolean;
  error: string | null;

  fetchPayslips: (filters?: PayslipFilters) => Promise<void>;
  fetchPayslipById: (id: string) => Promise<void>;
  fetchPayslipByNumber: (number: string) => Promise<void>;
  fetchVenuePayslips: (venueId: string, filters?: PayslipFilters) => Promise<void>;
  fetchEmployeePayslips: (employeeId: string, startDate?: string, endDate?: string) => Promise<void>;

  generatePayslip: (request: PayslipGenerationRequest) => Promise<string | null>;
  regeneratePayslip: (id: string) => Promise<boolean>;
  updatePayslipStatus: (id: string, status: 'PAID' | 'PENDING' | 'FAILED') => Promise<void>;

  deletePayslip: (id: string) => Promise<void>;
  restorePayslip: (id: string) => Promise<void>;

  downloadPayslipPdf: (id: string) => Promise<Blob>;

  setFilters: (filters: Partial<PayslipFilters>) => void;
  clearFilters: () => void;
  selectPayslip: (id: string | null) => void;

  getSelectedPayslip: () => Payslip | undefined;
  getPayslipSummary: (venueId?: string, startDate?: string, endDate?: string) => Promise<PayslipSummary>;
  getAvailablePeriods: (venueId?: string) => Promise<string[]>;
}

export const usePayslipsStore = create<PayslipState>()(
  persist(
    (set, get) => ({
      payslips: [],
      selectedPayslipId: null,
      filters: {},
      isLoading: false,
      error: null,

      fetchPayslips: async (filters?: PayslipFilters) => {
        set({ isLoading: true, error: null });
        try {
          const payslips = await mockPayslipApi.getPayslips(filters);
          set({ payslips, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch payslips', isLoading: false });
        }
      },

      fetchPayslipById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const payslip = await mockPayslipApi.getPayslipById(id);
          set((state) => ({
            payslips: state.payslips.some((p) => p.id === id)
              ? state.payslips.map((p) => (p.id === id ? payslip : p))
              : [...state.payslips, payslip],
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch payslip', isLoading: false });
        }
      },

      fetchPayslipByNumber: async (number: string) => {
        set({ isLoading: true, error: null });
        try {
          const payslip = await mockPayslipApi.getPayslipByNumber(number);
          set((state) => ({
            payslips: state.payslips.some((p) => p.id === payslip.id)
              ? state.payslips.map((p) => (p.id === payslip.id ? payslip : p))
              : [...state.payslips, payslip],
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch payslip', isLoading: false });
        }
      },

      fetchVenuePayslips: async (venueId: string, filters?: PayslipFilters) => {
        set({ isLoading: true, error: null });
        try {
          const payslips = await mockPayslipApi.getVenuePayslips(venueId, filters);
          set({ payslips, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch payslips', isLoading: false });
        }
      },

      fetchEmployeePayslips: async (employeeId: string, startDate?: string, endDate?: string) => {
        set({ isLoading: true, error: null });
        try {
          const payslips = await mockPayslipApi.getEmployeePayslips(employeeId, startDate, endDate);
          set({ payslips, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch payslips', isLoading: false });
        }
      },

      generatePayslip: async (request: PayslipGenerationRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await mockPayslipApi.generatePayslip(request);
          if (response.success && response.payslipId) {
            await get().fetchPayslips();
            return response.payslipId;
          }
          return null;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to generate payslip', isLoading: false });
          return null;
        }
      },

      regeneratePayslip: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await mockPayslipApi.regeneratePayslip(id);
          if (response.success) {
            await get().fetchPayslips();
            return true;
          }
          return false;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to regenerate payslip', isLoading: false });
          return false;
        }
      },

      updatePayslipStatus: async (id: string, status: 'PAID' | 'PENDING' | 'FAILED') => {
        set({ isLoading: true, error: null });
        try {
          const updatedPayslip = await mockPayslipApi.updatePayslipStatus(id, status);
          set((state) => ({
            payslips: state.payslips.map((p) => (p.id === id ? updatedPayslip : p)),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update payslip status', isLoading: false });
        }
      },

      deletePayslip: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await mockPayslipApi.deletePayslip(id);
          set((state) => ({
            payslips: state.payslips.filter((p) => p.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete payslip', isLoading: false });
        }
      },

      restorePayslip: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const restoredPayslip = await mockPayslipApi.restorePayslip(id);
          set((state) => ({
            payslips: [...state.payslips, restoredPayslip],
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to restore payslip', isLoading: false });
        }
      },

      downloadPayslipPdf: async (id: string) => {
        try {
          return await mockPayslipApi.downloadPayslipPdf(id);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to download payslip PDF' });
          throw error;
        }
      },

      setFilters: (filters: Partial<PayslipFilters>) => {
        set((state) => ({ filters: { ...state.filters, ...filters } }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      selectPayslip: (id: string | null) => {
        set({ selectedPayslipId: id });
      },

      getSelectedPayslip: () => {
        const { payslips, selectedPayslipId } = get();
        return payslips.find((p) => p.id === selectedPayslipId);
      },

      getPayslipSummary: async (venueId?: string, startDate?: string, endDate?: string) => {
        try {
          return await mockPayslipApi.getPayslipSummary(venueId, startDate, endDate);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch payslip summary' });
          throw error;
        }
      },

      getAvailablePeriods: async (venueId?: string) => {
        try {
          return await mockPayslipApi.getAvailablePeriods(venueId);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch available periods' });
          throw error;
        }
      },
    }),
    {
      name: 'payslips-storage',
      partialize: (state) => ({
        payslips: state.payslips,
        filters: state.filters,
      }),
    }
  )
);
