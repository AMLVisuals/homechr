import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  MaintenanceRecord,
  EquipmentFilters
} from '@/types/equipment';
import { generateQRCodeUrl } from '@/lib/ai-service.mock';
import {
  getEquipmentByOwner,
  createEquipment as createEquipmentInSupabase,
  updateEquipment as updateEquipmentInSupabase,
  softDeleteEquipment,
} from '@/lib/supabase-helpers';

// ============================================================================
// EQUIPMENT STORE - Zustand Store for Equipment Management
// ============================================================================

interface EquipmentState {
  // Data
  equipment: Equipment[];
  maintenanceHistory: MaintenanceRecord[];

  // UI State
  filters: EquipmentFilters;
  selectedEquipmentId: string | null;

  // Actions - CRUD
  addEquipment: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'qrCodeId' | 'qrCodeUrl'>) => Equipment;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  restoreEquipment: (id: string) => void;

  // Actions - Status
  setEquipmentStatus: (id: string, status: EquipmentStatus) => void;
  reportFault: (id: string, faultType: string, description?: string) => void;

  // Actions - Maintenance
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;

  // Actions - UI
  setFilters: (filters: Partial<EquipmentFilters>) => void;
  clearFilters: () => void;
  selectEquipment: (id: string | null) => void;

  // Getters
  getEquipmentById: (id: string) => Equipment | undefined;
  getEquipmentByVenue: (venueId: string) => Equipment[];
  getEquipmentByCategory: (category: EquipmentCategory) => Equipment[];
  getEquipmentHistory: (equipmentId: string) => MaintenanceRecord[];
  getFilteredEquipment: () => Equipment[];

  // Async Supabase actions
  isLoading: boolean;
  fetchEquipment: (ownerId: string) => Promise<void>;
  syncAddEquipment: (data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'qrCodeId' | 'qrCodeUrl'>) => Promise<Equipment>;
  syncUpdateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  syncDeleteEquipment: (id: string) => Promise<void>;
}


// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      // Initial State — empty, loaded from Supabase via fetchEquipment
      equipment: [],
      maintenanceHistory: [],
      filters: {},
      selectedEquipmentId: null,

      // CRUD Actions
      addEquipment: (equipmentData) => {
        const id = `eq_${Date.now()}`;
        const now = new Date().toISOString();
        const qrCodeId = `qr_${id}`;

        const newEquipment: Equipment = {
          ...equipmentData,
          id,
          qrCodeId,
          qrCodeUrl: generateQRCodeUrl(id),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          equipment: [newEquipment, ...state.equipment],
        }));

        return newEquipment;
      },

      updateEquipment: (id, updates) => {
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === id
              ? { ...eq, ...updates, updatedAt: new Date().toISOString() }
              : eq
          ),
        }));
      },

      deleteEquipment: (id) => {
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === id
              ? { ...eq, isDeleted: true, deletedAt: new Date().toISOString() }
              : eq
          ),
        }));
      },

      restoreEquipment: (id) => {
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === id
              ? { ...eq, isDeleted: false, deletedAt: undefined }
              : eq
          ),
        }));
      },

      // Status Actions
      setEquipmentStatus: (id, status) => {
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === id
              ? { ...eq, status, updatedAt: new Date().toISOString() }
              : eq
          ),
        }));
      },

      reportFault: (id, faultType, description) => {
        const now = new Date().toISOString();
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === id
              ? {
                  ...eq,
                  status: 'FAULT' as EquipmentStatus,
                  updatedAt: now,
                  metadata: {
                    ...eq.metadata,
                    lastFault: faultType,
                    faultDescription: description,
                    faultReportedAt: now,
                  },
                }
              : eq
          ),
        }));
      },

      // Maintenance Actions
      addMaintenanceRecord: (record) => {
        const id = `maint_${Date.now()}`;
        const newRecord: MaintenanceRecord = { ...record, id };

        set((state) => ({
          maintenanceHistory: [newRecord, ...state.maintenanceHistory],
        }));

        // Update equipment's last service date if it's a completed maintenance
        if (record.type !== 'INSPECTION') {
          get().updateEquipment(record.equipmentId, {
            lastServiceDate: record.date,
          });
        }
      },

      // UI Actions
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      selectEquipment: (id) => {
        set({ selectedEquipmentId: id });
      },

      // Getters
      getEquipmentById: (id) => {
        return get().equipment.find((eq) => eq.id === id);
      },

      getEquipmentByVenue: (venueId) => {
        return get().equipment.filter((eq) => eq.venueId === venueId && !eq.isDeleted);
      },

      getEquipmentByCategory: (category) => {
        return get().equipment.filter((eq) => eq.category === category && !eq.isDeleted);
      },

      getEquipmentHistory: (equipmentId) => {
        return get().maintenanceHistory.filter(
          (m) => m.equipmentId === equipmentId
        );
      },

      getFilteredEquipment: () => {
        const { equipment, filters } = get();

        return equipment.filter((eq) => {
          if (filters.showDeleted) {
            if (!eq.isDeleted) return false;
          } else {
            if (eq.isDeleted) return false;
          }

          if (filters.category && eq.category !== filters.category) return false;
          if (filters.status && eq.status !== filters.status) return false;
          if (filters.location && eq.location !== filters.location) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const searchableText = `${eq.brand} ${eq.model} ${eq.nickname || ''} ${eq.location}`.toLowerCase();
            if (!searchableText.includes(search)) return false;
          }
          return true;
        });
      },
      // ── Async Supabase actions ──────────────────────────────────
      isLoading: false,

      fetchEquipment: async (ownerId: string) => {
        set({ isLoading: true });
        try {
          const { data } = await getEquipmentByOwner(ownerId);
          if (data && data.length > 0) {
            set({ equipment: data as Equipment[], isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (err) {
          console.error('[useEquipmentStore] fetchEquipment error:', err);
          set({ isLoading: false });
        }
      },

      syncAddEquipment: async (data) => {
        const newEquipment = get().addEquipment(data);
        try {
          const { error } = await createEquipmentInSupabase(newEquipment as any);
          if (error) throw new Error(error.message || 'Échec création équipement');
        } catch (err) {
          console.error('[useEquipmentStore] syncAddEquipment error:', err);
          // Rollback
          set((state) => ({ equipment: state.equipment.filter((e: any) => e.id !== newEquipment.id) }));
          throw err;
        }
        return newEquipment;
      },

      syncUpdateEquipment: async (id, updates) => {
        const previous = get().equipment.find((e: any) => e.id === id);
        get().updateEquipment(id, updates);
        try {
          const { error } = await updateEquipmentInSupabase(id, updates as any);
          if (error) throw new Error(error.message || 'Échec mise à jour équipement');
        } catch (err) {
          console.error('[useEquipmentStore] syncUpdateEquipment error:', err);
          if (previous) {
            set((state) => ({ equipment: state.equipment.map((e: any) => e.id === id ? previous : e) }));
          }
          throw err;
        }
      },

      syncDeleteEquipment: async (id) => {
        const previous = get().equipment.find((e: any) => e.id === id);
        get().deleteEquipment(id);
        try {
          const { error } = await softDeleteEquipment(id);
          if (error) throw new Error(error.message || 'Échec suppression équipement');
        } catch (err) {
          console.error('[useEquipmentStore] syncDeleteEquipment error:', err);
          if (previous) {
            set((state) => ({ equipment: [...state.equipment, previous] }));
          }
          throw err;
        }
      },
    }),
    {
      name: 'equipment-storage',
    }
  )
);
