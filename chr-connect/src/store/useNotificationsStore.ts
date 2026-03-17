import { create } from 'zustand';

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
  addNotification: (notif: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
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

// ── Seed data ────────────────────────────────────────────────────────
const now = new Date();

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-seed-1',
    title: 'Mission creee',
    description: 'Votre demande de technicien a ete publiee.',
    type: 'mission',
    read: false,
    time: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
  },
  {
    id: 'notif-seed-2',
    title: 'Prestataire trouve',
    description: 'Un expert plombier est disponible pour votre mission.',
    type: 'worker',
    read: false,
    time: new Date(now.getTime() - 15 * 60 * 1000), // 15 min ago
  },
  {
    id: 'notif-seed-3',
    title: 'Mission terminee',
    description: 'La reparation du four a ete validee avec succes.',
    type: 'mission',
    read: true,
    time: new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
  },
];

// ── Store ────────────────────────────────────────────────────────────
let nextId = 1;

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: SEED_NOTIFICATIONS,

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
}));
