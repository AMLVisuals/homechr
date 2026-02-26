import { create } from 'zustand';
import { Venue, VenueFormData } from '@/types/venue';

interface VenuesState {
  venues: Venue[];
  activeVenueId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setActiveVenue: (id: string) => void;
  addVenue: (venue: VenueFormData) => void;
  updateVenue: (id: string, venue: Partial<VenueFormData>) => void;
  deleteVenue: (id: string) => void;
  getVenue: (id: string) => Venue | undefined;
}

// Mock Initial Data
const INITIAL_VENUES: Venue[] = [
  {
    id: 'v1',
    name: "Le Fouquet's Paris",
    address: "99 Av. des Champs-Élysées",
    city: "Paris",
    zipCode: "75008",
    category: "Restaurant Gastronomique",
    photoUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop",
    photos: [
      {
        id: 'p1',
        url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop",
        type: 'FACADE',
        uploadedAt: new Date().toISOString()
      }
    ],
    rating: 4.8,
    reviewCount: 1234,
    priceLevel: 3,
    access: {
      digicode: "1234A",
      contactName: "Jean Dupont",
      instructions: "Entrée livraison rue de Bassano. Sonner à 'Réception'.",
      wifiSSID: "Fouquets_Guest",
      wifiPassword: "Welcome2024!"
    },
    isVerified: true,
    technical: {
      elecType: 'TRI',
      gasType: 'TOWN',
      hasFreightElevator: true,
      hasElevator: true,
      deliveryAccess: 'COURTYARD',
      kitchenType: 'CLOSED',
      hasVentilation: true,
      hasAirConditioning: true
    }
  },
  {
    id: 'v2',
    name: "La Tour d'Argent",
    address: "15 Quai de la Tournelle",
    city: "Paris",
    zipCode: "75005",
    category: "Restaurant Gastronomique",
    photoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop",
    photos: [
      {
        id: 'p2',
        url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop",
        type: 'DINING_ROOM',
        uploadedAt: new Date().toISOString()
      }
    ],
    rating: 4.7,
    reviewCount: 856,
    priceLevel: 4,
    access: {
      contactName: "Marie V.",
      instructions: "Ascenseur de service au fond de la cour."
    },
    isVerified: true
  },
  {
    id: 'v3',
    name: "L'Ambroisie",
    address: "9 Place des Vosges",
    city: "Paris",
    zipCode: "75004",
    category: "Haute Cuisine",
    photoUrl: "https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=2070&auto=format&fit=crop",
    photos: [
      {
        id: 'p3',
        url: "https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=2070&auto=format&fit=crop",
        type: 'DINING_ROOM',
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'p3-2',
        url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop",
        type: 'KITCHEN',
        uploadedAt: new Date().toISOString()
      }
    ],
    rating: 4.9,
    reviewCount: 450,
    priceLevel: 4,
    access: {
      contactName: "Chef Pacaud",
      phone: "+33 1 42 78 51 45",
      instructions: "Entrée artistes côté cour."
    },
    isVerified: true,
    technical: {
        elecType: 'TRI',
        gasType: 'TOWN',
        hasFreightElevator: false,
        hasElevator: false,
        deliveryAccess: 'COURTYARD',
        kitchenType: 'CLOSED',
        hasVentilation: true,
        hasAirConditioning: true
    },
    equipment: {
        hasPrivateRooms: true,
        hasTerrace: false
    }
  },
  {
    id: 'v4',
    name: "Hôtel Costes",
    address: "239 Rue Saint-Honoré",
    city: "Paris",
    zipCode: "75001",
    category: "Hôtel & Restaurant",
    photoUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop",
    photos: [
       {
        id: 'p4',
        url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop",
        type: 'DINING_ROOM',
        uploadedAt: new Date().toISOString()
      }
    ],
    rating: 4.6,
    reviewCount: 2100,
    priceLevel: 4,
    access: {
      contactName: "Conciergerie",
      phone: "+33 1 42 44 50 00",
      instructions: "Passer par l'entrée de service rue de Castiglione."
    },
    isVerified: true
  }
];

export const useVenuesStore = create<VenuesState>((set, get) => ({
  venues: INITIAL_VENUES,
  activeVenueId: 'v1',
  isLoading: false,
  error: null,

  setActiveVenue: (id) => set({ activeVenueId: id }),

  addVenue: (venueData) => set((state) => {
    const newVenue: Venue = {
      id: Math.random().toString(36).substr(2, 9),
      name: venueData.name || 'Nouvel Établissement',
      address: venueData.address || '',
      city: venueData.city || '',
      zipCode: venueData.zipCode || '',
      category: venueData.category || 'Autre',
      photos: [], // Default empty photos
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
      isVerified: false // New manual venues are not verified by default
    };
    return { 
      venues: [...state.venues, newVenue],
      activeVenueId: newVenue.id // Auto-select new venue
    };
  }),

  updateVenue: (id, venueData) => set((state) => ({
    venues: state.venues.map(v => v.id === id ? { ...v, ...venueData } : v)
  })),

  deleteVenue: (id) => set((state) => {
    const newVenues = state.venues.filter(v => v.id !== id);
    return {
      venues: newVenues,
      // If we deleted the active venue, switch to the first one available or null
      activeVenueId: state.activeVenueId === id ? (newVenues[0]?.id || null) : state.activeVenueId
    };
  }),

  getVenue: (id) => get().venues.find(v => v.id === id)
}));
