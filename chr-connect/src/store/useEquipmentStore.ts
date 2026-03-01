import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  MaintenanceRecord,
  EquipmentFilters
} from '@/types/equipment';
import { generateQRCodeUrl } from '@/lib/ai-service.mock';
import { APP_CONFIG } from '@/config/appConfig';

// ============================================================================
// EQUIPMENT STORE - Zustand Store for Equipment Management
// ============================================================================

interface EquipmentState {
  // Data
  equipment: Equipment[];
  maintenanceHistory: MaintenanceRecord[];

  // UI State
  filters: EquipmentFilters;
  selectedEquipmentId: string | null;

  // Actions - CRUD
  addEquipment: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'qrCodeId' | 'qrCodeUrl'>) => Equipment;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  restoreEquipment: (id: string) => void;

  // Actions - Status
  setEquipmentStatus: (id: string, status: EquipmentStatus) => void;
  reportFault: (id: string, faultType: string, description?: string) => void;

  // Actions - Maintenance
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;

  // Actions - UI
  setFilters: (filters: Partial<EquipmentFilters>) => void;
  clearFilters: () => void;
  selectEquipment: (id: string | null) => void;

  // Getters
  getEquipmentById: (id: string) => Equipment | undefined;
  getEquipmentByVenue: (venueId: string) => Equipment[];
  getEquipmentByCategory: (category: EquipmentCategory) => Equipment[];
  getEquipmentHistory: (equipmentId: string) => MaintenanceRecord[];
  getFilteredEquipment: () => Equipment[];
}

// ============================================================================
// INITIAL MOCK DATA - Realistic equipment for demo
// ============================================================================

