// ============================================================================
// UNIFIED TYPE SYSTEM - ESTABLISHMENT AS CENTER OF GRAVITY
// ============================================================================
// Ce fichier définit le modèle de données unifié où l'Établissement
// est le centre de gravité de tout le système.
// ============================================================================

import type { EquipmentCategory, EquipmentStatus, Equipment } from './equipment';
import type { Mission, MissionType } from './missions';
import type { Venue } from './venue';

// ============================================================================
// UNIFIED MISSION - Maintenance & Staffing unified
// ============================================================================

export type UnifiedMissionType =
  | 'EQUIPMENT_REPAIR'    // Réparation d'équipement
  | 'EQUIPMENT_MAINTENANCE' // Maintenance préventive
  | 'STAFFING'            // Demande de personnel
  | 'CONSULTING'          // Conseil/diagnostic
  | 'OTHER';              // Autre

export type UnifiedMissionStatus =
  | 'DRAFT'               // Brouillon (pas encore envoyé)
  | 'SEARCHING'           // Recherche de prestataire
  | 'MATCHED'             // Prestataire trouvé, en attente confirmation
  | 'SCHEDULED'           // Planifié
  | 'ON_WAY'              // Prestataire en route
  | 'ON_SITE'             // Prestataire sur place
  | 'IN_PROGRESS'         // Intervention en cours
  | 'COMPLETED'           // Terminé
  | 'CANCELLED'           // Annulé
  | 'DISPUTED';           // En litige

export type UnifiedMissionPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EMERGENCY';

export interface UnifiedMission {
  id: string;

  // Core relationship - ESTABLISHMENT IS KEY
  establishmentId: string;
  establishmentName?: string;

  // Equipment link (null for staffing)
  equipmentId: string | null;
  equipmentName?: string;
  equipmentCategory?: EquipmentCategory;

  // Problem identification
  problemId: string;           // From equipmentProblems.ts or staffing needs
  problemLabel: string;
  problemDescription?: string;

  // Mission details
  type: UnifiedMissionType;
  status: UnifiedMissionStatus;
  priority: UnifiedMissionPriority;

  // Dates
  createdAt: string;
  scheduledAt?: string;        // When intervention is planned
  startedAt?: string;          // When intervention started
  completedAt?: string;        // When intervention ended

  // Provider (technicien ou extra)
  providerId?: string;
  providerName?: string;
  providerRating?: number;
  providerEta?: number;        // Minutes until arrival
  providerLocation?: {
    lat: number;
    lng: number;
  };

  // Pricing
  estimatedPrice: {
    min: number;
    max: number;
  };
  finalPrice?: number;

  // Evidence
  photos?: string[];
  notes?: string;
  beforePhoto?: string;
  afterPhoto?: string;
  report?: string;

  // For staffing missions
  staffingDetails?: {
    role: string;
    date: string;
    startTime: string;
    endTime: string;
    numberOfPeople: number;
    hourlyRate: number;
  };

  // Metadata
  requiredSkills: string[];
  estimatedDuration?: number;  // Minutes
}

// ============================================================================
// ESTABLISHMENT-CENTRIC VIEW
// ============================================================================

export interface EstablishmentView {
  establishment: Venue;

  // Equipment garage
  equipment: Equipment[];
  equipmentStats: {
    total: number;
    operational: number;
    warning: number;
    fault: number;
    maintenance: number;
  };

  // Missions
  missions: UnifiedMission[];
  missionStats: {
    total: number;
    active: number;      // ON_WAY, ON_SITE, IN_PROGRESS
    pending: number;     // SEARCHING, MATCHED, SCHEDULED
    completed: number;
    thisMonth: number;
  };

  // Costs
  costStats: {
    thisMonth: number;
    lastMonth: number;
    avgPerMission: number;
  };
}

// ============================================================================
// ACTION TYPES - What user can do from dashboard
// ============================================================================

export type QuickActionType =
  | 'REPORT_EQUIPMENT_ISSUE'  // Déclarer une panne
  | 'REQUEST_STAFF'           // Demander du personnel
  | 'SCHEDULE_MAINTENANCE'    // Planifier maintenance
  | 'ADD_EQUIPMENT'           // Ajouter un équipement
  | 'VIEW_MISSIONS'           // Voir les missions
  | 'VIEW_INVOICES';          // Voir les factures

