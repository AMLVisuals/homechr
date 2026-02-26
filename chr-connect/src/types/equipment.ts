// ============================================================================
// EQUIPMENT MANAGEMENT SYSTEM - Type Definitions
// "Shazam des machines" & "Digital Twin" for HORECA equipment
// ============================================================================

// Equipment Categories - Types of machines in HORECA sector
export type EquipmentCategory =
  | 'FRIDGE'           // Réfrigérateurs, armoires froides
  | 'FREEZER'          // Congélateurs, chambres froides négatives
  | 'COLD_ROOM'        // Chambres froides positives
  | 'COFFEE_MACHINE'   // Machines à café professionnelles
  | 'OVEN'             // Fours (combi, pizza, patisserie)
  | 'DISHWASHER'       // Lave-vaisselle professionnels
  | 'ICE_MACHINE'      // Machines à glaçons
  | 'BEER_TAP'         // Tireuses à bière
  | 'VENTILATION'      // Hottes, extracteurs
  | 'COOKING'          // Plaques, friteuses, grills
  | 'AUDIO'            // Son, enceintes, amplis
  | 'LIGHTING'         // Éclairage, projecteurs
  | 'VIDEO'            // Vidéoprojecteurs, caméras
  | 'POS'              // Caisses, TPE
  | 'NETWORK'          // WiFi, bornes
  | 'SCREEN'           // Écrans, affichage dynamique
  | 'OTHER';           // Autres équipements

// Equipment operational status
export type EquipmentStatus =
  | 'OPERATIONAL'      // ✅ Vert - Tout fonctionne
  | 'WARNING'          // ⚠️ Orange - Maintenance préventive recommandée
  | 'FAULT'            // 🔴 Rouge - En panne, intervention requise
  | 'MAINTENANCE';     // 🔧 Bleu - En cours de maintenance

// Fault severity levels
export type FaultSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Fault types per equipment category
export interface FaultType {
  id: string;
  label: string;
  severity: FaultSeverity;
  category: EquipmentCategory;
}

// Photo types for equipment
export type EquipmentPhotoType =
  | 'OVERVIEW'         // Vue d'ensemble de la machine
  | 'NAMEPLATE'        // Plaque signalétique
  | 'SERIAL'           // Numéro de série
  | 'FAULT'            // Photo du problème
  | 'REPAIR';          // Photo après réparation

export interface EquipmentPhoto {
  id: string;
  url: string;
  type: EquipmentPhotoType;
  caption?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export type DocumentType = 
  | 'MANUAL' 
  | 'INVOICE' 
  | 'WARRANTY' 
  | 'TECHNICAL_SHEET' 
  | 'MAINTENANCE_REPORT' 
  | 'OTHER';

export interface ImageAnnotation {
  id: string;
  type: 'POINT' | 'LINE';
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  endX?: number; // Percentage 0-100
  endY?: number; // Percentage 0-100
  text?: string;
  color?: string;
}

export interface EquipmentDocument {
  id: string;
  name: string;
  url: string;
  pages?: string[]; // For multi-page documents
  type: DocumentType;
  uploadedAt: string;
  fileSize?: string;
  mimeType?: string;
  annotations?: ImageAnnotation[];
  file?: File;
}

// Main Equipment interface - The "Digital Twin"
export interface Equipment {
  id: string;                          // ex: "eq_abc123"
  venueId: string;                     // Link to the venue/restaurant
  ownerId: string;                     // Restaurant owner ID

  // Core identification (from OCR or manual)
  category: EquipmentCategory;
  brand: string;                       // ex: "Hoshizaki", "La Marzocco"
  model: string;                       // ex: "IM-240", "Linea PB"
  serialNumber?: string;               // ex: "L098765"

  // Display info
  nickname?: string;                   // User-friendly name: "Frigo Bar Principal"
  location: string;                    // Physical location: "Cuisine 1", "Bar"

  // Technical specifications (from OCR/manual)
  specifications?: {
    voltage?: string;                  // ex: "220V", "380V"
    power?: string;                    // ex: "2.5kW"
    gasType?: 'R134a' | 'R404A' | 'R290' | 'OTHER';
    capacity?: string;                 // ex: "500L", "120 couverts/h"
    dimensions?: string;               // ex: "1800x800x850mm"
  };

  // Lifecycle tracking
  installationDate?: string;           // ISO date
  purchaseDate?: string;               // ISO date
  warrantyExpiry?: string;             // ISO date
  lastServiceDate?: string;            // ISO date
  nextServiceDue?: string;             // ISO date

