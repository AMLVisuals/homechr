import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser, AdminRole, StaffAccount } from '@/types/admin';

interface StaffCreateData {
  name: string;
  email: string;
  phone?: string;
  role: AdminRole;
  jobTitle?: string;
  password: string;
  notes?: string;
}

interface AdminState {
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  staffAccounts: StaffAccount[];
  /** Maps staff email → password (mock only, never do this in prod) */
  staffPasswords: Record<string, string>;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addStaffAccount: (data: StaffCreateData) => void;
  updateStaffAccount: (id: string, updates: Partial<Pick<StaffAccount, 'name' | 'email' | 'phone' | 'role' | 'jobTitle' | 'status' | 'notes'>>) => void;
  updateStaffPassword: (id: string, newPassword: string) => void;
  removeStaffAccount: (id: string) => void;
}

const INITIAL_STAFF: StaffAccount[] = [
  {
    id: 'adm_001',
    name: 'Laurent Dupont',
    email: 'admin@chr-connect.fr',
    phone: '+33 6 12 34 56 78',
    role: 'ADMIN',
    jobTitle: 'Directeur technique',
    status: 'ACTIVE',
    createdAt: '2025-05-01T10:00:00Z',
    lastLoginAt: '2026-03-12T08:30:00Z',
    notes: 'Fondateur — accès total',
  },
  {
    id: 'adm_002',
    name: 'Marie Lefèvre',
    email: 'support@chr-connect.fr',
    phone: '+33 6 98 76 54 32',
    role: 'SUPPORT',
    jobTitle: 'Chargée de support client',
    status: 'ACTIVE',
    createdAt: '2025-09-15T14:00:00Z',
    lastLoginAt: '2026-03-11T17:45:00Z',
  },
];

const INITIAL_PASSWORDS: Record<string, string> = {
  'admin@chr-connect.fr': 'admin123',
  'support@chr-connect.fr': 'support123',
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      adminUser: null,
      staffAccounts: INITIAL_STAFF,
      staffPasswords: INITIAL_PASSWORDS,

      login: (email, password) => {
        const state = get();
        const staff = state.staffAccounts.find(
          (s) => s.email === email && s.status === 'ACTIVE'
        );
        const expectedPassword = state.staffPasswords[email];

        if (staff && expectedPassword && password === expectedPassword) {
          set((prev) => ({
            isAuthenticated: true,
            adminUser: { id: staff.id, email: staff.email, name: staff.name, role: staff.role },
            staffAccounts: prev.staffAccounts.map((s) =>
              s.id === staff.id ? { ...s, lastLoginAt: new Date().toISOString() } : s
            ),
          }));
          return true;
        }

        return false;
      },

      logout: () => set({ isAuthenticated: false, adminUser: null }),

      addStaffAccount: (data) => {
        const newAccount: StaffAccount = {
          id: `adm_${Date.now().toString(36)}`,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          jobTitle: data.jobTitle,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          notes: data.notes,
        };
        set((state) => ({
          staffAccounts: [...state.staffAccounts, newAccount],
          staffPasswords: { ...state.staffPasswords, [data.email]: data.password },
        }));
      },

      updateStaffAccount: (id, updates) => {
        set((state) => {
          const oldAccount = state.staffAccounts.find((s) => s.id === id);
          const newPasswords = { ...state.staffPasswords };

          // If email changed, migrate the password entry
          if (updates.email && oldAccount && updates.email !== oldAccount.email) {
            const pwd = newPasswords[oldAccount.email];
            if (pwd) {
              delete newPasswords[oldAccount.email];
              newPasswords[updates.email] = pwd;
            }
          }

          return {
            staffAccounts: state.staffAccounts.map((s) =>
              s.id === id ? { ...s, ...updates } : s
            ),
            staffPasswords: newPasswords,
          };
        });
      },

      updateStaffPassword: (id, newPassword) => {
        const account = get().staffAccounts.find((s) => s.id === id);
        if (!account) return;
        set((state) => ({
          staffPasswords: { ...state.staffPasswords, [account.email]: newPassword },
        }));
      },

      removeStaffAccount: (id) => {
        const currentUser = get().adminUser;
        if (currentUser?.id === id) return;
        const account = get().staffAccounts.find((s) => s.id === id);
        set((state) => {
          const newPasswords = { ...state.staffPasswords };
          if (account) delete newPasswords[account.email];
          return {
            staffAccounts: state.staffAccounts.filter((s) => s.id !== id),
            staffPasswords: newPasswords,
          };
        });
      },
    }),
    { name: 'admin-auth-v3' }
  )
);