export interface QuickAction {
  type: QuickActionType;
  label: string;
  description: string;
  icon: string;
  color: string;
  requiresEquipment: boolean;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    type: 'REPORT_EQUIPMENT_ISSUE',
    label: 'Déclarer une panne',
    description: 'Signaler un problème sur un équipement',
    icon: 'AlertTriangle',
    color: 'red',
    requiresEquipment: true,
  },
  {
    type: 'REQUEST_STAFF',
    label: 'Demander du personnel',
    description: 'Trouver un extra pour votre service',
    icon: 'Users',
    color: 'purple',
    requiresEquipment: false,
  },
  {
    type: 'SCHEDULE_MAINTENANCE',
    label: 'Planifier maintenance',
    description: 'Programmer une maintenance préventive',
    icon: 'Calendar',
    color: 'blue',
    requiresEquipment: true,
  },
  {
    type: 'ADD_EQUIPMENT',
    label: 'Ajouter équipement',
    description: 'Scanner ou ajouter une machine',
    icon: 'Plus',
    color: 'green',
    requiresEquipment: false,
  },
];

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType =
  | 'MISSION_MATCHED'         // Technicien trouvé
  | 'MISSION_ON_WAY'          // Technicien en route
  | 'MISSION_ARRIVED'         // Technicien arrivé
  | 'MISSION_COMPLETED'       // Mission terminée
  | 'INVOICE_READY'           // Facture disponible
  | 'EQUIPMENT_ALERT'         // Alerte équipement
  | 'MAINTENANCE_DUE';        // Maintenance à prévoir