  // Status & health
  status: EquipmentStatus;
  healthScore?: number;                // 0-100, calculated from history

  // Media & documentation
  photos: EquipmentPhoto[];
  documents?: EquipmentDocument[];     // Technical manuals, warranty docs

  // QR Code for quick access
  qrCodeId: string;                    // Unique ID for QR generation
  qrCodeUrl?: string;                  // Generated QR code image URL

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDeleted?: boolean;
  deletedAt?: string;

  // AI-extracted metadata (flexible for future)
  metadata?: {
    lastFault?: string;
    faultDescription?: string;
    faultReportedAt?: string;
    warningReason?: string;
    [key: string]: string | undefined;
  };
}

// Maintenance/Intervention history record
export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  missionId?: string;                  // Link to mission if applicable

  type: 'REPAIR' | 'PREVENTIVE' | 'INSTALLATION' | 'INSPECTION';
  description: string;
  faultType?: string;                  // What was wrong
  resolution?: string;                 // What was done

  technicianId?: string;
  technicianName?: string;
  technicianRating?: number;

  cost?: number;
  partsReplaced?: string[];

  photos?: EquipmentPhoto[];
  notes?: string;

  date: string;                        // When it happened
  duration?: number;                   // Minutes
}

// OCR scan result from camera
export interface OCRResult {
  success: boolean;
  confidence: number;                  // 0-1

  // Extracted fields
  brand?: string;
  model?: string;
  serialNumber?: string;
  voltage?: string;
  power?: string;
  capacity?: string;
  manufacturingDate?: string;

  // Raw data for debugging
  rawText?: string;

  // Suggestions if partial match
  suggestions?: {
    brand?: string[];
    model?: string[];
  };
}

// Fault declaration (when reporting a problem)
export interface FaultDeclaration {
  id: string;
  equipmentId: string;
  venueId: string;

  faultType: string;                   // From predefined list
  severity: FaultSeverity;
  description?: string;

  photos?: string[];

  reportedAt: string;
  reportedBy: string;

  // Resulting mission if created
  missionId?: string;
}

// Equipment form data for creation/editing
export interface EquipmentFormData {
  category: EquipmentCategory;
  brand: string;
  model: string;
  serialNumber?: string;
  nickname?: string;
  location: string;
  specifications?: Equipment['specifications'];
  installationDate?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  photos?: File[];
}

// Equipment filters for the garage view
export interface EquipmentFilters {
  category?: EquipmentCategory;
  status?: EquipmentStatus;
  location?: string;
  search?: string;
  showDeleted?: boolean;
}

