import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mission, MissionCandidate, Review, Invoice, InvoiceItem, Provider, TeamMember } from '@/types/missions';
import type { DPAEMissionStatus } from '@/types/compliance';

// Schedule statuses per member per day
export type ScheduleStatus = 'PRESENT' | 'CONGE' | 'MALADIE';
// { "2026-03-09": { "t1": "PRESENT", "t2": "CONGE" } }
type TeamSchedule = Record<string, Record<string, ScheduleStatus>>;

interface MissionsState {
  missions: Mission[];
  team: TeamMember[];
  teamSchedule: TeamSchedule;
  addMission: (mission: Mission) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  addReview: (missionId: string, review: Review) => void;
  generateInvoice: (missionId: string) => void;
  payInvoice: (invoiceId: string) => void;
  rejectQuote: (missionId: string, rejection: NonNullable<Mission['quoteRejection']>) => void;
  setPartsStatus: (missionId: string, status: 'PART_ORDERED' | 'PART_RECEIVED') => void;
  validateStaffMission: (missionId: string, hoursWorked?: number) => void;
  resumeStandbyMission: (missionId: string) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  setScheduleStatus: (date: string, memberId: string, status: ScheduleStatus | null) => void;
  addCandidate: (missionId: string, candidate: MissionCandidate) => void;
  removeCandidate: (missionId: string, candidateId: string) => void;
  selectCandidate: (missionId: string, candidateId: string) => void;
  rejectCandidate: (missionId: string, candidateId: string) => void;
  updateDpaeStatus: (missionId: string, status: DPAEMissionStatus, receiptId?: string) => void;
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
  },
  // === Additional SEARCHING missions for dispatch demo ===
  {
    id: 'm6',
    title: 'Panne Chambre Froide Urgente',
    expert: 'En attente',
    status: 'SEARCHING',
    date: "Aujourd'hui",
    category: 'MAINTENANCE',
    iconName: 'Wrench',
    color: 'blue',
    price: '280€ est.',
    description: 'Chambre froide positive en alarme haute température. Risque de perte de stock.',
    location: { lat: 48.8620, lng: 2.3400, address: 'Cuisine Sous-sol' },
    venue: 'Brasserie du Marais',
    venueId: 'v3',
    type: 'cold',
    urgent: true,
    distance: '1.2 km',
    matchScore: 96,
    attributes: { interventionType: ['breakdown'], equipment: ['cold_room'], urgency: true }
  },
  {
    id: 'm7',
    title: 'Maintenance Climatisation Salle',
    expert: 'En attente',
    status: 'SEARCHING',
    date: "Aujourd'hui",
    category: 'MAINTENANCE',
    iconName: 'Wrench',
    color: 'blue',
    price: '150€ est.',
    description: 'Entretien préventif climatisation salle de restaurant 80 couverts.',
    location: { lat: 48.8530, lng: 2.3490, address: 'Salle principale' },
    venue: 'Le Grand Café',
    venueId: 'v4',
    type: 'cold',
    urgent: false,
    distance: '2.1 km',
    matchScore: 85,
    attributes: { interventionType: ['maintenance'], equipment: ['ac'], urgency: false }
  },
  {
    id: 'm8',
    title: 'Extra Barman Cocktails',
    expert: 'En attente',
    status: 'SEARCHING',
    date: "Aujourd'hui",
    category: 'STAFFING',
    iconName: 'ChefHat',
    color: 'orange',
    price: '180€',
    description: 'Soirée cocktails 150 personnes. Expérience mixologie requise.',
    location: { lat: 48.8650, lng: 2.3300, address: 'Bar Rooftop' },
    venue: 'Sky Lounge Paris',
    venueId: 'v5',
    type: 'staff',
    urgent: true,
    distance: '0.5 km',
    matchScore: 92,
    attributes: { role: ['bartender'], serviceType: 'evening', urgency: true }
  },
  {
    id: 'm9',
    title: 'Fuite sous évier cuisine',
    expert: 'En attente',
    status: 'SEARCHING',
    date: "Aujourd'hui",
    category: 'MAINTENANCE',
    iconName: 'Wrench',
    color: 'blue',
    price: '120€ est.',
    description: 'Fuite importante sous évier principal. Service perturbé.',
    location: { lat: 48.8590, lng: 2.3550, address: 'Cuisine' },
    venue: 'Chez Marcel',
    venueId: 'v6',
    type: 'plumbing',
    urgent: true,
    distance: '0.9 km',
    matchScore: 94,
    attributes: { interventionType: ['breakdown'], urgency: true }
  },
  {
    id: 'm10',
    title: 'Révision Machine à Café',
    expert: 'En attente',
    status: 'SEARCHING',
    date: "Aujourd'hui",
    category: 'MAINTENANCE',
    iconName: 'Wrench',
    color: 'blue',
    price: '95€ est.',
    description: 'Machine La Cimbali en perte de pression. Détartrage + réglage moulin.',
    location: { lat: 48.8700, lng: 2.3450, address: 'Comptoir' },
    venue: 'Café de Flore',
    venueId: 'v7',
    type: 'coffee',
    urgent: false,
    distance: '1.8 km',
    matchScore: 88,
    attributes: { interventionType: ['maintenance'], equipment: ['coffee_machine'], urgency: false }
  },
  {
    id: 'm11',
    title: 'Panne Tableau Électrique',
    expert: 'En attente',
    status: 'SEARCHING',
    date: "Aujourd'hui",
    category: 'MAINTENANCE',
    iconName: 'Zap',
    color: 'purple',
    price: '200€ est.',
    description: 'Disjoncteur général saute toutes les 2h. Diagnostic complet nécessaire.',
    location: { lat: 48.8550, lng: 2.3600, address: 'Local technique' },
    venue: 'Restaurant L\'Entrecôte',
    venueId: 'v8',
    type: 'electricity',
    urgent: true,
    distance: '1.5 km',
    matchScore: 91,
    attributes: { interventionType: ['breakdown'], urgency: true }
  },
  // === STAFFING missions for barman dispatch demo ===
  {
    id: 'm12',
    title: 'Barman Service du Soir',
    expert: 'En attente',
    status: 'SEARCHING',
    date: "Aujourd'hui",
    category: 'STAFFING',
    iconName: 'ChefHat',
    color: 'orange',
    price: '160€',
    description: 'Service du soir 19h-01h. Bar à cocktails, 80 couverts. Expérience bar requise.',
    location: { lat: 48.8580, lng: 2.3470, address: 'Bar Principal' },
    venue: 'Le Comptoir du Panthéon',
    venueId: 'v9',
    type: 'staff',
    urgent: false,
    distance: '1.1 km',
    matchScore: 90,
    attributes: { role: ['bartender'], serviceType: 'dinner', establishmentType: ['restaurant'], urgency: false }
  },
  {
    id: 'm13',
    title: 'Extra Barman Brunch',
    expert: 'En attente',
    status: 'SEARCHING',
    date: "Aujourd'hui",
    category: 'STAFFING',
    iconName: 'ChefHat',
    color: 'orange',
    price: '120€',
    description: 'Brunch dominical 10h-16h. Préparation cocktails sans alcool + service boissons chaudes.',
    location: { lat: 48.8640, lng: 2.3380, address: 'Terrasse' },
    venue: 'Café Marly',
    venueId: 'v10',
    type: 'staff',
    urgent: false,
    distance: '0.7 km',
    matchScore: 87,
    attributes: { role: ['bartender'], serviceType: 'brunch', establishmentType: ['cafe'], urgency: false }
  },
  {
    id: 'm14',
    title: 'Barman Événement Privé Urgent',
    expert: 'En attente',
    status: 'SEARCHING',
    date: "Aujourd'hui",
    category: 'STAFFING',
    iconName: 'ChefHat',
    color: 'orange',
    price: '250€',
    description: 'Événement corporate 200 personnes. Open bar cocktails premium. Tenue noire exigée.',
    location: { lat: 48.8720, lng: 2.3350, address: 'Salon Haussmann' },
    venue: 'Hôtel Le Bristol',
    venueId: 'v11',
    type: 'staff',
    urgent: true,
    distance: '0.3 km',
    matchScore: 97,
    attributes: { role: ['bartender'], serviceType: 'evening', establishmentType: ['hotel'], urgency: true }
  },
  // === PLANNED / SCHEDULED missions ===
  {
    id: 'm15',
    title: 'Serveur - 2 personne(s)',
    expert: 'En attente',
    status: 'SEARCHING',
    date: '2026-03-12 11:00',
    category: 'STAFFING',
    iconName: 'ChefHat',
    color: 'orange',
    price: '240€ est.',
    description: 'Extra planifié : 2 serveurs pour 4h — mercredi 12 mars à 11:00',
    location: { lat: 48.8610, lng: 2.3420, address: 'Salle Restaurant' },
    venue: 'Le Comptoir du Panthéon',
    venueId: 'v9',
    type: 'staff',
    urgent: false,
    scheduled: true,
    scheduledDate: '2026-03-12T11:00:00',
    distance: '1.1 km',
    matchScore: 88,
    attributes: { role: ['waiter'], serviceType: 'lunch', urgency: false },
    candidates: [
      {
        id: 'cand-1',
        name: 'Thomas R.',
        specialty: 'Serveur expérimenté',
        rating: 4.8,
        avatar: 'https://i.pravatar.cc/150?u=thomas',
        completedMissions: 35,
        appliedAt: '2026-03-09T10:30:00',
        status: 'PENDING' as const,
        message: 'Disponible et motivé, 5 ans d\'expérience en restauration étoilée.',
      },
      {
        id: 'cand-2',
        name: 'Camille L.',
        specialty: 'Serveuse / Cheffe de rang',
        rating: 4.6,
        avatar: 'https://i.pravatar.cc/150?u=camille',
        completedMissions: 22,
        appliedAt: '2026-03-09T14:15:00',
        status: 'PENDING' as const,
      },
    ],
  },
  {
    id: 'm16',
    title: 'Technicien Froid - Intervention',
    expert: 'En attente',
    status: 'SEARCHING',
    date: '2026-03-14 09:00',
    category: 'MAINTENANCE',
    iconName: 'Wrench',
    color: 'blue',
    price: '20€',
    description: 'Tech planifié : Technicien Froid — Entretien préventif chambre froide — vendredi 14 mars à 09:00',
    location: { lat: 48.8570, lng: 2.3510, address: 'Cuisine Sous-sol' },
    venue: 'Brasserie du Marais',
    venueId: 'v3',
    type: 'cold',
    urgent: false,
    scheduled: true,
    scheduledDate: '2026-03-14T09:00:00',
    distance: '1.2 km',
    matchScore: 93,
    attributes: { interventionType: ['maintenance'], equipment: ['cold_room'], urgency: false }
  },
  // ── Mission planifiée multi-candidats : 2 barmen nécessaires, 5 postulent ──
  {
    id: 'm24',
    title: 'Barman - 2 personne(s)',
    expert: 'En attente',
    status: 'SEARCHING' as const,
    date: '2025-03-15 19:00',
    category: 'STAFFING' as const,
    iconName: 'ChefHat' as const,
    color: 'orange',
    price: '320€ est.',
    description: 'Soirée cocktails — besoin de 2 barmen expérimentés pour service du soir, 6h (19h-01h).',
    location: { lat: 48.8534, lng: 2.3488, address: 'Bar Rooftop' },
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'staff' as const,
    urgent: false,
    scheduled: true,
    scheduledDate: '2025-03-15T19:00:00',
    requiredWorkers: 2,
    distance: '0.5 km',
    matchScore: 95,
    attributes: { role: ['bartender'], serviceType: 'evening', urgency: false },
    candidates: [
      {
        id: 'cand-b1',
        name: 'Julien D.',
        specialty: 'Barman cocktails & mixologie',
        rating: 4.9,
        avatar: 'https://i.pravatar.cc/150?u=julien',
        completedMissions: 72,
        appliedAt: '2025-03-09T09:15:00',
        status: 'PENDING' as const,
        message: 'Mixologue certifié, 8 ans d\'expérience en rooftop bars et hôtels 5 étoiles.',
      },
      {
        id: 'cand-b2',
        name: 'Amélie V.',
        specialty: 'Barmaid / Cheffe de bar',
        rating: 4.7,
        avatar: 'https://i.pravatar.cc/150?u=amelie',
        completedMissions: 45,
        appliedAt: '2025-03-09T11:30:00',
        status: 'PENDING' as const,
        message: 'Spécialisée cocktails signature et gestion de bar à fort volume.',
      },
      {
        id: 'cand-b3',
        name: 'Maxime R.',
        specialty: 'Barman polyvalent',
        rating: 4.5,
        avatar: 'https://i.pravatar.cc/150?u=maxime',
        completedMissions: 28,
        appliedAt: '2025-03-09T14:00:00',
        status: 'PENDING' as const,
      },
      {
        id: 'cand-b4',
        name: 'Léa K.',
        specialty: 'Barmaid événementiel',
        rating: 4.8,
        avatar: 'https://i.pravatar.cc/150?u=leak',
        completedMissions: 56,
        appliedAt: '2025-03-09T16:45:00',
        status: 'PENDING' as const,
        message: 'Habituée des événements privés et soirées à thème. Très à l\'aise en rooftop.',
      },
      {
        id: 'cand-b5',
        name: 'Romain P.',
        specialty: 'Barman speed / service rapide',
        rating: 4.3,
        avatar: 'https://i.pravatar.cc/150?u=romain',
        completedMissions: 15,
        appliedAt: '2025-03-10T08:20:00',
        status: 'PENDING' as const,
      },
    ],
  },
  // ── Missions archivées (terminées mois/années antérieurs) ──
  {
    id: 'm17',
    title: 'Réparation Machine à Glaçons',
    expert: 'Paul Froid',
    status: 'COMPLETED' as const,
    date: '2025-01-18',
    category: 'MAINTENANCE' as const,
    iconName: 'Wrench' as const,
    color: 'blue',
    price: '220€',
    location: { lat: 48.8566, lng: 2.3522, address: 'Bar Principal' },
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'cold' as const,
    provider: { id: 'p10', name: 'Paul Froid', rating: 4.8, completedMissions: 156, bio: 'Spécialiste froid commercial.', phone: '+33 6 11 22 33 44' },
    invoice: { id: 'inv-m17', missionId: 'm17', number: 'INV-2025-012', date: '2025-01-18', dueDate: '2025-02-18', status: 'PAID' as const, items: [{ description: 'Réparation compresseur', quantity: 1, unitPrice: 180 }, { description: 'Pièce détachée', quantity: 1, unitPrice: 40 }], totalAmount: 220, taxAmount: 44 },
  },
  {
    id: 'm18',
    title: 'Extra Barman Soirée Privée',
    expert: 'Théo M.',
    status: 'COMPLETED' as const,
    date: '2025-01-25',
    category: 'STAFFING' as const,
    iconName: 'ChefHat' as const,
    color: 'orange',
    price: '150€',
    location: { lat: 48.8566, lng: 2.3522, address: 'Salle VIP' },
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'staff' as const,
    provider: { id: 'p11', name: 'Théo M.', rating: 4.9, completedMissions: 67, bio: 'Barman cocktails.', phone: '+33 6 55 66 77 88' },
    invoice: { id: 'inv-m18', missionId: 'm18', number: 'INV-2025-018', date: '2025-01-25', dueDate: '2025-02-25', status: 'PAID' as const, items: [{ description: 'Extra barman 6h', quantity: 1, unitPrice: 150 }], totalAmount: 150, taxAmount: 30 },
    dpaeStatus: 'VALIDATED' as const,
  },
  {
    id: 'm19',
    title: 'Dépannage Lave-Vaisselle',
    expert: 'Marc Volt',
    status: 'COMPLETED' as const,
    date: '2024-11-05',
    category: 'MAINTENANCE' as const,
    iconName: 'Wrench' as const,
    color: 'blue',
    price: '310€',
    location: { lat: 48.8566, lng: 2.3522, address: 'Plonge' },
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'plumbing' as const,
    provider: { id: 'p3', name: 'Marc Volt', rating: 4.9, completedMissions: 230, bio: 'Électricien qualifié.', phone: '+33 6 98 76 54 32' },
    invoice: { id: 'inv-m19', missionId: 'm19', number: 'INV-2024-089', date: '2024-11-05', dueDate: '2024-12-05', status: 'PAID' as const, items: [{ description: 'Diagnostic + réparation pompe', quantity: 1, unitPrice: 250 }, { description: 'Joint + raccord', quantity: 1, unitPrice: 60 }], totalAmount: 310, taxAmount: 62 },
  },
  {
    id: 'm20',
    title: 'Extra Serveur Réveillon',
    expert: 'Sophie L.',
    status: 'COMPLETED' as const,
    date: '2024-12-31',
    category: 'STAFFING' as const,
    iconName: 'ChefHat' as const,
    color: 'orange',
    price: '280€',
    location: { lat: 48.8566, lng: 2.3522, address: 'Salle Principale' },
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'staff' as const,
    provider: { id: 'p12', name: 'Sophie L.', rating: 5.0, completedMissions: 89, bio: 'Serveuse expérimentée.', phone: '+33 6 44 55 66 77' },
    invoice: { id: 'inv-m20', missionId: 'm20', number: 'INV-2024-102', date: '2024-12-31', dueDate: '2025-01-31', status: 'PAID' as const, items: [{ description: 'Extra serveur 10h soirée réveillon', quantity: 1, unitPrice: 280 }], totalAmount: 280, taxAmount: 56 },
    dpaeStatus: 'VALIDATED' as const,
  },
  {
    id: 'm21',
    title: 'Maintenance Hotte Aspirante',
    expert: 'ClimExpress',
    status: 'COMPLETED' as const,
    date: '2024-09-12',
    category: 'MAINTENANCE' as const,
    iconName: 'Wrench' as const,
    color: 'blue',
    price: '175€',
    location: { lat: 48.8566, lng: 2.3522, address: 'Cuisine' },
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'hot' as const,
    provider: { id: 'p1', name: 'ClimExpress', rating: 4.8, completedMissions: 312, bio: 'Climatisation et ventilation.', phone: '+33 6 12 34 56 78' },
    invoice: { id: 'inv-m21', missionId: 'm21', number: 'INV-2024-071', date: '2024-09-12', dueDate: '2024-10-12', status: 'PAID' as const, items: [{ description: 'Nettoyage + remplacement filtres hotte', quantity: 1, unitPrice: 175 }], totalAmount: 175, taxAmount: 35 },
  },
  {
    id: 'm22',
    title: 'Extra Plongeur Week-end',
    expert: 'Karim B.',
    status: 'COMPLETED' as const,
    date: '2025-02-08',
    category: 'STAFFING' as const,
    iconName: 'ChefHat' as const,
    color: 'orange',
    price: '95€',
    location: { lat: 48.8566, lng: 2.3522, address: 'Plonge' },
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'staff' as const,
    provider: { id: 'p13', name: 'Karim B.', rating: 4.6, completedMissions: 34, bio: 'Plongeur rapide et efficace.', phone: '+33 6 77 88 99 00' },
    invoice: { id: 'inv-m22', missionId: 'm22', number: 'INV-2025-031', date: '2025-02-08', dueDate: '2025-03-08', status: 'PAID' as const, items: [{ description: 'Extra plongeur 5h', quantity: 1, unitPrice: 95 }], totalAmount: 95, taxAmount: 19 },
    dpaeStatus: 'VALIDATED' as const,
  },
  {
    id: 'm23',
    title: 'Intervention Fuite Robinet',
    expert: 'Plombier24',
    status: 'CANCELLED' as const,
    date: '2024-10-20',
    category: 'MAINTENANCE' as const,
    iconName: 'Wrench' as const,
    color: 'blue',
    price: '0€',
    location: { lat: 48.8566, lng: 2.3522, address: 'Toilettes' },
    venue: 'Le Bistrot Parisien',
    venueId: 'v1',
    type: 'plumbing' as const,
    provider: { id: 'p14', name: 'Plombier24', rating: 4.5, completedMissions: 120, bio: 'Plomberie urgente.', phone: '+33 6 33 44 55 66' },
  },
];

