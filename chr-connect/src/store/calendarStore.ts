import { create } from 'zustand';
import { ImageAnnotation } from '@/types/equipment';
import {
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from '@/lib/supabase-helpers';

export type EventType = 'MAINTENANCE' | 'STAFFING' | 'SUPPLY' | 'EVENT' | 'OTHER' | 'NOTE';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string; // HH:MM
  endTime?: string;
  type: EventType;
  description?: string;
  location?: string;
  venueId?: string;
  missionId?: string;
  media?: {
    id: string;
    type: 'image' | 'video' | 'audio';
    url: string;
    name: string;
    annotations?: ImageAnnotation[];
  }[];
}

interface CalendarStore {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;

  // Existing local actions (backward compat)
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsByDate: (date: string) => CalendarEvent[];

  // Async Supabase actions
  fetchEvents: (userId: string, month?: string) => Promise<void>;
  syncAddEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  syncUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  syncDeleteEvent: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,

  // ── Existing local actions (backward compat) ──────────────────────
  addEvent: (event) => set((state) => ({
    events: [...state.events, { ...event, id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2) }]
  })),
  updateEvent: (id, updatedEvent) => set((state) => ({
    events: state.events.map((e) => e.id === id ? { ...e, ...updatedEvent } : e)
  })),
  deleteEvent: (id) => set((state) => ({
    events: state.events.filter((e) => e.id !== id)
  })),
  getEventsByDate: (date) => {
    return get().events.filter((e) => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
  },

  // ── Async Supabase actions ────────────────────────────────────────
  fetchEvents: async (userId: string, month?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await getCalendarEvents(userId, month);
      set({ events: (data as CalendarEvent[] | null) ?? [], isLoading: false });
    } catch (err) {
      console.error('[calendarStore] fetchEvents failed, keeping local data:', err);
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur lors du chargement des evenements' });
    }
  },

  syncAddEvent: async (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    };

    set({ isLoading: true, error: null });
    try {
      const { error } = await createCalendarEvent(newEvent);
      if (error) throw new Error(error.message || 'Échec création évènement');
      set((state) => ({ events: [...state.events, newEvent], isLoading: false }));
    } catch (err) {
      console.error('[calendarStore] syncAddEvent failed:', err);
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'evenement' });
      throw err;
    }
  },

  syncUpdateEvent: async (id: string, updates: Partial<CalendarEvent>) => {
    const previousEvents = get().events;
    // Optimistic update
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));

    try {
      const { error } = await updateCalendarEvent(id, updates);
      if (error) throw new Error(error.message || 'Échec mise à jour évènement');
    } catch (err) {
      console.error('[calendarStore] syncUpdateEvent failed:', err);
      set({
        events: previousEvents,
        error: err instanceof Error ? err.message : 'Erreur lors de la modification',
      });
      throw err;
    }
  },

  syncDeleteEvent: async (id: string) => {
    const previousEvents = get().events;
    // Optimistic delete
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));

    try {
      const { error } = await deleteCalendarEvent(id);
      if (error) throw new Error(error.message || 'Échec suppression évènement');
    } catch (err) {
      console.error('[calendarStore] syncDeleteEvent failed:', err);
      // Revert
      set({
        events: previousEvents,
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression',
      });
      throw err;
    }
  },
}));
