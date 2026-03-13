import { create } from 'zustand';
import type { ComplianceDocType } from '@/types/compliance';

export type UserRole = 'PATRON' | 'WORKER' | null;
export type WorkerSkill = string;
export type Theme = 'light' | 'dark';
export type ProfileValidationStatus = 'incomplete' | 'pending_validation' | 'validated' | 'rejected';
export type DocUploadStatus = 'idle' | 'uploading' | 'pending' | 'verified';

export interface PatronDocUpload {
  type: ComplianceDocType;
  status: DocUploadStatus;
  fileName?: string;
  uploadedAt?: string;
}

interface AppState {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  workerSkills: WorkerSkill[];
  toggleWorkerSkill: (skill: WorkerSkill) => void;

  isOnAir: boolean;
  toggleOnAir: () => void;
  setIsOnAir: (value: boolean) => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;

  isPremium: boolean;
  setPremium: (isPremium: boolean) => void;

  // Patron profile compliance
  patronProfileStatus: ProfileValidationStatus;
  patronDocUploads: PatronDocUpload[];
  setPatronDocStatus: (type: ComplianceDocType, status: DocUploadStatus, fileName?: string) => void;
  setPatronProfileStatus: (status: ProfileValidationStatus) => void;

  // For simulation purposes
  pendingRequests: any[];
  addRequest: (request: any) => void;
}

export const useStore = create<AppState>((set) => ({
  userRole: null,
  setUserRole: (role) => set({ userRole: role }),

  workerSkills: [],
  toggleWorkerSkill: (skill) => set((state) => ({
    workerSkills: state.workerSkills.includes(skill)
      ? state.workerSkills.filter(s => s !== skill)
      : [...state.workerSkills, skill]
  })),

  isOnAir: false,
  toggleOnAir: () => set((state) => ({ isOnAir: !state.isOnAir })),
  setIsOnAir: (value) => set({ isOnAir: value }),

  theme: 'light',
  setTheme: (theme) => set({ theme }),

  isPremium: false,
  setPremium: (isPremium) => set({ isPremium }),

  // Patron profile compliance
  patronProfileStatus: 'incomplete',
  patronDocUploads: [
    { type: 'IDENTITY', status: 'idle' },
    { type: 'ATTESTATION_PRO_KBIS', status: 'idle' },
    { type: 'RIB', status: 'idle' },
  ],
  setPatronDocStatus: (type, status, fileName) => set((state) => ({
    patronDocUploads: state.patronDocUploads.map(d =>
      d.type === type
        ? { ...d, status, fileName: fileName ?? d.fileName, uploadedAt: status === 'verified' ? new Date().toISOString() : d.uploadedAt }
        : d
    ),
  })),
  setPatronProfileStatus: (status) => set({ patronProfileStatus: status }),

  pendingRequests: [],
  addRequest: (request) => set((state) => ({ pendingRequests: [request, ...state.pendingRequests] })),
}));