export interface AppNotification {
  id: string;
  type: NotificationType;
  establishmentId: string;
  missionId?: string;
  equipmentId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ============================================================================
// HELPER: Convert legacy Mission to UnifiedMission
// ============================================================================

export function legacyMissionToUnified(
  mission: Mission,
  establishment: Venue,
  equipment?: Equipment
): UnifiedMission {
  return {
    id: mission.id,
    establishmentId: establishment.id,
    establishmentName: establishment.name,
    equipmentId: equipment?.id || null,
    equipmentName: equipment ? `${equipment.brand} ${equipment.model}` : undefined,
    equipmentCategory: equipment?.category,
    problemId: 'legacy',
    problemLabel: mission.title,
    problemDescription: mission.description,
    type: equipment ? 'EQUIPMENT_REPAIR' : 'STAFFING',
    status: mapLegacyStatus(mission.status),
    priority: mission.urgent ? 'URGENT' : 'NORMAL',
    createdAt: new Date().toISOString(),
    providerId: mission.provider?.id,
    providerName: mission.provider?.name || mission.expert,
    providerRating: mission.provider?.rating,
    estimatedPrice: {
      min: typeof mission.price === 'number' ? mission.price : parseInt(String(mission.price)) || 100,
      max: typeof mission.price === 'number' ? mission.price * 1.5 : (parseInt(String(mission.price)) || 100) * 1.5,
    },
    photos: mission.photos?.map(p => typeof p === 'string' ? p : p.url),
    requiredSkills: mission.skills || [],
  };
}

function mapLegacyStatus(status: Mission['status']): UnifiedMissionStatus {
  const mapping: Record<Mission['status'], UnifiedMissionStatus> = {
    'SEARCHING': 'SEARCHING',
    'SCHEDULED': 'SCHEDULED',
    'ON_WAY': 'ON_WAY',
    'ON_SITE': 'ON_SITE',
    'IN_PROGRESS': 'IN_PROGRESS',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
  };
  return mapping[status] || 'SEARCHING';
}

// ============================================================================
// HELPER: Create mission from equipment problem
// ============================================================================

export interface CreateMissionFromProblemParams {
  establishment: Venue;
  equipment: Equipment;
  problemId: string;
  problemLabel: string;
  problemSeverity: string;
  description?: string;
  photos?: string[];
  estimatedPrice: { min: number; max: number };
  requiredSkills: string[];
}

export function createMissionFromProblem(params: CreateMissionFromProblemParams): UnifiedMission {
  const priority = mapSeverityToPriority(params.problemSeverity);

  return {
    id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    establishmentId: params.establishment.id,
    establishmentName: params.establishment.name,
    equipmentId: params.equipment.id,
    equipmentName: `${params.equipment.brand} ${params.equipment.model}`,
    equipmentCategory: params.equipment.category,
    problemId: params.problemId,
    problemLabel: params.problemLabel,
    problemDescription: params.description,
    type: 'EQUIPMENT_REPAIR',
    status: 'SEARCHING',
    priority,
    createdAt: new Date().toISOString(),
    estimatedPrice: params.estimatedPrice,
    photos: params.photos,
    requiredSkills: params.requiredSkills,
  };
}

function mapSeverityToPriority(severity: string): UnifiedMissionPriority {
  const mapping: Record<string, UnifiedMissionPriority> = {
    'LOW': 'LOW',
    'MEDIUM': 'NORMAL',
    'HIGH': 'HIGH',
    'CRITICAL': 'EMERGENCY',
  };
  return mapping[severity] || 'NORMAL';
}

// ============================================================================
// FINANCIAL LAYER - Pricing, Quotes, Invoices
// ============================================================================

/**
 * TVA Rates for CHR services
 */
export type TVARate = 'STANDARD' | 'REDUCED' | 'SUPER_REDUCED';

export const TVA_RATES: Record<TVARate, number> = {
  STANDARD: 0.20,      // 20% - Services, pièces détachées
  REDUCED: 0.10,       // 10% - Travaux dans les locaux
  SUPER_REDUCED: 0.055 // 5.5% - Travaux amélioration énergétique
};

/**
 * Travel cost calculation zones
 */
export interface TravelZone {
  id: string;
  name: string;
  maxDistanceKm: number;
  baseFee: number;           // Forfait fixe
  perKmSurcharge: number;    // Surcharge par km au-delà
}

export const TRAVEL_ZONES: TravelZone[] = [
  { id: 'ZONE_1', name: 'Zone Proche', maxDistanceKm: 10, baseFee: 45, perKmSurcharge: 0 },
  { id: 'ZONE_2', name: 'Zone Intermédiaire', maxDistanceKm: 25, baseFee: 45, perKmSurcharge: 1.50 },
  { id: 'ZONE_3', name: 'Zone Éloignée', maxDistanceKm: 50, baseFee: 45, perKmSurcharge: 2.00 },
  { id: 'ZONE_4', name: 'Grande Distance', maxDistanceKm: Infinity, baseFee: 85, perKmSurcharge: 1.80 },
];

/**
 * Price breakdown for any calculation
 */
export interface PriceBreakdown {
  baseAmount: number;         // Montant de base
  distanceFee: number;        // Frais de déplacement
  laborCost: number;          // Main d'œuvre
  partsCost: number;          // Pièces détachées
  additionalFees: number;     // Frais supplémentaires (urgence, nuit, etc.)
  subtotalHT: number;         // Sous-total HT
  tvaRate: TVARate;
  tvaAmount: number;          // Montant TVA
  totalTTC: number;           // Total TTC
  platformFee: number;        // Commission plateforme
  providerNet: number;        // Net prestataire
}

/**
 * Quote item types
 */
export type QuoteItemType = 'LABOR' | 'PART' | 'TRAVEL' | 'DIAGNOSTIC' | 'EMERGENCY_FEE' | 'OTHER';

/**
 * Single line item in a quote
 */
export interface QuoteItem {
  id: string;
  type: QuoteItemType;
  reference?: string;          // Référence pièce ou code prestation
  description: string;
  quantity: number;
  unit: string;                // 'h', 'unité', 'km', 'forfait'
  unitPriceHT: number;
  tvaRate: TVARate;
  totalHT: number;
  totalTTC: number;
}

/**
 * Quote status
 */
export type QuoteStatus =
  | 'DRAFT'           // Brouillon
  | 'SENT'            // Envoyé au client
  | 'VIEWED'          // Vu par le client
  | 'ACCEPTED'        // Accepté
  | 'REJECTED'        // Refusé
  | 'EXPIRED'         // Expiré
  | 'INVOICED';       // Facturé

/**
 * Complete quote
 */
export interface Quote {
  id: string;
  missionId: string;
  providerId: string;
  providerName: string;

  // Client info
  clientId: string;
  clientName: string;
  establishmentId: string;
  establishmentName: string;
  establishmentAddress: string;

  // Quote details
  reference: string;           // Numéro de devis (ex: DEV-2024-001234)
  status: QuoteStatus;
  validityDays: number;        // Durée de validité en jours
  validUntil: string;          // Date d'expiration ISO

  // Items
  items: QuoteItem[];

  // Totals
  subtotalHT: number;
  totalTVA: number;
  totalTTC: number;

  // Platform fees
  platformFeeRate: number;     // Ex: 0.15 pour 15%
  platformFeeAmount: number;
  providerNetAmount: number;

  // Distance info (for travel costs)
  distanceKm?: number;
  travelZone?: string;

  // Notes
  notes?: string;
  termsAndConditions?: string;

