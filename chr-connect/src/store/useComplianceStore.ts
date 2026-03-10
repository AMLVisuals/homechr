import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WorkerCompliance,
  ComplianceDocument,
  ComplianceDocType,
  ComplianceStatus,
  EmploymentCategory,
  KYBVerification,
  URSSAFVerification,
} from '@/types/compliance';
import { verifySiret, verifyURSSAFAttestation, computeComplianceStatus, getExpiringDocuments } from '@/services/complianceService';

// ============================================================================
// COMPLIANCE STORE — Gestion conformité prestataire (KYB, documents, URSSAF)
// ============================================================================

interface ComplianceState {
  // Données conformité par worker
  workers: Record<string, WorkerCompliance>;

  // Actions
  initWorkerCompliance: (workerId: string, category: EmploymentCategory) => void;
  addDocument: (workerId: string, doc: ComplianceDocument) => void;
  removeDocument: (workerId: string, docId: string) => void;
  verifySiretNumber: (workerId: string, siret: string) => Promise<boolean>;
  verifyUrssafAttestation: (workerId: string, fileUrl: string) => Promise<boolean>;
  refreshComplianceStatus: (workerId: string) => void;
  getWorkerCompliance: (workerId: string) => WorkerCompliance | undefined;
  getExpiringDocs: (workerId: string) => ComplianceDocument[];
  canStartMission: (workerId: string) => { allowed: boolean; reason?: string };
}

export const useComplianceStore = create<ComplianceState>()(
  persist(
    (set, get) => ({
      workers: {},

      initWorkerCompliance: (workerId, category) =>
        set((state) => {
          // Ne pas écraser si déjà initialisé
          if (state.workers[workerId]) return state;
          return {
            workers: {
              ...state.workers,
              [workerId]: {
                workerId,
                employmentCategory: category,
                complianceStatus: category === 'EXTRA_EMPLOYEE' ? 'VERIFIED' : 'PENDING',
                documents: [],
              },
            },
          };
        }),

      addDocument: (workerId, doc) =>
        set((state) => {
          const worker = state.workers[workerId];
          if (!worker) return state;

          const documents = [...worker.documents.filter((d) => d.type !== doc.type), doc];
          const complianceStatus = computeComplianceStatus(documents);

          return {
            workers: {
              ...state.workers,
              [workerId]: {
                ...worker,
                documents,
                complianceStatus,
                lastVerifiedAt: complianceStatus === 'VERIFIED' ? new Date().toISOString() : worker.lastVerifiedAt,
              },
            },
          };
        }),

      removeDocument: (workerId, docId) =>
        set((state) => {
          const worker = state.workers[workerId];
          if (!worker) return state;

          const documents = worker.documents.filter((d) => d.id !== docId);
          const complianceStatus = computeComplianceStatus(documents);

          return {
            workers: {
              ...state.workers,
              [workerId]: { ...worker, documents, complianceStatus },
            },
          };
        }),

      verifySiretNumber: async (workerId, siret) => {
        const result = await verifySiret(siret);

        if (result.success) {
          const kyb: KYBVerification = {
            siretNumber: result.siret,
            companyName: result.companyName,
            legalForm: result.legalForm,
            apeCode: result.apeCode,
            isActive: result.isActive ?? true,
            verifiedAt: new Date().toISOString(),
            source: 'SIRENE',
          };

          set((state) => {
            const worker = state.workers[workerId];
            if (!worker) return state;
            return {
              workers: {
                ...state.workers,
                [workerId]: { ...worker, kyb },
              },
            };
          });
        }

        return result.success;
      },

      verifyUrssafAttestation: async (workerId, fileUrl) => {
        const result = await verifyURSSAFAttestation(fileUrl);

        if (result.success && result.validFrom && result.validUntil) {
          const urssaf: URSSAFVerification = {
            validFrom: result.validFrom,
            validUntil: result.validUntil,
            isValid: true,
            verifiedAt: new Date().toISOString(),
          };

          set((state) => {
            const worker = state.workers[workerId];
            if (!worker) return state;
            return {
              workers: {
                ...state.workers,
                [workerId]: { ...worker, urssaf },
              },
            };
          });
        }

        return result.success;
      },

      refreshComplianceStatus: (workerId) =>
        set((state) => {
          const worker = state.workers[workerId];
          if (!worker) return state;

          const complianceStatus = computeComplianceStatus(worker.documents);
          return {
            workers: {
              ...state.workers,
              [workerId]: { ...worker, complianceStatus },
            },
          };
        }),

      getWorkerCompliance: (workerId) => get().workers[workerId],

      getExpiringDocs: (workerId) => {
        const worker = get().workers[workerId];
        if (!worker) return [];
        return getExpiringDocuments(worker.documents);
      },

      canStartMission: (workerId) => {
        const worker = get().workers[workerId];
        if (!worker) {
          return { allowed: false, reason: 'Profil de conformité non initialisé.' };
        }

        // Les extras n'ont pas besoin de compliance entreprise
        if (worker.employmentCategory === 'EXTRA_EMPLOYEE') {
          return { allowed: true };
        }

        // Freelance : compliance vérifiée obligatoire
        if (worker.complianceStatus === 'VERIFIED') {
          return { allowed: true };
        }

        if (worker.complianceStatus === 'EXPIRED' || worker.complianceStatus === 'SUSPENDED') {
          return {
            allowed: false,
            reason: 'Vos documents de conformité ont expiré. Mettez-les à jour pour accepter des missions.',
          };
        }

        return {
          allowed: false,
          reason: 'Vos documents de conformité sont en attente de vérification (KBIS, URSSAF, RC Pro).',
        };
      },
    }),
    {
      name: 'compliance-storage-v1',
    }
  )
);
