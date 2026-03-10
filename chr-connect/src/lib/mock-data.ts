import { Mission, MissionType } from '@/types/missions';
import type { Quote, QuoteItem, MissionWithFinancials } from '@/types/unified';
import { APP_CONFIG } from '@/config/appConfig';

// Paris center
const CENTER_LAT = 48.8566;
const CENTER_LNG = 2.3522;

function generateRandomPosition(centerLat: number, centerLng: number, radiusKm: number) {
  const radiusInDegrees = radiusKm / 111;
  const angle = Math.random() * 2 * Math.PI;
  const newLat = centerLat + radiusInDegrees * Math.cos(angle);
  const newLng = centerLng + radiusInDegrees * Math.sin(angle);
  return { lat: newLat, lng: newLng };
}

function generateRandomDistance() {
  return (Math.random() * 5 + 0.5).toFixed(1);
}

const missionTypes: MissionType[] = [
  'cold', 'hot', 'staff', 'light', 'video', 'sound', 'pos', 'network',
  'plumbing', 'electricity', 'coffee', 'beer',
  'security', 'cleaning',
  'architecture', 'decoration', 'painting', 'carpentry'
];

const missionTitles: Record<string, string[]> = {
  cold: [
    'Panne chambre froide', 'Installation climatisation', 'Réparation groupe froid', 'Maintenance système de réfrigération'
  ],
  hot: [
    'Remplacement Chef de Cuisine', 'Besoin Sous-Chef Urgent', 'Chef de Partie Confirmé', 'Extra Commis Cuisine'
  ],
  staff: [
    'Extra service salle', 'Besoin Chef de Rang', 'Barman Cocktail', 'Sommelier Soirée Vin', 'Runner', 'Hôtesse d\'accueil'
  ],
  light: ['Réglage DMX', 'Installation projecteurs', 'Maintenance éclairage'],
  video: ['Panne vidéoprojecteur', 'Câblage écran LED', 'Configuration matrice'],
  sound: ['Larsen système son', 'Installation enceintes', 'Réglage limiteur'],
  pos: ['Installation Caisse Tiller', 'Panne TPE', 'Configuration Réseau Unifi'],
  network: ['Câblage RJ45', 'Installation Baie de Brassage', 'Configuration WiFi Guest', 'Dépannage Fibre'],
  
  // New Maintenance
  plumbing: ['Fuite évier cuisine', 'Débouchage WC clients', 'Installation machine à laver', 'Raccordement eau bar'],
  electricity: ['Coupure courant zone cuisine', 'Ajout prises office', 'Mise aux normes tableau', 'Remplacement luminaires'],
  coffee: ['Panne machine à café', 'Réglage moulin', 'Maintenance préventive'],
  beer: ['Problème pression bière', 'Fuite tireuse', 'Sanitation lignes'],
  
  // New Staff
  security: ['Agent de sécurité soirée', 'Videur boîte de nuit', 'Contrôle accès événement'],
  cleaning: ['Plongeur soir', 'Nettoyage fin de chantier', 'Entretien salle'],
  
  // Bâtiment
  architecture: ['Plan aménagement terrasse', 'Dossier accessibilité PMR', 'Relevé de cotes'],
  decoration: ['Conseil ambiance salle', 'Sourcing mobilier vintage', 'Décoration florale'],
  painting: ['Peinture salle principale', 'Rénovation plafond cuisine', 'Pose sol résine'],
  carpentry: ['Création bar sur mesure', 'Réparation parquet', 'Aménagement placards']
};

const missionSkills: Record<string, string[]> = {
  cold: ['Fluides frigorigènes', 'Électricité', 'Diagnostic'],
  hot: ['Cuisson', 'Organisation', 'Hygiène'],
  staff: ['Service', 'Rapidité', 'Polyvalence'],
  light: ['DMX', 'Électricité', 'Hauteur'],
  video: ['Résolution', 'Câblage', 'Réseau'],
  sound: ['Acoustique', 'Soudure', 'Dante'],
  pos: ['Réseau', 'TPE', 'Windows'],
  network: ['TCP/IP', 'Câblage', 'UniFi'],
  plumbing: ['Soudure', 'PVC', 'Recherche de fuite'],
  electricity: ['Habilitation', 'Câblage', 'Normes'],
  coffee: ['Barista', 'Mécanique', 'Détartrage'],
  beer: ['Tirage', 'CO2', 'Sanitation'],
  security: ['CQP', 'Self-defense', 'Diplomatie'],
  cleaning: ['Hygiène', 'Rapidité', 'Produits'],
  architecture: ['AutoCAD', 'Normes ERP', 'Design'],
  decoration: ['Goût', 'Couleurs', 'Mobilier'],
  painting: ['Enduit', 'Pinceau', 'Rouleau'],
  carpentry: ['Bois', 'Découpe', 'Montage']
};

