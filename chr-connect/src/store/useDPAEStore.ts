import { create } from 'zustand';
import { DPAEDeclaration, DPAEContract } from '@/types/dpae';

interface DPAEState {
  declarations: DPAEDeclaration[];
  contracts: DPAEContract[];

  createDeclaration: (declaration: DPAEDeclaration) => void;
  updateDeclaration: (id: string, updates: Partial<DPAEDeclaration>) => void;
  submitToURSSAF: (declarationId: string) => Promise<void>;
  addContract: (contract: DPAEContract) => void;
  getDeclarationByMission: (missionId: string | undefined) => DPAEDeclaration | undefined;
}

export const useDPAEStore = create<DPAEState>((set, get) => ({
  declarations: [],
  contracts: [],

  createDeclaration: (declaration) =>
    set((state) => ({ declarations: [...state.declarations, declaration] })),

  updateDeclaration: (id, updates) =>
    set((state) => ({
      declarations: state.declarations.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  submitToURSSAF: async (declarationId) => {
    // Mock: simulate URSSAF submission with 2s delay
    const declaration = get().declarations.find((d) => d.id === declarationId);
    if (!declaration) return;

    set((state) => ({
      declarations: state.declarations.map((d) =>
        d.id === declarationId ? { ...d, status: 'SUBMITTED' as const, submittedAt: new Date().toISOString() } : d
      ),
    }));

    await new Promise((r) => setTimeout(r, 2000));

    // Simulate URSSAF acknowledgement
    const reference = `DPAE-${Date.now().toString(36).toUpperCase()}`;
    set((state) => ({
      declarations: state.declarations.map((d) =>
        d.id === declarationId
          ? { ...d, status: 'ACKNOWLEDGED' as const, urssafReference: reference }
          : d
      ),
    }));
  },

  addContract: (contract) =>
    set((state) => ({ contracts: [...state.contracts, contract] })),

  getDeclarationByMission: (missionId) =>
    missionId ? get().declarations.find((d) => d.missionId === missionId) : undefined,
}));