export const useMissionsStore = create<MissionsState>()(
  persist(
    (set, get) => ({
      missions: INITIAL_MISSIONS,
      team: INITIAL_TEAM,
      teamSchedule: {},
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

        const now = new Date();
        const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        let priceNum = 0;
        let invoiceItems: InvoiceItem[] = [];

        // Build invoice from accepted quote if available (TECH flow)
        if (mission.quote) {
          priceNum = mission.quote.totalTTC;
          invoiceItems = mission.quote.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPriceHT
          }));
        } else {
          // Fallback: parse price from mission (STAFF flow or legacy)
          if (typeof mission.price === 'string') {
            priceNum = parseInt(mission.price.replace(/[^0-9]/g, '')) || 100;
          } else {
            priceNum = mission.price || 100;
          }
          invoiceItems = [{ description: mission.title, quantity: 1, unitPrice: priceNum }];
        }

        const tax = mission.quote ? mission.quote.totalTVA : priceNum * 0.20;

        const newInvoice: Invoice = {
          id: `inv-${Date.now()}`,
          missionId: mission.id,
          number: `INV-${now.getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          date: now.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          status: 'PENDING',
          items: invoiceItems,
          totalAmount: priceNum,
          taxAmount: tax,
          fileUrl: '#',
          issuerDetails: {
            name: mission.quote?.provider?.name || mission.provider?.name || 'Prestataire',
            address: mission.quote?.provider?.address || '123 Avenue des Champs-Élysées, 75008 Paris',
            siret: mission.quote?.provider?.siret || '123 456 789 00012',
            email: mission.quote?.provider?.email || 'contact@prestataire.com',
            logo: mission.provider?.avatar
          },
          clientDetails: {
            name: mission.quote?.client?.establishmentName || mission.venue || 'Le Bistrot Parisien',
            address: mission.quote?.client?.establishmentAddress || '10 Rue de la Paix, 75002 Paris',
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
      rejectQuote: (missionId, rejection) => set((state) => ({
        missions: state.missions.map(m => m.id === missionId ? {
          ...m,
          status: 'CANCELLED' as const,
          quoteRejection: rejection
        } : m)
      })),
      setPartsStatus: (missionId, partsStatus) => set((state) => ({
        missions: state.missions.map(m => m.id === missionId ? { ...m, partsStatus } : m)
      })),
      validateStaffMission: (missionId, hoursWorked) => set((state) => ({
        missions: state.missions.map(m => m.id === missionId ? {
          ...m,
          staffValidation: {
            validated: true,
            validatedAt: new Date().toISOString(),
            hoursWorked
          }
        } : m)
      })),
      resumeStandbyMission: (missionId) => set((state) => ({
        missions: state.missions.map(m => m.id === missionId ? {
          ...m,
          status: 'ON_WAY' as const,
          partsStatus: 'PART_RECEIVED' as const
        } : m)
      })),
      addTeamMember: (member) => set((state) => ({ team: [...state.team, member] })),
      updateTeamMember: (id, updates) => set((state) => ({
        team: state.team.map((t) => t.id === id ? { ...t, ...updates } : t)
      })),
      removeTeamMember: (id) => set((state) => ({
        team: state.team.filter((t) => t.id !== id)
      })),
      setScheduleStatus: (date, memberId, status) => set((state) => {
        const dayData = { ...(state.teamSchedule[date] || {}) };
        if (status === null) {
          delete dayData[memberId];
        } else {
          dayData[memberId] = status;
        }
        return {
          teamSchedule: {
            ...state.teamSchedule,
            [date]: dayData
          }
        };
      }),
      addCandidate: (missionId, candidate) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.id !== missionId) return m;
          const existing = m.candidates || [];
          if (existing.some(c => c.id === candidate.id)) return m;
          return { ...m, candidates: [...existing, candidate] };
        })
      })),
      removeCandidate: (missionId, candidateId) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.id !== missionId) return m;
          return { ...m, candidates: (m.candidates || []).filter(c => c.id !== candidateId) };
        })
      })),
      selectCandidate: (missionId, candidateId) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.id !== missionId) return m;
          const required = m.requiredWorkers || 1;
          // Marquer ce candidat comme ACCEPTED
          const updatedCandidates = (m.candidates || []).map(c =>
            c.id === candidateId ? { ...c, status: 'ACCEPTED' as const } : c
          );
          const acceptedCount = updatedCandidates.filter(c => c.status === 'ACCEPTED').length;
          const allFilled = acceptedCount >= required;
          // Si tous les postes sont pourvus, rejeter les PENDING restants et passer en SCHEDULED
          const finalCandidates = allFilled
            ? updatedCandidates.map(c => c.status === 'PENDING' ? { ...c, status: 'REJECTED' as const } : c)
            : updatedCandidates;
          const lastSelected = finalCandidates.find(c => c.id === candidateId);
          return {
            ...m,
            candidates: finalCandidates,
            status: allFilled ? 'SCHEDULED' as const : m.status,
            provider: allFilled && lastSelected ? {
              id: lastSelected.id,
              name: acceptedCount > 1
                ? `${finalCandidates.filter(c => c.status === 'ACCEPTED').map(c => c.name).join(', ')}`
                : lastSelected.name,
              rating: lastSelected.rating,
              completedMissions: lastSelected.completedMissions,
              bio: lastSelected.specialty,
              phone: '+33 6 00 00 00 00',
              avatar: lastSelected.avatar,
            } : m.provider,
          };
        })
      })),
      rejectCandidate: (missionId, candidateId) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.id !== missionId) return m;
          return {
            ...m,
            candidates: (m.candidates || []).map(c =>
              c.id === candidateId ? { ...c, status: 'REJECTED' as const } : c
            )
          };
        })
      })),
      updateDpaeStatus: (missionId, dpaeStatus, dpaeReceiptId) => set((state) => ({
        missions: state.missions.map(m =>
          m.id === missionId
            ? { ...m, dpaeStatus, ...(dpaeReceiptId ? { dpaeReceiptId } : {}) }
            : m
        )
      }))
    }),
    {
      name: 'missions-storage-v11', // v11: reset after barman multi-select test
    }
  )
);
