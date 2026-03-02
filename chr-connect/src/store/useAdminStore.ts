import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '@/types/admin';

interface AdminState {
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const MOCK_CREDENTIALS: { email: string; password: string; user: AdminUser }[] = [
  {
    email: 'admin@chr-connect.fr',
    password: 'admin123',
    user: { id: 'adm_001', email: 'admin@chr-connect.fr', name: 'Laurent Dupont', role: 'ADMIN' },
  },
  {
    email: 'support@chr-connect.fr',
    password: 'support123',
    user: { id: 'adm_002', email: 'support@chr-connect.fr', name: 'Marie Lefèvre', role: 'SUPPORT' },
  },
];

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      adminUser: null,
      login: (email, password) => {
        const match = MOCK_CREDENTIALS.find(
          (c) => c.email === email && c.password === password
        );
        if (match) {
          set({ isAuthenticated: true, adminUser: match.user });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false, adminUser: null }),
    }),
    { name: 'admin-auth-v1' }
  )
);