const venues = [
  'Le Fouquet\'s', 'L\'Ami Jean', 'Le Grand Véfour', 'L\'Ambroisie',
  'Le Comptoir du Relais', 'Spring Roll', 'Les Papilles', 'Chez Janou',
  'Le Bistrot Paul Bert', 'Le Taillevent', 'Bar de la Marine', 'Hôtel Costes'
];

const missionPhotos: Record<string, (string | { url: string; caption?: string })[]> = {
  cold: [
    { url: 'https://images.unsplash.com/photo-1581092921461-eab32e97f633?q=80&w=2670&auto=format&fit=crop', caption: 'Vue d\'ensemble de la chambre froide principale' }
  ],
  hot: [
    { url: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2670&auto=format&fit=crop', caption: 'Cuisine en plein rush' }
  ],
  staff: [
    { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop', caption: 'Salle de réception' }
  ],
  light: [
    { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2670&auto=format&fit=crop', caption: 'Projecteurs de scène' }
  ],
  video: ['https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?q=80&w=2670&auto=format&fit=crop'],
  sound: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2670&auto=format&fit=crop'],
  pos: ['https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2670&auto=format&fit=crop'],
  network: ['https://images.unsplash.com/photo-1558494949-ef52095294f2?q=80&w=2574&auto=format&fit=crop'],
  plumbing: ['https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2670&auto=format&fit=crop'],
  electricity: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2669&auto=format&fit=crop'],
  coffee: ['https://images.unsplash.com/photo-1517080788952-99b55d68dc76?q=80&w=2671&auto=format&fit=crop'],
  beer: ['https://images.unsplash.com/photo-1575425186775-b8de9a427e67?q=80&w=2574&auto=format&fit=crop'],
  architecture: ['https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2671&auto=format&fit=crop'],
  decoration: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=2670&auto=format&fit=crop'],
  painting: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2670&auto=format&fit=crop'],
  carpentry: ['https://images.unsplash.com/photo-1601058268499-e52642d18d89?q=80&w=2535&auto=format&fit=crop']
};

const venueMap: Record<string, string> = {
  "Le Fouquet's": 'v1',
  "L'Ambroisie": 'v3',
  "Hôtel Costes": 'v4',
  "La Tour d'Argent": 'v2'
};

const getAttributesForType = (type: MissionType): Mission['attributes'] => {
  const randomFrom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  
  switch(type) {
    case 'cold':
      return {
        interventionType: [randomFrom(['breakdown', 'maintenance', 'installation'])],
        equipment: [randomFrom(['cold_room', 'fridge', 'icemaker'])],
        urgency: Math.random() > 0.5
      };
    case 'hot':
      return {
        role: [randomFrom(['chef', 'sous_chef', 'cdp', 'commis'])],
        serviceType: randomFrom(['lunch', 'dinner', 'continuous']),
        specialty: [randomFrom(['french', 'italian', 'asian', 'bistronomy'])]
      };
    case 'staff':
      return {
        role: [randomFrom(['waiter', 'head_waiter', 'barman', 'sommelier', 'runner', 'host'])],
        establishmentType: [randomFrom(['gastro', 'brasserie', 'nightclub', 'hotel'])]
      };
    case 'light':
      return { expertise: [randomFrom(['dmx', 'moving', 'install'])] };
    case 'sound':
      return { expertise: [randomFrom(['live', 'system', 'dj'])] };
    case 'video':
      return { expertise: [randomFrom(['led', 'projection', 'content'])] };
    case 'pos':
      return { 
        system: [randomFrom(['tiller', 'micros', 'laddition', 'unifi'])],
        expertise: [randomFrom(['pos', 'network'])]
      };
    case 'network':
      return {
        expertise: [randomFrom(['wifi', 'cabling'])]
      };
      
    // New Maintenance
    case 'plumbing':
      return {
        interventionType: [randomFrom(['leak', 'clog', 'install'])],
        equipment: [randomFrom(['sink', 'toilet', 'dishwasher', 'grease_trap'])]
      };
    case 'electricity':
      return {
        interventionType: [randomFrom(['outage', 'compliance', 'install'])],
        equipment: [randomFrom(['panel', 'lighting', 'outlet'])]
      };
    case 'coffee':
      return {
        interventionType: [randomFrom(['repair', 'maintenance', 'adjust'])],
        machineType: randomFrom(['traditional', 'automatic', 'grinder'])
      };
    case 'beer':
      return {
        interventionType: [randomFrom(['sanitation', 'gas', 'cooling', 'leak'])]
      };
      
    // New Staff
    case 'security':
      return {
        role: [randomFrom(['bouncer', 'ssiap'])],
        establishmentType: [randomFrom(['nightclub', 'event'])]
      };
    case 'cleaning':
      return {
        role: [randomFrom(['dishwasher', 'cleaner'])]
      };
      
    // Bâtiment
    case 'architecture':
      return { interventionType: [randomFrom(['layout', '3d', 'permit'])] };
    case 'decoration':
      return {
        style: [randomFrom(['modern', 'vintage', 'cozy'])],
        expertise: [randomFrom(['sourcing', 'staging'])]
      };
    case 'painting':
      return {
        surface: [randomFrom(['walls', 'ceiling', 'floor'])],
        finish: randomFrom(['matte', 'satin', 'decorative'])
      };
    case 'carpentry':
      return { interventionType: [randomFrom(['furniture', 'bar', 'terrace'])] };
      
    default:
      return {};
  }
};

export const mockMissions: Mission[] = Array.from({ length: 100 }, (_, i) => {
  const type = missionTypes[Math.floor(Math.random() * missionTypes.length)];
  const titles = missionTitles[type as keyof typeof missionTitles] || missionTitles.staff;
  const title = titles[Math.floor(Math.random() * titles.length)];
  const venue = venues[Math.floor(Math.random() * venues.length)];
  const venueId = venueMap[venue];
  const location = generateRandomPosition(CENTER_LAT, CENTER_LNG, 4);
  const distance = generateRandomDistance();
  const urgent = Math.random() > 0.7;
  const skills = missionSkills[type as keyof typeof missionSkills] || [];
  const photos = missionPhotos[type as keyof typeof missionPhotos] || [];

  return {
    id: `mission-${i}`,
    title,
    venue,
    venueId,
    type,
    price: Math.floor(Math.random() * 300) + 50,
    distance,
    urgent,
    description: `Intervention requise pour ${title.toLowerCase()} au sein de l'établissement ${venue}. Accès parking assuré.`,
    skills,
    location,
    matchScore: Math.floor(Math.random() * 30) + 70, // 70-100% match
    expiresAt: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000),
    photos,
    attributes: getAttributesForType(type),
    status: 'SEARCHING' as const
  };
});

// ============================================================================
// MISSIONS WITH FINANCIAL DATA
// ============================================================================
// Missions enrichies avec données financières complètes pour démo
// ============================================================================

/**
 * Example quote items for a cold room repair
 */
const EXAMPLE_QUOTE_ITEMS: QuoteItem[] = [
  {
    id: 'qi_travel_001',
    type: 'TRAVEL',
    description: 'Déplacement Zone Proche (8km)',
    quantity: 1,
    unit: 'forfait',
    unitPriceHT: 45,
    tvaRate: 'STANDARD',
    totalHT: 45,
    totalTTC: 54,
  },
  {
    id: 'qi_diag_001',
    type: 'DIAGNOSTIC',
    description: 'Diagnostic complet chambre froide',
    quantity: 1,
    unit: 'forfait',
    unitPriceHT: 85,
    tvaRate: 'REDUCED',
    totalHT: 85,
    totalTTC: 93.5,
  },
  {
    id: 'qi_labor_001',
    type: 'LABOR',
    description: 'Main d\'œuvre réparation compresseur',
    quantity: 2.5,
    unit: 'h',
    unitPriceHT: 65,
    tvaRate: 'REDUCED',
    totalHT: 162.5,
    totalTTC: 178.75,
  },
  {
    id: 'qi_part_001',
    type: 'PART',
    reference: 'COMP-R404A-2HP',
    description: 'Compresseur hermétique 2HP compatible R404A',
    quantity: 1,
    unit: 'unité',
    unitPriceHT: 420,
    tvaRate: 'STANDARD',
    totalHT: 420,
    totalTTC: 504,
  },
  {
    id: 'qi_part_002',
    type: 'PART',
    reference: 'GAZ-R404A-5KG',
    description: 'Recharge gaz R404A (5kg)',
    quantity: 1,
    unit: 'unité',
    unitPriceHT: 180,
    tvaRate: 'STANDARD',
    totalHT: 180,
    totalTTC: 216,
  },
];

/**
 * Example accepted quote
 */
export const EXAMPLE_QUOTE: Quote = {
  id: 'quote_ambroisie_001',
  missionId: 'mission_ambroisie_cf_001',
  providerId: 'provider_froid_001',
  providerName: 'FroidExpress Paris',

  clientId: APP_CONFIG.DEFAULT_OWNER_ID,
  clientName: 'Chef Bernard Pacaud',
  establishmentId: 'v3',
  establishmentName: "L'Ambroisie",
  establishmentAddress: '9 Place des Vosges, 75004 Paris',

  reference: 'DEV-2024-00142',
  status: 'ACCEPTED',
  validityDays: 30,
  validUntil: '2025-01-15T00:00:00.000Z',

  items: EXAMPLE_QUOTE_ITEMS,

  subtotalHT: 892.5,
  totalTVA: 153.75,
  totalTTC: 1046.25,

  platformFeeRate: APP_CONFIG.PLATFORM_FEE_RATE,
  platformFeeAmount: 133.88,
  providerNetAmount: 758.62,

  distanceKm: 8,
  travelZone: 'ZONE_1',

  notes: 'Intervention prévue le 16/12/2024 entre 8h et 10h. Accès par la cour intérieure. Certificat CERFA fluide frigorigène fourni après intervention.',

  createdAt: '2024-12-10T14:30:00.000Z',
  sentAt: '2024-12-10T14:35:00.000Z',
  viewedAt: '2024-12-10T15:12:00.000Z',
  acceptedAt: '2024-12-10T16:45:00.000Z',
};

/**
 * Missions with full financial data for L'Ambroisie
 */
export const MISSIONS_WITH_FINANCIALS: MissionWithFinancials[] = [
  {
    id: 'mission_ambroisie_cf_001',
    establishmentId: 'v3',
    establishmentName: "L'Ambroisie",
    equipmentId: 'eq_ambroisie_001',
    equipmentName: 'Dagard Positive Walk-In 12m³',
    equipmentCategory: 'COLD_ROOM',
    problemId: 'coldroom-compressor',
    problemLabel: 'Problème compresseur',
    problemDescription: 'Compresseur fait un bruit anormal et la température monte lentement. Fluide R404A.',
    type: 'EQUIPMENT_REPAIR',
    status: 'SCHEDULED',
    priority: 'HIGH',
    createdAt: '2024-12-10T08:30:00.000Z',
    scheduledAt: '2024-12-16T08:00:00.000Z',
    providerId: 'provider_froid_001',
    providerName: 'FroidExpress Paris',
    providerRating: 4.8,
    estimatedPrice: { min: 800, max: 1200 },
    photos: ['https://images.unsplash.com/photo-1581092921461-eab32e97f633?w=800'],
    requiredSkills: ['froid-commercial', 'chambre-froide', 'R404A'],
    estimatedDuration: 180,

    // Financial data
    distanceKm: 8,
    travelZone: {
      id: 'ZONE_1',
      name: 'Zone Proche',
      maxDistanceKm: 10,
      baseFee: 45,
      perKmSurcharge: 0,
    },
    travelCost: 45,
    quotes: [EXAMPLE_QUOTE],
    activeQuoteId: 'quote_ambroisie_001',
    acceptedQuoteId: 'quote_ambroisie_001',
    paymentStatus: 'PENDING',
    dpaeStatus: 'NOT_REQUIRED',
  },
  {
    id: 'mission_ambroisie_four_001',
    establishmentId: 'v3',
    establishmentName: "L'Ambroisie",
    equipmentId: 'eq_ambroisie_003',
    equipmentName: 'Bonnet Thirode Maestro 20 GN 2/1 GAZ',
    equipmentCategory: 'OVEN',
    problemId: 'oven-steam',
    problemLabel: 'Système vapeur HS',
    problemDescription: 'Four mixte ne produit plus de vapeur. Électrovanne à vérifier. Équipement GAZ - Qualigaz requis.',
    type: 'EQUIPMENT_REPAIR',
    status: 'SEARCHING',
    priority: 'HIGH',
    createdAt: '2024-12-11T09:15:00.000Z',
    estimatedPrice: { min: 350, max: 600 },
    photos: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'],
    requiredSkills: ['four-professionnel', 'gaz', 'Qualigaz'],
    estimatedDuration: 120,

    distanceKm: 8,
    travelZone: {
      id: 'ZONE_1',
      name: 'Zone Proche',
      maxDistanceKm: 10,
      baseFee: 45,
      perKmSurcharge: 0,
    },
    travelCost: 45,
    quotes: [],
    paymentStatus: undefined,
    dpaeStatus: 'NOT_REQUIRED',
  },
  {
    id: 'mission_ambroisie_staff_001',
    establishmentId: 'v3',
    establishmentName: "L'Ambroisie",
    equipmentId: null,
    problemId: 'staffing-chef-partie',
    problemLabel: 'Chef de Partie - Remplacement',
    problemDescription: 'Besoin d\'un Chef de Partie poste chaud pour remplacement congés.',
    type: 'STAFFING',
    status: 'MATCHED',
    priority: 'NORMAL',
    createdAt: '2024-12-09T11:00:00.000Z',
    scheduledAt: '2024-12-20T10:00:00.000Z',
    providerId: 'provider_staff_001',
    providerName: 'Marie D.',
    providerRating: 4.9,
    estimatedPrice: { min: 200, max: 280 },
    requiredSkills: ['cuisine-gastronomique', 'poste-chaud', 'sous-vide'],
    estimatedDuration: 600, // 10h

    quotes: [],
    paymentStatus: undefined,

    staffingDetails: {
      role: 'chef_partie',
      date: '2024-12-20',
      startTime: '10:00',
      endTime: '23:00',
      numberOfPeople: 1,
      hourlyRate: 22,
    },
    staffingFinancials: {
      hourlyRate: 22,
      estimatedHours: 10,
      totalEstimatedHT: 220,
      totalEstimatedTTC: 264,
      marketAnalysis: {
        role: 'chef_partie',
        proposedRate: 22,
        marketRateMin: 18,
        marketRateMax: 28,
        marketRateAvg: 22,
        score: 'COMPETITIVE',
        percentile: 50,
        recommendation: 'Excellent ! Votre taux est compétitif et dans la moyenne du marché.',
        attractivenessForProviders: 'MEDIUM',
      },
    },
    dpaeStatus: 'PENDING',
  },
];

/**
 * Get missions with financials for a specific venue
 */
export function getMissionsWithFinancialsForVenue(venueId: string): MissionWithFinancials[] {
  return MISSIONS_WITH_FINANCIALS.filter(m => m.establishmentId === venueId);
}

/**
 * Get all quotes for a venue
 */
export function getQuotesForVenue(venueId: string): Quote[] {
  const venueMissions = getMissionsWithFinancialsForVenue(venueId);
  return venueMissions.flatMap(m => m.quotes);
}

// ============================================================================
// STAFFING MISSIONS WITH MARKET ANALYSIS
// ============================================================================

export interface StaffingMissionExample {
  role: string;
  roleId: string;
  hourlyRate: number;
  hours: number;
  numberOfPeople: number;
  totalHT: number;
  totalTTC: number;
  marketPosition: 'LOW' | 'BELOW_MARKET' | 'COMPETITIVE' | 'ABOVE_MARKET' | 'PREMIUM';
  recommendation: string;
}

export const STAFFING_EXAMPLES: StaffingMissionExample[] = [
  {
    role: 'Serveur',
    roleId: 'serveur',
    hourlyRate: 14,
    hours: 6,
    numberOfPeople: 2,
    totalHT: 168,
    totalTTC: 201.6,
    marketPosition: 'COMPETITIVE',
    recommendation: 'Taux dans la moyenne du marché. Bonnes candidatures attendues.',
  },
  {
    role: 'Barman Cocktails',
    roleId: 'mixologue',
    hourlyRate: 25,
    hours: 8,
    numberOfPeople: 1,
    totalHT: 200,
    totalTTC: 240,
    marketPosition: 'ABOVE_MARKET',
    recommendation: 'Très attractif ! Vous attirerez les meilleurs profils.',
  },
  {
    role: 'Plongeur',
    roleId: 'plongeur',
    hourlyRate: 11,
    hours: 5,
    numberOfPeople: 1,
    totalHT: 55,
    totalTTC: 66,
    marketPosition: 'LOW',
    recommendation: 'Taux au minimum légal. Risque de peu de candidatures.',
  },
  {
    role: 'Chef de Cuisine',
    roleId: 'chef_cuisine',
    hourlyRate: 45,
    hours: 10,
    numberOfPeople: 1,
    totalHT: 450,
    totalTTC: 540,
    marketPosition: 'ABOVE_MARKET',
    recommendation: 'Excellent taux pour un chef. Profils confirmés attendus.',
  },
];
