import { create } from 'zustand';
import { Venue, VenueFormData } from '@/types/venue';
import {
  getVenuesByOwner,
  createVenue as supabaseCreateVenue,
  updateVenue as supabaseUpdateVenue,
  deleteVenue as supabaseDeleteVenue,
} from '@/lib/supabase-helpers';

interface VenuesState {
  venues: Venue[];
  activeVenueId: string | null;
  isLoading: boolean;
  error: string | null;

  // Existing sync actions (backward compatibility)
  setActiveVenue: (id: string) => void;
  addVenue: (venue: VenueFormData) => void;
  updateVenue: (id: string, venue: Partial<VenueFormData>) => void;
  deleteVenue: (id: string) => void;
  getVenue: (id: string) => Venue | undefined;

  // New async Supabase actions
  fetchVenues: (ownerId: string) => Promise<void>;
  syncAddVenue: (venueData: VenueFormData, ownerId: string) => Promise<Venue | null>;
  syncUpdateVenue: (id: string, updates: Partial<VenueFormData>) => Promise<boolean>;
  syncDeleteVenue: (id: string) => Promise<boolean>;
}

export const useVenuesStore = create<VenuesState>((set, get) => ({
  venues: [],
  activeVenueId: null,
  isLoading: false,
  error: null,

  // ── Existing sync actions (backward compatible) ──────────────────────

  setActiveVenue: (id) => set({ activeVenueId: id }),

  addVenue: (venueData) => set((state) => {
    const newVenue: Venue = {
      id: Math.random().toString(36).substr(2, 9),
      name: venueData.name || 'Nouvel Établissement',
      address: venueData.address || '',
      city: venueData.city || '',
      zipCode: venueData.zipCode || '',
      category: venueData.category || 'Autre',
      photos: [],
      technical: {
        elecType: 'UNKNOWN',
        gasType: 'NONE',
        hasFreightElevator: false,
        hasElevator: false,
        deliveryAccess: 'STREET',
        hasVentilation: false,
        hasAirConditioning: false
      },
      ...venueData,
      isVerified: false
    };
    return {
      venues: [...state.venues, newVenue],
      activeVenueId: newVenue.id
    };
  }),

  updateVenue: (id, venueData) => set((state) => ({
    venues: state.venues.map(v => v.id === id ? { ...v, ...venueData } : v)
  })),

  deleteVenue: (id) => set((state) => {
    const newVenues = state.venues.filter(v => v.id !== id);
    return {
      venues: newVenues,
      activeVenueId: state.activeVenueId === id ? (newVenues[0]?.id || null) : state.activeVenueId
    };
  }),

  getVenue: (id) => get().venues.find(v => v.id === id),

  // ── New async Supabase actions ───────────────────────────────────────

  fetchVenues: async (ownerId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: venues } = await getVenuesByOwner(ownerId);
      if (venues && venues.length > 0) {
        set({
          venues,
          activeVenueId: get().activeVenueId && venues.some((v: any) => v.id === get().activeVenueId)
            ? get().activeVenueId
            : venues[0].id,
          isLoading: false,
        });
      } else {
          set({ venues: [], isLoading: false });
      }
    } catch (error) {
      console.error('[useVenuesStore] fetchVenues failed:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des etablissements',
      });
      // Keep current state as fallback on error
    }
  },

  syncAddVenue: async (venueData, ownerId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: created, error: createError } = await supabaseCreateVenue({ ...venueData, owner_id: ownerId });
      if (createError) {
        console.error('[syncAddVenue] Supabase error:', createError.message, createError.details, createError.hint);
        throw new Error(createError.message);
      }
      if (!created) throw new Error('Création échouée');
      set((state) => ({
        venues: [...state.venues, created],
        activeVenueId: created.id,
        isLoading: false,
      }));
      return created;
    } catch (error) {
      console.error('[useVenuesStore] syncAddVenue failed:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la creation',
      });
      return null;
    }
  },

  syncUpdateVenue: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data: updated } = await supabaseUpdateVenue(id, updates);
      set((state) => ({
        venues: state.venues.map(v => v.id === id ? { ...v, ...updated } : v),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      console.error('[useVenuesStore] syncUpdateVenue failed:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise a jour',
      });
      return false;
    }
  },

  syncDeleteVenue: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await supabaseDeleteVenue(id);
      set((state) => {
        const newVenues = state.venues.filter(v => v.id !== id);
        return {
          venues: newVenues,
          activeVenueId: state.activeVenueId === id ? (newVenues[0]?.id || null) : state.activeVenueId,
          isLoading: false,
        };
      });
      return true;
    } catch (error) {
      console.error('[useVenuesStore] syncDeleteVenue failed:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression',
      });
      return false;
    }
  },
}));