// Predefined fault types per category
export const FAULT_TYPES: Record<EquipmentCategory, FaultType[]> = {
  FRIDGE: [
    { id: 'no_cooling', label: 'Ne refroidit plus', severity: 'CRITICAL', category: 'FRIDGE' },
    { id: 'leak', label: 'Fuite d\'eau', severity: 'HIGH', category: 'FRIDGE' },
    { id: 'frost', label: 'Givre excessif', severity: 'MEDIUM', category: 'FRIDGE' },
    { id: 'noise', label: 'Bruit anormal', severity: 'LOW', category: 'FRIDGE' },
    { id: 'door_seal', label: 'Joint de porte défectueux', severity: 'MEDIUM', category: 'FRIDGE' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'FRIDGE' },
  ],
  FREEZER: [
    { id: 'no_freezing', label: 'Ne congèle plus', severity: 'CRITICAL', category: 'FREEZER' },
    { id: 'temp_unstable', label: 'Température instable', severity: 'HIGH', category: 'FREEZER' },
    { id: 'ice_buildup', label: 'Accumulation de glace', severity: 'MEDIUM', category: 'FREEZER' },
    { id: 'compressor', label: 'Problème compresseur', severity: 'CRITICAL', category: 'FREEZER' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'FREEZER' },
  ],
  COLD_ROOM: [
    { id: 'temp_high', label: 'Température trop haute', severity: 'CRITICAL', category: 'COLD_ROOM' },
    { id: 'door_problem', label: 'Problème de porte', severity: 'HIGH', category: 'COLD_ROOM' },
    { id: 'condensation', label: 'Condensation excessive', severity: 'MEDIUM', category: 'COLD_ROOM' },
    { id: 'alarm', label: 'Alarme déclenchée', severity: 'HIGH', category: 'COLD_ROOM' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'COLD_ROOM' },
  ],
  COFFEE_MACHINE: [
    { id: 'no_coffee', label: 'Ne fait plus de café', severity: 'HIGH', category: 'COFFEE_MACHINE' },
    { id: 'water_leak', label: 'Fuite d\'eau', severity: 'MEDIUM', category: 'COFFEE_MACHINE' },
    { id: 'grinder', label: 'Moulin bloqué', severity: 'MEDIUM', category: 'COFFEE_MACHINE' },
    { id: 'steam', label: 'Problème vapeur', severity: 'MEDIUM', category: 'COFFEE_MACHINE' },
    { id: 'descaling', label: 'Détartrage nécessaire', severity: 'LOW', category: 'COFFEE_MACHINE' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'COFFEE_MACHINE' },
  ],
  OVEN: [
    { id: 'no_heat', label: 'Ne chauffe plus', severity: 'CRITICAL', category: 'OVEN' },
    { id: 'temp_wrong', label: 'Température incorrecte', severity: 'HIGH', category: 'OVEN' },
    { id: 'door', label: 'Problème de porte', severity: 'MEDIUM', category: 'OVEN' },
    { id: 'fan', label: 'Ventilateur défaillant', severity: 'MEDIUM', category: 'OVEN' },
    { id: 'steam_system', label: 'Système vapeur HS', severity: 'HIGH', category: 'OVEN' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'OVEN' },
  ],
  DISHWASHER: [
    { id: 'no_wash', label: 'Ne lave plus', severity: 'CRITICAL', category: 'DISHWASHER' },
    { id: 'no_drain', label: 'Ne vidange pas', severity: 'HIGH', category: 'DISHWASHER' },
    { id: 'water_leak', label: 'Fuite d\'eau', severity: 'HIGH', category: 'DISHWASHER' },
    { id: 'bad_smell', label: 'Mauvaises odeurs', severity: 'LOW', category: 'DISHWASHER' },
    { id: 'detergent', label: 'Problème doseur produit', severity: 'MEDIUM', category: 'DISHWASHER' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'DISHWASHER' },
  ],
  ICE_MACHINE: [
    { id: 'no_ice', label: 'Ne produit plus de glaçons', severity: 'CRITICAL', category: 'ICE_MACHINE' },
    { id: 'slow_production', label: 'Production lente', severity: 'MEDIUM', category: 'ICE_MACHINE' },
    { id: 'cloudy_ice', label: 'Glaçons troubles', severity: 'LOW', category: 'ICE_MACHINE' },
    { id: 'water_leak', label: 'Fuite d\'eau', severity: 'HIGH', category: 'ICE_MACHINE' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'ICE_MACHINE' },
  ],
  BEER_TAP: [
    { id: 'no_beer', label: 'Ne tire plus de bière', severity: 'HIGH', category: 'BEER_TAP' },
    { id: 'foam', label: 'Trop de mousse', severity: 'MEDIUM', category: 'BEER_TAP' },
    { id: 'flat', label: 'Bière plate', severity: 'MEDIUM', category: 'BEER_TAP' },
    { id: 'temp', label: 'Température incorrecte', severity: 'MEDIUM', category: 'BEER_TAP' },
    { id: 'leak', label: 'Fuite CO2/bière', severity: 'HIGH', category: 'BEER_TAP' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'BEER_TAP' },
  ],
  VENTILATION: [
    { id: 'no_suction', label: 'Plus d\'aspiration', severity: 'CRITICAL', category: 'VENTILATION' },
    { id: 'noise', label: 'Bruit excessif', severity: 'MEDIUM', category: 'VENTILATION' },
    { id: 'vibration', label: 'Vibrations anormales', severity: 'MEDIUM', category: 'VENTILATION' },
    { id: 'grease', label: 'Accumulation de graisse', severity: 'HIGH', category: 'VENTILATION' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'VENTILATION' },
  ],
  COOKING: [
    { id: 'no_heat', label: 'Ne chauffe plus', severity: 'CRITICAL', category: 'COOKING' },
    { id: 'uneven_heat', label: 'Chaleur inégale', severity: 'MEDIUM', category: 'COOKING' },
    { id: 'thermostat', label: 'Thermostat défaillant', severity: 'HIGH', category: 'COOKING' },
    { id: 'gas_issue', label: 'Problème gaz', severity: 'CRITICAL', category: 'COOKING' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'COOKING' },
  ],
  AUDIO: [
    { id: 'no_sound', label: 'Pas de son', severity: 'HIGH', category: 'AUDIO' },
    { id: 'distortion', label: 'Son distordu', severity: 'MEDIUM', category: 'AUDIO' },
    { id: 'connection', label: 'Problème de connexion', severity: 'MEDIUM', category: 'AUDIO' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'AUDIO' },
  ],
  LIGHTING: [
    { id: 'not_working', label: 'Ne s\'allume pas', severity: 'HIGH', category: 'LIGHTING' },
    { id: 'flickering', label: 'Scintillement', severity: 'MEDIUM', category: 'LIGHTING' },
    { id: 'dim', label: 'Lumière faible', severity: 'LOW', category: 'LIGHTING' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'LIGHTING' },
  ],
  VIDEO: [
    { id: 'no_image', label: 'Pas d\'image', severity: 'HIGH', category: 'VIDEO' },
    { id: 'blur', label: 'Image floue', severity: 'MEDIUM', category: 'VIDEO' },
    { id: 'connection', label: 'Problème de connexion', severity: 'MEDIUM', category: 'VIDEO' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'VIDEO' },
  ],
  POS: [
    { id: 'not_working', label: 'Ne fonctionne plus', severity: 'CRITICAL', category: 'POS' },
    { id: 'printer', label: 'Imprimante HS', severity: 'HIGH', category: 'POS' },
    { id: 'payment', label: 'Problème paiement', severity: 'CRITICAL', category: 'POS' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'POS' },
  ],
  NETWORK: [
    { id: 'no_connection', label: 'Pas de connexion', severity: 'HIGH', category: 'NETWORK' },
    { id: 'slow', label: 'Connexion lente', severity: 'MEDIUM', category: 'NETWORK' },
    { id: 'intermittent', label: 'Connexion intermittente', severity: 'MEDIUM', category: 'NETWORK' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'NETWORK' },
  ],
  SCREEN: [
    { id: 'no_display', label: 'Pas d\'affichage', severity: 'HIGH', category: 'SCREEN' },
    { id: 'dead_pixels', label: 'Pixels morts', severity: 'LOW', category: 'SCREEN' },
    { id: 'touch', label: 'Problème tactile', severity: 'MEDIUM', category: 'SCREEN' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'SCREEN' },
  ],
  OTHER: [
    { id: 'not_working', label: 'Ne fonctionne plus', severity: 'HIGH', category: 'OTHER' },
    { id: 'noise', label: 'Bruit anormal', severity: 'MEDIUM', category: 'OTHER' },
    { id: 'other', label: 'Autre problème', severity: 'MEDIUM', category: 'OTHER' },
  ],
};