  // Dates
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;

  // Signature
  clientSignature?: string;
  clientSignedAt?: string;
}

/**
 * Market rate analysis for staffing
 */
export type CompetitivenessScore = 'LOW' | 'BELOW_MARKET' | 'COMPETITIVE' | 'ABOVE_MARKET' | 'PREMIUM';

export interface MarketAnalysis {
  role: string;
  proposedRate: number;
  marketRateMin: number;
  marketRateMax: number;
  marketRateAvg: number;
  score: CompetitivenessScore;
  percentile: number;           // Position dans le marché (0-100)
  recommendation: string;       // Conseil pour le client
  attractivenessForProviders: 'LOW' | 'MEDIUM' | 'HIGH'; // Attractivité pour les prestataires
}

/**
 * Invoice (generated from accepted quote)
 */
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';

export interface Invoice {
  id: string;
  quoteId: string;
  missionId: string;
  reference: string;           // Numéro de facture (ex: FAC-2024-001234)

  // Copy of quote data at invoice time
  items: QuoteItem[];
  subtotalHT: number;
  totalTVA: number;
  totalTTC: number;

  // Payment
  status: InvoiceStatus;
  paymentDueDate: string;
  paymentMethod?: 'CARD' | 'TRANSFER' | 'CHECK' | 'CASH';
  paidAt?: string;
  paidAmount?: number;

  // Platform settlement
  platformFeeAmount: number;
  providerNetAmount: number;
  settledToProviderAt?: string;

  // Dates
  createdAt: string;
  sentAt?: string;
}

/**
 * Payment record
 */
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'CARD' | 'TRANSFER' | 'CHECK' | 'CASH';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  stripePaymentIntentId?: string;
  processedAt?: string;
  failureReason?: string;
}

// ============================================================================
// EXTENDED MISSION WITH FINANCIAL DATA
// ============================================================================

/**
 * Extended UnifiedMission with financial layer
 */
export interface MissionWithFinancials extends UnifiedMission {
  // Distance and travel
  distanceKm?: number;
  travelZone?: TravelZone;
  travelCost?: number;

  // Quotes
  quotes: Quote[];
  activeQuoteId?: string;
  acceptedQuoteId?: string;

  // Invoice
  invoiceId?: string;
  invoice?: Invoice;

  // Payment status
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

  // For staffing missions
  staffingFinancials?: {
    hourlyRate: number;
    estimatedHours: number;
    marketAnalysis: MarketAnalysis;
    totalEstimatedHT: number;
    totalEstimatedTTC: number;
  };
}

// ============================================================================
// FINANCIAL CONFIGURATION
// ============================================================================

export interface FinancialConfig {
  // Platform fees
  platformFeeRate: number;              // Default: 0.15 (15%)
  platformFeeMinimum: number;           // Minimum fee in euros

  // Travel zones
  travelZones: TravelZone[];

  // TVA defaults
  defaultTVARate: TVARate;
  laborTVARate: TVARate;
  partsTVARate: TVARate;

  // Quote settings
  defaultQuoteValidityDays: number;

  // Payment settings
  defaultPaymentTermsDays: number;

  // Staffing market rates (for analysis)
  staffingMarketRates: Record<string, { min: number; max: number; avg: number }>;
}

export const DEFAULT_FINANCIAL_CONFIG: FinancialConfig = {
  platformFeeRate: 0.15,
  platformFeeMinimum: 5,
  travelZones: TRAVEL_ZONES,
  defaultTVARate: 'STANDARD',
  laborTVARate: 'REDUCED',
  partsTVARate: 'STANDARD',
  defaultQuoteValidityDays: 30,
  defaultPaymentTermsDays: 30,
  staffingMarketRates: {
    'serveur': { min: 12, max: 18, avg: 14 },
    'chef_rang': { min: 15, max: 22, avg: 18 },
    'maitre_hotel': { min: 22, max: 35, avg: 28 },
    'barman': { min: 14, max: 20, avg: 16 },
    'mixologue': { min: 18, max: 28, avg: 22 },
    'sommelier': { min: 20, max: 35, avg: 26 },
    'chef_cuisine': { min: 30, max: 50, avg: 38 },
    'second_cuisine': { min: 22, max: 35, avg: 28 },
    'chef_partie': { min: 18, max: 28, avg: 22 },
    'commis': { min: 12, max: 16, avg: 14 },
    'plongeur': { min: 11, max: 14, avg: 12 },
    'agent_securite': { min: 15, max: 25, avg: 18 },
  }
};
