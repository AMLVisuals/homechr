import { create } from 'zustand';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
} from '@/lib/supabase-helpers';

// ── Types ────────────────────────────────────────────────────────────
export type NotificationType = 'mission' | 'worker' | 'payment' | 'system' | 'equipment' | 'dispute';

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: Date;
  read: boolean;
  type: NotificationType;
}

interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;

  // Existing local actions (backward compat)
  addNotification: (notif: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;

  // Async Supabase actions
  fetchNotifications: (userId: string) => Promise<void>;
  syncMarkAsRead: (id: string) => Promise<void>;
  syncMarkAllAsRead: (userId: string) => Promise<void>;
  syncAddNotification: (notif: Omit<Notification, 'id' | 'time' | 'read'>) => Promise<void>;
}

// ── Helper: relative time in French ──────────────────────────────────
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffH = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffH / 24);

  if (diffSec < 60) return 'A l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

// ── Store ────────────────────────────────────────────────────────────
let nextId = 1;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  // ── Existing local actions (backward compat) ──────────────────────
  addNotification: (notif) =>
    set((state) => ({
      notifications: [
        {
          ...notif,
          id: `notif-${Date.now()}-${nextId++}`,
          time: new Date(),
          read: false,
        },
        ...state.notifications,
      ],
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // ── Async Supabase actions ────────────────────────────────────────
  fetchNotifications: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await getNotifications(userId);
      set({ notifications: (data as Notification[] | null) ?? [], isLoading: false });
    } catch (err) {
      console.error('[useNotificationsStore] fetchNotifications failed, keeping local data:', err);
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur lors du chargement des notifications' });
    }
  },

  syncMarkAsRead: async (id: string) => {
    // Optimistic local update
    const { markAsRead } = get();
    markAsRead(id);

    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('[useNotificationsStore] syncMarkAsRead failed:', err);
      // Revert: mark as unread
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: false } : n
        ),
        error: err instanceof Error ? err.message : 'Erreur lors du marquage',
      }));
    }
  },

  syncMarkAllAsRead: async (userId: string) => {
    // Optimistic local update
    const previousNotifications = get().notifications;
    const { markAllAsRead } = get();
    markAllAsRead();

    try {
      await markAllNotificationsRead(userId);
    } catch (err) {
      console.error('[useNotificationsStore] syncMarkAllAsRead failed:', err);
      // Revert
      set({
        notifications: previousNotifications,
        error: err instanceof Error ? err.message : 'Erreur lors du marquage',
      });
    }
  },

  syncAddNotification: async (notif) => {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${nextId++}`,
      time: new Date(),
      read: false,
    };

    set({ isLoading: true, error: null });
    try {
      await createNotification(newNotif);
      set((state) => ({
        notifications: [newNotif, ...state.notifications],
        isLoading: false,
      }));
    } catch (err) {
      console.error('[useNotificationsStore] syncAddNotification failed:', err);
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la notification' });
    }
  },
}));
