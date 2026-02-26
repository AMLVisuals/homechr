import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mission, Review, Invoice, Provider, TeamMember } from '@/types/missions';

interface MissionsState {
  missions: Mission[];
  team: TeamMember[];
  addMission: (mission: Mission) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  addReview: (missionId: string, review: Review) => void;
  generateInvoice: (missionId: string) => void;
  payInvoice: (invoiceId: string) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
}

// Initial Mock Team Data
const INITIAL_TEAM: TeamMember[] = [
  {
    id: 't1',
    name: 'Jean Dupont',
    role: 'Expert Froid',
    company: 'Froid Express',
    rating: 4.9,
    missions: 12,
    status: 'AVAILABLE',
    avatar: 'https://i.pravatar.cc/150?u=jean',
    tags: ['Froid', 'Clim', 'Ventilation'],
    venueId: 'v1'
  },
  {
    id: 't2',
    name: 'Marie Martin',
    role: 'Chef de Cuisine',
    company: 'Freelance',
    rating: 5.0,
    missions: 8,
    status: 'BUSY',
    avatar: 'https://i.pravatar.cc/150?u=marie',
    tags: ['Cuisine', 'Management', 'HACCP'],
    venueId: 'v1'
  },
  {
    id: 't3',
    name: 'Lucas Bernard',
    role: 'Serveur',
    company: 'StaffPro',
    rating: 4.7,
    missions: 24,
    status: 'OFFLINE',
    avatar: 'https://i.pravatar.cc/150?u=lucas',
    tags: ['Service', 'Bar', 'Cocktails'],
    venueId: 'v2'
  },
  {
    id: 't4',
    name: 'Sophie Dubois',
    role: 'Plombier',
    company: 'Plombier24',
    rating: 4.8,
    missions: 5,
    status: 'AVAILABLE',
    avatar: 'https://i.pravatar.cc/150?u=sophie',
    tags: ['Plomberie', 'Sanitaire'],
    venueId: 'v1'
  }
];

// Initial Mock Data
const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Réparation Four Mixte',
    expert: 'Jean D.',
    status: 'IN_PROGRESS',
    date: 'Aujourd\'hui',
    category: 'MAINTENANCE',
    iconName: 'Wrench',
    color: 'blue',
    price: '150€ est.',
    description: 'Le four ne chauffe plus en mode vapeur.',
    location: { lat: 48.8566, lng: 2.3522, address: 'Cuisine Principale' },
    notes: ['Arrivée sur site prévue dans 15 min', 'Pièce de rechange commandée'],
    provider: {
      id: 'p1',
      name: 'Jean D.',
      rating: 4.8,
      completedMissions: 156,
      bio: 'Expert en équipements de cuisson professionnels depuis 10 ans.',
      phone: '+33 6 12 34 56 78',
      avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop'
    },
    // Provider View Fields
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'hot',
    urgent: true,
    distance: '0.8 km',
    matchScore: 98,
    attributes: {
      interventionType: ['breakdown'],
      equipment: ['oven'],
      urgency: true
    }
  },
  {
    id: 'm2',
    title: 'Extra Chef de Partie',
    expert: 'En attente',
    status: 'SEARCHING',
    date: 'Aujourd\'hui',
    category: 'STAFFING',
    iconName: 'ChefHat',
    color: 'orange',
    price: 'Pending',
    description: 'Besoin urgent pour le service du soir.',
    location: { lat: 48.8566, lng: 2.3522, address: 'Cuisine' },
    // Provider View Fields
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'staff',
    urgent: true,
    distance: '0.8 km',
    matchScore: 95,
    attributes: {
      role: ['chef'],
      serviceType: 'dinner',
      urgency: true
    }
  },
  {
    id: 'm3',
    title: 'Maintenance Clim',
    expert: 'ClimExpress',
    status: 'SCHEDULED',
    date: 'Demain, 09:00',
    category: 'MAINTENANCE',
    iconName: 'Wrench',
    color: 'blue',
    price: '200€ devis',
    location: { lat: 48.8566, lng: 2.3522, address: 'Salle de réception' },
    provider: {
      id: 'p2',
      name: 'ClimExpress',
      rating: 4.5,
      completedMissions: 89,
      bio: 'Spécialiste froid et climatisation.',
      phone: '+33 1 23 45 67 89'
    },
    // Provider View Fields
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'cold',
    urgent: false,
    distance: '0.8 km',
    matchScore: 88,
    attributes: {
      interventionType: ['maintenance'],
      equipment: ['ac'],
      urgency: false
    }
  },
  {
    id: 'm4',
    title: 'Remplacement Ampoules',
    expert: 'Marc Volt',
    status: 'COMPLETED',
    date: 'Hier',
    category: 'MAINTENANCE',
    iconName: 'Monitor', // Using Monitor as proxy for electrical/tech
    color: 'purple',
    price: '85€',
    location: { lat: 48.8566, lng: 2.3522, address: 'Couloir Entrée' },
    notes: ['Toutes les ampoules LED ont été remplacées.', 'Vérification du tableau électrique OK.'],
    photos: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800', 
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800'
    ],
    provider: {
      id: 'p3',
      name: 'Marc Volt',
      rating: 4.9,
      completedMissions: 230,
      bio: 'Électricien qualifié, intervention rapide.',
      phone: '+33 6 98 76 54 32',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
    },
    // Pre-existing invoice for completed mission
    invoice: {
      id: 'inv-m4',
      missionId: 'm4',
      number: 'INV-2023-001',
      date: '2023-10-25',
      dueDate: '2023-11-25',
      status: 'PAID',
      items: [
        { description: 'Remplacement Ampoules LED', quantity: 5, unitPrice: 10 },
        { description: 'Main d\'œuvre', quantity: 1, unitPrice: 35 }
      ],
      totalAmount: 85,
      taxAmount: 17,
      fileUrl: '#'
    },
    // Provider View Fields
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'electricity',
    urgent: false,
    distance: '0.8 km',
    matchScore: 92,
    attributes: {
      interventionType: ['maintenance'],
      urgency: false
    }
  },
  {
    id: 'm5',
    title: 'Extra Serveur',
    expert: 'Lucas B.',
    status: 'COMPLETED',
    date: '05 Juin',
    category: 'STAFFING',
    iconName: 'ChefHat',
    color: 'orange',
    price: '120€',
    location: { lat: 48.8566, lng: 2.3522, address: 'Salle Principale' },
    provider: {
      id: 'p4',
      name: 'Lucas B.',
      rating: 4.7,
      completedMissions: 45,
      bio: 'Serveur expérimenté, parle anglais couramment.',
      phone: '+33 6 00 00 00 00',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop'
    },
    invoice: {
      id: 'inv-m5',
      missionId: 'm5',
      number: 'INV-2023-042',
      date: '2023-06-05',
      dueDate: '2023-07-05',
      status: 'PENDING',
      items: [
        { description: 'Service Extra Soir', quantity: 1, unitPrice: 120 }
      ],
      totalAmount: 120,
      taxAmount: 24,
      fileUrl: '#'
    },
    // Provider View Fields
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'staff',
    urgent: false,
    distance: '0.8 km',
    matchScore: 90,
    attributes: {
      role: ['waiter'],
      serviceType: 'dinner',
      urgency: false
    }
  }
];