// Category labels for UI
export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  FRIDGE: 'Réfrigérateur',
  FREEZER: 'Congélateur',
  COLD_ROOM: 'Chambre froide',
  COFFEE_MACHINE: 'Machine à café',
  OVEN: 'Four',
  DISHWASHER: 'Lave-vaisselle',
  ICE_MACHINE: 'Machine à glaçons',
  BEER_TAP: 'Tireuse à bière',
  VENTILATION: 'Ventilation/Hotte',
  COOKING: 'Équipement cuisson',
  AUDIO: 'Audio/Son',
  LIGHTING: 'Éclairage',
  VIDEO: 'Vidéo/Projection',
  POS: 'Caisse/TPE',
  NETWORK: 'Réseau/WiFi',
  SCREEN: 'Écran/Affichage',
  OTHER: 'Autre',
};

// Category icons (Lucide icon names)
export const EQUIPMENT_CATEGORY_ICONS: Record<EquipmentCategory, string> = {
  FRIDGE: 'Refrigerator',
  FREEZER: 'Snowflake',
  COLD_ROOM: 'Warehouse',
  COFFEE_MACHINE: 'Coffee',
  OVEN: 'Flame',
  DISHWASHER: 'Droplets',
  ICE_MACHINE: 'IceCream',
  BEER_TAP: 'Beer',
  VENTILATION: 'Wind',
  COOKING: 'CookingPot',
  AUDIO: 'Volume2',
  LIGHTING: 'Lightbulb',
  VIDEO: 'Video',
  POS: 'CreditCard',
  NETWORK: 'Wifi',
  SCREEN: 'Monitor',
  OTHER: 'Cog',
};

// Status display info
export const EQUIPMENT_STATUS_INFO: Record<EquipmentStatus, { label: string; color: string; bgColor: string }> = {
  OPERATIONAL: {
    label: 'Opérationnel',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  },
  WARNING: {
    label: 'Attention',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20'
  },
  FAULT: {
    label: 'En panne',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20'
  },
  MAINTENANCE: {
    label: 'En maintenance',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
};