const INITIAL_EQUIPMENT: Equipment[] = [
  // ============================================================================
  // ÉQUIPEMENTS LE FOUQUET'S (v1)
  // ============================================================================
  {
    id: 'eq_001',
    venueId: 'v1',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'COFFEE_MACHINE',
    brand: 'La Marzocco',
    model: 'Linea PB',
    serialNumber: 'LM2023-45892',
    nickname: 'Machine Café Bar',
    location: 'Bar Principal',
    specifications: {
      voltage: '230V',
      power: '5.5kW',
      capacity: '4 groupes',
    },
    installationDate: '2022-03-15',
    purchaseDate: '2022-02-01',
    warrantyExpiry: '2025-02-01',
    lastServiceDate: '2024-09-15',
    nextServiceDue: '2025-03-15',
    status: 'OPERATIONAL',
    healthScore: 95,
    photos: [
      {
        id: 'ph_001',
        url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        type: 'OVERVIEW',
        caption: 'Vue d\'ensemble',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_001',
    qrCodeUrl: generateQRCodeUrl('eq_001'),
    createdAt: '2022-03-15T10:00:00Z',
    updatedAt: '2024-09-15T14:30:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
  },
  {
    id: 'eq_002',
    venueId: 'v1',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'FRIDGE',
    brand: 'Hoshizaki',
    model: 'HR-78MA',
    serialNumber: 'HSZ-L098765',
    nickname: 'Frigo Cuisine 1',
    location: 'Cuisine Principale',
    specifications: {
      voltage: '220V',
      power: '0.35kW',
      capacity: '625L',
      gasType: 'R290',
    },
    installationDate: '2021-06-20',
    purchaseDate: '2021-06-01',
    warrantyExpiry: '2024-06-01',
    lastServiceDate: '2024-08-10',
    nextServiceDue: '2025-02-10',
    status: 'OPERATIONAL',
    healthScore: 88,
    photos: [
      {
        id: 'ph_002',
        url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800',
        type: 'OVERVIEW',
        caption: 'Armoire réfrigérée',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_002',
    qrCodeUrl: generateQRCodeUrl('eq_002'),
    createdAt: '2021-06-20T10:00:00Z',
    updatedAt: '2024-08-10T11:00:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
  },
  {
    id: 'eq_003',
    venueId: 'v1',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'OVEN',
    brand: 'Rational',
    model: 'iCombi Pro 10-1/1',
    serialNumber: 'RAT-2024-78432',
    nickname: 'Four Combi Principal',
    location: 'Cuisine Principale',
    specifications: {
      voltage: '400V',
      power: '19kW',
      capacity: '10 niveaux GN 1/1',
    },
    installationDate: '2023-01-10',
    purchaseDate: '2022-12-15',
    warrantyExpiry: '2026-01-10',
    lastServiceDate: '2024-10-01',
    status: 'FAULT',
    healthScore: 45,
    photos: [
      {
        id: 'ph_003',
        url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        type: 'OVERVIEW',
        caption: 'Four Rational',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_003',
    qrCodeUrl: generateQRCodeUrl('eq_003'),
    createdAt: '2023-01-10T10:00:00Z',
    updatedAt: '2024-12-01T09:00:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
    metadata: {
      lastFault: 'Ne chauffe plus en mode vapeur',
      faultReportedAt: '2024-12-01T08:30:00Z',
    },
  },
  {
    id: 'eq_004',
    venueId: 'v1',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'DISHWASHER',
    brand: 'Winterhalter',
    model: 'PT-500',
    serialNumber: 'WH-PT500-2022-1234',
    nickname: 'Lave-vaisselle Principal',
    location: 'Plonge',
    specifications: {
      voltage: '400V',
      power: '11kW',
      capacity: '60 paniers/h',
    },
    installationDate: '2022-08-15',
    purchaseDate: '2022-08-01',
    warrantyExpiry: '2025-08-01',
    lastServiceDate: '2024-07-20',
    nextServiceDue: '2025-01-20',
    status: 'WARNING',
    healthScore: 72,
    photos: [
      {
        id: 'ph_004',
        url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
        type: 'OVERVIEW',
        caption: 'Lave-vaisselle Winterhalter',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_004',
    qrCodeUrl: generateQRCodeUrl('eq_004'),
    createdAt: '2022-08-15T10:00:00Z',
    updatedAt: '2024-11-15T16:00:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
    metadata: {
      warningReason: 'Maintenance préventive recommandée',
    },
  },
  {
    id: 'eq_005',
    venueId: 'v1',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'ICE_MACHINE',
    brand: 'Hoshizaki',
    model: 'IM-240',
    serialNumber: 'HSZ-IM240-56789',
    nickname: 'Machine Glaçons Bar',
    location: 'Bar Principal',
    specifications: {
      voltage: '220V',
      power: '0.45kW',
      capacity: '240kg/24h',
    },
    installationDate: '2023-05-01',
    purchaseDate: '2023-04-15',
    warrantyExpiry: '2026-04-15',
    lastServiceDate: '2024-11-01',
    status: 'OPERATIONAL',
    healthScore: 92,
    photos: [
      {
        id: 'ph_005',
        url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800',
        type: 'OVERVIEW',
        caption: 'Machine à glaçons',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_005',
    qrCodeUrl: generateQRCodeUrl('eq_005'),
    createdAt: '2023-05-01T10:00:00Z',
    updatedAt: '2024-11-01T10:00:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
  },
  {
    id: 'eq_006',
    venueId: 'v1',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'BEER_TAP',
    brand: 'Lindr',
    model: 'KONTAKT 40/K',
    serialNumber: 'LDR-K40-2023-001',
    nickname: 'Tireuse Pression',
    location: 'Bar Principal',
    specifications: {
      voltage: '220V',
      power: '0.25kW',
      capacity: '4 becs',
    },
    installationDate: '2023-02-01',
    purchaseDate: '2023-01-15',
    warrantyExpiry: '2025-01-15',
    lastServiceDate: '2024-10-15',
    status: 'OPERATIONAL',
    healthScore: 85,
    photos: [
      {
        id: 'ph_006',
        url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800',
        type: 'OVERVIEW',
        caption: 'Tireuse à bière',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_006',
    qrCodeUrl: generateQRCodeUrl('eq_006'),
    createdAt: '2023-02-01T10:00:00Z',
    updatedAt: '2024-10-15T14:00:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
  },

  // ============================================================================
  // ÉQUIPEMENTS L'AMBROISIE (v3) - Place des Vosges
  // ============================================================================
  {
    id: 'eq_ambroisie_001',
    venueId: 'v3',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'COLD_ROOM',
    brand: 'Dagard',
    model: 'Positive Walk-In 12m³',
    serialNumber: 'DAG-CF-2019-45821',
    nickname: 'Chambre Froide Positive',
    location: 'Sous-sol Cuisine',
    specifications: {
      voltage: '400V',
      power: '3.5kW',
      capacity: '12m³ - 8 tonnes stockage',
      gasType: 'R404A',  // ← Fluide frigorigène critique
    },
    installationDate: '2019-06-15',
    purchaseDate: '2019-05-01',
    warrantyExpiry: '2024-06-15',
    lastServiceDate: '2024-09-20',
    nextServiceDue: '2025-03-20',
    status: 'OPERATIONAL',
    healthScore: 91,
    photos: [
      {
        id: 'ph_amb_001',
        url: 'https://images.unsplash.com/photo-1581092921461-eab32e97f633?w=800',
        type: 'OVERVIEW',
        caption: 'Chambre froide positive - Vue intérieure',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'ph_amb_001b',
        url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800',
        type: 'NAMEPLATE',
        caption: 'Plaque signalétique groupe froid',
        uploadedAt: '2024-01-15T10:05:00Z',
      },
    ],
    qrCodeId: 'qr_eq_amb_001',
    qrCodeUrl: generateQRCodeUrl('eq_ambroisie_001'),
    createdAt: '2019-06-15T10:00:00Z',
    updatedAt: '2024-09-20T14:30:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
    metadata: {
      temperatureSetpoint: '+2°C',
      haccomplianceDate: '2024-09-20',
      refrigerantCharge: '4.2kg R404A',
    },
  },
  {
    id: 'eq_ambroisie_002',
    venueId: 'v3',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'COLD_ROOM',
    brand: 'Dagard',
    model: 'Négative Walk-In 6m³',
    serialNumber: 'DAG-CN-2019-45822',
    nickname: 'Chambre Froide Négative',
    location: 'Sous-sol Cuisine',
    specifications: {
      voltage: '400V',
      power: '4.8kW',
      capacity: '6m³ - 4 tonnes stockage',
      gasType: 'R404A',
    },
    installationDate: '2019-06-15',
    purchaseDate: '2019-05-01',
    warrantyExpiry: '2024-06-15',
    lastServiceDate: '2024-09-20',
    nextServiceDue: '2025-03-20',
    status: 'OPERATIONAL',
    healthScore: 88,
    photos: [
      {
        id: 'ph_amb_002',
        url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800',
        type: 'OVERVIEW',
        caption: 'Chambre froide négative',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_amb_002',
    qrCodeUrl: generateQRCodeUrl('eq_ambroisie_002'),
    createdAt: '2019-06-15T10:00:00Z',
    updatedAt: '2024-09-20T14:30:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
    metadata: {
      temperatureSetpoint: '-22°C',
      refrigerantCharge: '5.8kg R404A',
    },
  },
  {
    id: 'eq_ambroisie_003',
    venueId: 'v3',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'OVEN',
    brand: 'Bonnet Thirode',
    model: 'Maestro 20 GN 2/1 GAZ',
    serialNumber: 'BNT-M20G-2021-78452',
    nickname: 'Four Mixte Principal (GAZ)',
    location: 'Cuisine Principale',
    specifications: {
      voltage: '230V',    // Électronique uniquement
      power: '0.8kW',     // Électronique
      capacity: '20 niveaux GN 2/1',
      // SPÉCIFICITÉS GAZ
    },
    installationDate: '2021-03-10',
    purchaseDate: '2021-02-15',
    warrantyExpiry: '2026-03-10',
    lastServiceDate: '2024-10-15',
    nextServiceDue: '2025-04-15',
    status: 'OPERATIONAL',
    healthScore: 94,
    photos: [
      {
        id: 'ph_amb_003',
        url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        type: 'OVERVIEW',
        caption: 'Four Mixte Bonnet Thirode - Vue d\'ensemble',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'ph_amb_003b',
        url: 'https://images.unsplash.com/photo-1600891963935-9e7d4a2b8d83?w=800',
        type: 'NAMEPLATE',
        caption: 'Plaque CE + attestation Qualigaz',
        uploadedAt: '2024-01-15T10:05:00Z',
      },
    ],
    qrCodeId: 'qr_eq_amb_003',
    qrCodeUrl: generateQRCodeUrl('eq_ambroisie_003'),
    createdAt: '2021-03-10T10:00:00Z',
    updatedAt: '2024-10-15T11:00:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
    metadata: {
      energyType: 'GAZ_NATUREL',           // ← Type d'énergie = GAZ
      gasConnection: 'G20 - 20mbar',        // Type raccordement gaz
      qualigaz: 'CERT-2021-78452-QG',       // Certificat Qualigaz
      lastQualigaz: '2024-10-15',           // Dernière vérification
      burnerPower: '45kW thermique',        // Puissance brûleur
    },
  },
  {
    id: 'eq_ambroisie_004',
    venueId: 'v3',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'COOKING',
    brand: 'Bonnet Thirode',
    model: 'Piano Central 6 Feux GAZ',
    serialNumber: 'BNT-PC6G-2020-34521',
    nickname: 'Piano 6 Feux (GAZ)',
    location: 'Cuisine Principale',
    specifications: {
      voltage: '230V',
      power: '0.2kW',      // Allumage électronique
      capacity: '6 feux - 4 moyens + 2 vifs',
    },
    installationDate: '2020-09-01',
    purchaseDate: '2020-08-15',
    warrantyExpiry: '2025-09-01',
    lastServiceDate: '2024-08-20',
    nextServiceDue: '2025-02-20',
    status: 'OPERATIONAL',
    healthScore: 87,
    photos: [
      {
        id: 'ph_amb_004',
        url: 'https://images.unsplash.com/photo-1556909211-36987daf7b4d?w=800',
        type: 'OVERVIEW',
        caption: 'Piano central 6 feux gaz',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_amb_004',
    qrCodeUrl: generateQRCodeUrl('eq_ambroisie_004'),
    createdAt: '2020-09-01T10:00:00Z',
    updatedAt: '2024-08-20T14:00:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
    metadata: {
      energyType: 'GAZ_NATUREL',
      gasConnection: 'G20 - 20mbar',
      qualigaz: 'CERT-2020-34521-QG',
      totalBurnerPower: '36kW thermique',
    },
  },
  {
    id: 'eq_ambroisie_005',
    venueId: 'v3',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'COFFEE_MACHINE',
    brand: 'Victoria Arduino',
    model: 'Black Eagle Maverick T3',
    serialNumber: 'VA-BEM-2023-12458',
    nickname: 'Machine Café Salon',
    location: 'Salon de Thé',
    specifications: {
      voltage: '230V',
      power: '4.8kW',
      capacity: '3 groupes - Gravimétrique',
    },
    installationDate: '2023-06-01',
    purchaseDate: '2023-05-15',
    warrantyExpiry: '2026-06-01',
    lastServiceDate: '2024-11-01',
    nextServiceDue: '2025-05-01',
    status: 'OPERATIONAL',
    healthScore: 98,
    photos: [
      {
        id: 'ph_amb_005',
        url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
        type: 'OVERVIEW',
        caption: 'Victoria Arduino Black Eagle',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_amb_005',
    qrCodeUrl: generateQRCodeUrl('eq_ambroisie_005'),
    createdAt: '2023-06-01T10:00:00Z',
    updatedAt: '2024-11-01T10:00:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
  },
  {
    id: 'eq_ambroisie_006',
    venueId: 'v3',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'DISHWASHER',
    brand: 'Meiko',
    model: 'M-iClean UL',
    serialNumber: 'MKO-UL-2022-89745',
    nickname: 'Tunnel Lave-vaisselle',
    location: 'Plonge',
    specifications: {
      voltage: '400V',
      power: '18kW',
      capacity: '150 paniers/h - Tunnel',
    },
    installationDate: '2022-01-15',
    purchaseDate: '2022-01-01',
    warrantyExpiry: '2027-01-15',
    lastServiceDate: '2024-10-10',
    nextServiceDue: '2025-04-10',
    status: 'OPERATIONAL',
    healthScore: 92,
    photos: [
      {
        id: 'ph_amb_006',
        url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
        type: 'OVERVIEW',
        caption: 'Tunnel Meiko',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_amb_006',
    qrCodeUrl: generateQRCodeUrl('eq_ambroisie_006'),
    createdAt: '2022-01-15T10:00:00Z',
    updatedAt: '2024-10-10T14:00:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
  },
  {
    id: 'eq_ambroisie_007',
    venueId: 'v3',
    ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
    category: 'VENTILATION',
    brand: 'Halton',
    model: 'Capture Jet KVL-UV',
    serialNumber: 'HLT-KVL-2019-34567',
    nickname: 'Hotte Centrale + UV',
    location: 'Cuisine Principale',
    specifications: {
      voltage: '400V',
      power: '7.5kW',
      capacity: '8000m³/h - UV intégré',
    },
    installationDate: '2019-06-15',
    purchaseDate: '2019-05-01',
    warrantyExpiry: '2024-06-15',
    lastServiceDate: '2024-09-15',
    nextServiceDue: '2025-03-15',
    status: 'WARNING',
    healthScore: 75,
    photos: [
      {
        id: 'ph_amb_007',
        url: 'https://images.unsplash.com/photo-1556909211-36987daf7b4d?w=800',
        type: 'OVERVIEW',
        caption: 'Hotte Halton Capture Jet',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
    qrCodeId: 'qr_eq_amb_007',
    qrCodeUrl: generateQRCodeUrl('eq_ambroisie_007'),
    createdAt: '2019-06-15T10:00:00Z',
    updatedAt: '2024-09-15T14:00:00Z',
    createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
    metadata: {
      warningReason: 'Remplacement lampes UV recommandé',
      lastUvChange: '2023-03-15',
    },
  },
];

const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'maint_001',
    equipmentId: 'eq_001',
    type: 'PREVENTIVE',
    description: 'Maintenance annuelle complète',
    resolution: 'Détartrage, changement des joints, calibration',
    technicianName: 'Jean Dupont',
    technicianRating: 5,
    cost: 250,
    partsReplaced: ['Joints groupe', 'Filtre eau'],
    date: '2024-09-15',
    duration: 120,
  },
  {
    id: 'maint_002',
    equipmentId: 'eq_002',
    type: 'REPAIR',
    description: 'Fuite d\'eau sous le compresseur',
    faultType: 'leak',
    resolution: 'Remplacement du bac de récupération',
    technicianName: 'Pierre Martin',
    technicianRating: 4,
    cost: 180,
    partsReplaced: ['Bac récupération'],
    date: '2024-03-12',
    duration: 90,
  },
  {
    id: 'maint_003',
    equipmentId: 'eq_003',
    missionId: 'm1',
    type: 'REPAIR',
    description: 'Four ne chauffe plus en mode vapeur',
    faultType: 'steam_system',
    technicianName: 'Jean D.',
    date: '2024-12-08',
    notes: 'Intervention en cours',
  },
];

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      // Initial State
      equipment: INITIAL_EQUIPMENT,
      maintenanceHistory: INITIAL_MAINTENANCE,
      filters: {},
      selectedEquipmentId: null,

      // CRUD Actions
      addEquipment: (equipmentData) => {
        const id = `eq_${Date.now()}`;
        const now = new Date().toISOString();
        const qrCodeId = `qr_${id}`;

        const newEquipment: Equipment = {
          ...equipmentData,
          id,
          qrCodeId,
          qrCodeUrl: generateQRCodeUrl(id),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          equipment: [newEquipment, ...state.equipment],
        }));

        return newEquipment;
      },

      updateEquipment: (id, updates) => {
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === id
              ? { ...eq, ...updates, updatedAt: new Date().toISOString() }
              : eq
          ),
        }));
      },

      deleteEquipment: (id) => {
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === id
              ? { ...eq, isDeleted: true, deletedAt: new Date().toISOString() }
              : eq
          ),
        }));
      },

      restoreEquipment: (id) => {
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === id
              ? { ...eq, isDeleted: false, deletedAt: undefined }
              : eq
          ),
        }));
      },

      // Status Actions
      setEquipmentStatus: (id, status) => {
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === id
              ? { ...eq, status, updatedAt: new Date().toISOString() }
              : eq
          ),
        }));
      },

      reportFault: (id, faultType, description) => {
        const now = new Date().toISOString();
        set((state) => ({
          equipment: state.equipment.map((eq) =>
            eq.id === id
              ? {
                  ...eq,
                  status: 'FAULT' as EquipmentStatus,
                  updatedAt: now,
                  metadata: {
                    ...eq.metadata,
                    lastFault: faultType,
                    faultDescription: description,
                    faultReportedAt: now,
                  },
                }
              : eq
          ),
        }));
      },

      // Maintenance Actions
      addMaintenanceRecord: (record) => {
        const id = `maint_${Date.now()}`;
        const newRecord: MaintenanceRecord = { ...record, id };

        set((state) => ({
          maintenanceHistory: [newRecord, ...state.maintenanceHistory],
        }));

        // Update equipment's last service date if it's a completed maintenance
        if (record.type !== 'INSPECTION') {
          get().updateEquipment(record.equipmentId, {
            lastServiceDate: record.date,
          });
        }
      },

      // UI Actions
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      selectEquipment: (id) => {
        set({ selectedEquipmentId: id });
      },

      // Getters
      getEquipmentById: (id) => {
        return get().equipment.find((eq) => eq.id === id);
      },

      getEquipmentByVenue: (venueId) => {
        return get().equipment.filter((eq) => eq.venueId === venueId && !eq.isDeleted);
      },

      getEquipmentByCategory: (category) => {
        return get().equipment.filter((eq) => eq.category === category && !eq.isDeleted);
      },

      getEquipmentHistory: (equipmentId) => {
        return get().maintenanceHistory.filter(
          (m) => m.equipmentId === equipmentId
        );
      },

      getFilteredEquipment: () => {
        const { equipment, filters } = get();

        return equipment.filter((eq) => {
          if (filters.showDeleted) {
            if (!eq.isDeleted) return false;
          } else {
            if (eq.isDeleted) return false;
          }

          if (filters.category && eq.category !== filters.category) return false;
          if (filters.status && eq.status !== filters.status) return false;
          if (filters.location && eq.location !== filters.location) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const searchableText = `${eq.brand} ${eq.model} ${eq.nickname || ''} ${eq.location}`.toLowerCase();
            if (!searchableText.includes(search)) return false;
          }
          return true;
        });
      },
    }),
    {
      name: 'equipment-storage',
    }
  )
);