export const useMissionsStore = create<MissionsState>()(
  persist(
    (set, get) => ({
      missions: INITIAL_MISSIONS,
      team: INITIAL_TEAM,
      addMission: (mission) => set((state) => ({ 
        missions: [mission, ...state.missions] 
      })),
      updateMission: (id, updates) => set((state) => ({
        missions: state.missions.map((m) => m.id === id ? { ...m, ...updates } : m)
      })),
      addReview: (missionId, review) => set((state) => ({
        missions: state.missions.map((m) => m.id === missionId ? { ...m, review } : m)
      })),
      generateInvoice: (missionId) => set((state) => {
        const mission = state.missions.find(m => m.id === missionId);
        if (!mission || mission.invoice) return state;

        // Parse price from string if needed, or use a default
        let priceNum = 0;
        if (typeof mission.price === 'string') {
          priceNum = parseInt(mission.price.replace(/[^0-9]/g, '')) || 100;
        } else {
          priceNum = mission.price || 100;
        }

        const tax = priceNum * 0.20;
        const now = new Date();
        const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const newInvoice: Invoice = {
          id: `inv-${Date.now()}`,
          missionId: mission.id,
          number: `INV-${now.getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          date: now.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          status: 'PENDING',
          items: [
            { description: mission.title, quantity: 1, unitPrice: priceNum }
          ],
          totalAmount: priceNum,
          taxAmount: tax,
          fileUrl: '#',
          issuerDetails: {
            name: mission.provider?.name || 'Prestataire',
            address: '123 Avenue des Champs-Élysées, 75008 Paris',
            siret: '123 456 789 00012',
            email: 'contact@prestataire.com',
            logo: mission.provider?.avatar
          },
          clientDetails: {
            name: mission.venue || 'Le Bistrot Parisien',
            address: '10 Rue de la Paix, 75002 Paris',
            vatNumber: 'FR 12 345678900'
          },
          history: [
            {
              date: now.toISOString(),
              status: 'CREATED',
              label: 'Facture générée automatiquement'
            },
            {
              date: now.toISOString(),
              status: 'SENT',
              label: 'Envoyée au client'
            }
          ]
        };

        return {
          missions: state.missions.map(m => m.id === missionId ? { ...m, invoice: newInvoice } : m)
        };
      }),
      payInvoice: (invoiceId) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.invoice && m.invoice.id === invoiceId) {
            const now = new Date();
            return {
              ...m,
              invoice: { 
                ...m.invoice, 
                status: 'PAID',
                paymentMethod: {
                  type: 'CARD',
                  last4: '4242'
                },
                history: [
                  ...(m.invoice.history || []),
                  {
                    date: now.toISOString(),
                    status: 'PAID',
                    label: 'Paiement reçu par carte bancaire'
                  }
                ]
              }
            };
          }
          return m;
        })
      })),
      addTeamMember: (member) => set((state) => ({ team: [...state.team, member] })),
      updateTeamMember: (id, updates) => set((state) => ({
        team: state.team.map((t) => t.id === id ? { ...t, ...updates } : t)
      })),
      removeTeamMember: (id) => set((state) => ({
        team: state.team.filter((t) => t.id !== id)
      }))
    }),
    {
      name: 'missions-storage-v2', // Changed to v2 to force reset with new team venueIds
    }
  )
);
