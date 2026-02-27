import { create } from 'zustand';

export type UserRole = 'PATRON' | 'WORKER' | null;
export type WorkerSkill = string;
export type Theme = 'light' | 'dark';

interface AppState {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  
  workerSkills: WorkerSkill[];
  toggleWorkerSkill: (skill: WorkerSkill) => void;
  
  isOnAir: boolean;
  toggleOnAir: () => void;
  
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  isPremium: boolean;
  setPremium: (isPremium: boolean) => void;
  
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
  
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  
  isPremium: false,
  setPremium: (isPremium) => set({ isPremium }),
  
  pendingRequests: [],
  addRequest: (request) => set((state) => ({ pendingRequests: [request, ...state.pendingRequests] })),
}));
