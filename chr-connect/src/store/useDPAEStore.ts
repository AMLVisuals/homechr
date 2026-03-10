import { create } from 'zustand';
import { DPAEDeclaration, DPAEContract } from '@/types/dpae';

// ============================================================================
// DPAE STORE — Déclaration Préalable à l'Embauche
// ============================================================================
// Gère le cycle DPAE : DRAFT → SUBMITTED → ACKNOWLEDGED
// Quand ACKNOWLEDGED → missionUnlocked = true → la mission STAFF peut démarrer
// ============================================================================

// Callback pour notifier le missions store du changement de dpaeStatus
type OnMissionUnlocked = (missionId: string) => void;
let _onMissionUnlocked: OnMissionUnlocked | null = null;

export function setOnMissionUnlocked(cb: OnMissionUnlocked) {
  _onMissionUnlocked = cb;
}

interface DPAEState {
  declarations: DPAEDeclaration[];
  contracts: DPAEContract[];

  createDeclaration: (declaration: DPAEDeclaration) => void;
  updateDeclaration: (id: string, updates: Partial<DPAEDeclaration>) => void;
  submitToURSSAF: (declarationId: string) => Promise<void>;
  addContract: (contract: DPAEContract) => void;
  getDeclarationByMission: (missionId: string | undefined) => DPAEDeclaration | undefined;
  isMissionUnlocked: (missionId: string | undefined) => boolean;
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
    const declaration = get().declarations.find((d) => d.id === declarationId);
    if (!declaration) return;

    // Passage en SUBMITTED
    set((state) => ({
      declarations: state.declarations.map((d) =>
        d.id === declarationId
          ? { ...d, status: 'SUBMITTED' as const, submittedAt: new Date().toISOString() }
          : d
      ),
    }));

    // Mock : délai URSSAF 2s
    await new Promise((r) => setTimeout(r, 2000));

    // Mock : 95% succès
    const success = Math.random() > 0.05;

    if (success) {
      const reference = `DPAE-${Date.now().toString(36).toUpperCase()}`;
      const aeeNumber = `AEE-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date().toISOString();

      set((state) => ({
        declarations: state.declarations.map((d) =>
          d.id === declarationId
            ? {
                ...d,
                status: 'ACKNOWLEDGED' as const,
                urssafReference: reference,
                aeeNumber,
                acknowledgedAt: now,
                missionUnlocked: true,
              }
            : d
        ),
      }));

      // Notifier le missions store pour mettre à jour dpaeStatus
      if (declaration.missionId && _onMissionUnlocked) {
        _onMissionUnlocked(declaration.missionId);
      }
    } else {
      set((state) => ({
        declarations: state.declarations.map((d) =>
          d.id === declarationId
            ? { ...d, status: 'ERROR' as const }
            : d
        ),
      }));
    }
  },

  addContract: (contract) =>
    set((state) => ({ contracts: [...state.contracts, contract] })),

  getDeclarationByMission: (missionId) =>
    missionId ? get().declarations.find((d) => d.missionId === missionId) : undefined,

  isMissionUnlocked: (missionId) => {
    if (!missionId) return false;
    const declaration = get().declarations.find((d) => d.missionId === missionId);
    return declaration?.missionUnlocked === true;
  },
}));
