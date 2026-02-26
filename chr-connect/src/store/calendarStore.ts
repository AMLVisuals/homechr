import { create } from 'zustand';
import { ImageAnnotation } from '@/types/equipment';

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
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsByDate: (date: string) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [
    {
      id: '1',
      title: 'Maintenance Clim',
      date: new Date().toISOString().split('T')[0], // Today
      time: '09:00',
      type: 'MAINTENANCE',
      description: 'Vérification annuelle des filtres',
      location: 'Cuisine principale',
      venueId: 'v1'
    },
    {
      id: '2',
      title: 'Extra Serveur',
      date: new Date().toISOString().split('T')[0], // Today
      time: '18:00',
      endTime: '23:00',
      type: 'STAFFING',
      description: 'Service du soir - Groupe 20 pax',
      location: 'Salle',
      venueId: 'v1'
    },
    {
      id: '3',
      title: 'Livraison Vins',
      date: new Date().toISOString().split('T')[0], // Today
      time: '10:30',
      type: 'SUPPLY',
      description: 'Réception commande Grand Crus',
      location: 'Cave',
      venueId: 'v2' // La Tour d'Argent
    },
    {
      id: '4',
      title: 'Inventaire Mensuel',
      date: new Date().toISOString().split('T')[0], // Today
      time: '14:00',
      type: 'OTHER',
      description: 'Comptage stocks',
      location: 'Stock',
      venueId: 'v3' // L'Ambroisie
    }
  ],
  addEvent: (event) => set((state) => ({
    events: [...state.events, { ...event, id: Math.random().toString(36).substr(2, 9) }]
  })),
  updateEvent: (id, updatedEvent) => set((state) => ({
    events: state.events.map((e) => e.id === id ? { ...e, ...updatedEvent } : e)
  })),
  deleteEvent: (id) => set((state) => ({
    events: state.events.filter((e) => e.id !== id)
  })),
  getEventsByDate: (date) => {
    return get().events.filter((e) => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
  }
}));
