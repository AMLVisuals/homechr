// ============================================================================
// FINANCIAL ENGINE - Moteur de calcul financier centralisé
// ============================================================================
// Single Source of Truth pour tous les calculs de prix, devis et factures.
// Ce module est PUR (sans effet de bord) et indépendant de l'UI.
// ============================================================================

import type {
  TVARate,
  TravelZone,
  PriceBreakdown,
  QuoteItem,
  QuoteItemType,
  Quote,
  MarketAnalysis,
  CompetitivenessScore,
  FinancialConfig,
} from '@/types/unified';

import {
  TVA_RATES,
  TRAVEL_ZONES,
  DEFAULT_FINANCIAL_CONFIG,
} from '@/types/unified';

// ============================================================================
// CONFIGURATION
// ============================================================================

let config: FinancialConfig = DEFAULT_FINANCIAL_CONFIG;

/**
 * Update financial configuration
 */
export function setFinancialConfig(newConfig: Partial<FinancialConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get current configuration
 */
export function getFinancialConfig(): FinancialConfig {
  return { ...config };
}

// ============================================================================
// TRAVEL COST CALCULATION
// ============================================================================

/**
 * Get the appropriate travel zone for a given distance
 */
export function getTravelZone(distanceKm: number): TravelZone {
  const zones = config.travelZones;

  // Sort zones by maxDistanceKm to ensure correct selection
  const sortedZones = [...zones].sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);

  for (const zone of sortedZones) {
    if (distanceKm <= zone.maxDistanceKm) {
      return zone;
    }
  }

  // Return the last zone (infinite) if no match
  return sortedZones[sortedZones.length - 1];
}

/**
 * Calculate travel cost based on distance
 */
export function calculateTravelCost(distanceKm: number): {
  zone: TravelZone;
  baseFee: number;
  distanceSurcharge: number;
  totalHT: number;
  totalTTC: number;
  breakdown: string;
} {
  const zone = getTravelZone(distanceKm);

  // Base fee is always applied
  const baseFee = zone.baseFee;

  // Calculate surcharge for km beyond zone threshold
  let distanceSurcharge = 0;
  let previousZoneMax = 0;

  // Find the previous zone's max to calculate extra km
  const sortedZones = [...config.travelZones].sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);
  const zoneIndex = sortedZones.findIndex(z => z.id === zone.id);

  if (zoneIndex > 0) {
    previousZoneMax = sortedZones[zoneIndex - 1].maxDistanceKm;
  }

  // Calculate surcharge for km beyond the base zone
  if (distanceKm > previousZoneMax && zone.perKmSurcharge > 0) {
    const extraKm = distanceKm - previousZoneMax;
    distanceSurcharge = Math.ceil(extraKm) * zone.perKmSurcharge;
  }

  const totalHT = baseFee + distanceSurcharge;
  const tvaRate = TVA_RATES[config.defaultTVARate];
  const totalTTC = roundPrice(totalHT * (1 + tvaRate));

  // Generate breakdown description
  let breakdown = `Forfait déplacement ${zone.name}: ${baseFee}€`;
  if (distanceSurcharge > 0) {
    breakdown += ` + ${Math.ceil(distanceKm - previousZoneMax)}km × ${zone.perKmSurcharge}€ = ${distanceSurcharge}€`;
  }

  return {
    zone,
    baseFee,
    distanceSurcharge,
    totalHT,
    totalTTC,
    breakdown,
  };
}

// ============================================================================
// QUOTE ITEM CALCULATIONS
// ============================================================================

/**
 * Create a new quote item with calculated totals
 */
export function createQuoteItem(params: {
  type: QuoteItemType;
  description: string;
  quantity: number;
  unit: string;
  unitPriceHT: number;
  tvaRate?: TVARate;
  reference?: string;
}): QuoteItem {
  // Determine TVA rate based on item type if not provided
  const tvaRate = params.tvaRate || getDefaultTVAForItemType(params.type);
  const tvaMultiplier = TVA_RATES[tvaRate];

  const totalHT = roundPrice(params.quantity * params.unitPriceHT);
  const totalTTC = roundPrice(totalHT * (1 + tvaMultiplier));

  return {
    id: generateItemId(),
    type: params.type,
    reference: params.reference,
    description: params.description,
    quantity: params.quantity,
    unit: params.unit,
    unitPriceHT: params.unitPriceHT,
    tvaRate,
    totalHT,
    totalTTC,
  };
}

/**
 * Create a travel item from distance
 */
export function createTravelItem(distanceKm: number): QuoteItem {
  const travel = calculateTravelCost(distanceKm);

  return createQuoteItem({
    type: 'TRAVEL',
    description: `Déplacement ${travel.zone.name} (${Math.round(distanceKm)}km)`,
    quantity: 1,
    unit: 'forfait',
    unitPriceHT: travel.totalHT,
  });
}

/**
 * Create a labor item
 */
export function createLaborItem(params: {
  description: string;
  hours: number;
  hourlyRateHT: number;
}): QuoteItem {
  return createQuoteItem({
    type: 'LABOR',
    description: params.description,
    quantity: params.hours,
    unit: 'h',
    unitPriceHT: params.hourlyRateHT,
    tvaRate: config.laborTVARate,
  });
}

/**
 * Create a parts item
 */
export function createPartItem(params: {
  reference: string;
  description: string;
  quantity: number;
  unitPriceHT: number;
}): QuoteItem {
  return createQuoteItem({
    type: 'PART',
    reference: params.reference,
    description: params.description,
    quantity: params.quantity,
    unit: 'unité',
    unitPriceHT: params.unitPriceHT,
    tvaRate: config.partsTVARate,
  });
}

/**
 * Get default TVA rate for item type
 */
function getDefaultTVAForItemType(type: QuoteItemType): TVARate {
  switch (type) {
    case 'LABOR':
      return config.laborTVARate;
    case 'PART':
      return config.partsTVARate;
    case 'TRAVEL':
    case 'DIAGNOSTIC':
    case 'EMERGENCY_FEE':
    case 'OTHER':
    default:
      return config.defaultTVARate;
  }
}

// ============================================================================
// QUOTE TOTAL CALCULATIONS
// ============================================================================

export interface QuoteTotal {
  items: QuoteItem[];
  subtotalHT: number;
  tvaBreakdown: { rate: TVARate; baseHT: number; tvaAmount: number }[];
  totalTVA: number;
  totalTTC: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  providerNetAmount: number;
}

/**
 * Calculate complete quote totals from items
 */
export function calculateQuoteTotal(items: QuoteItem[]): QuoteTotal {
  // Calculate subtotal HT
  const subtotalHT = items.reduce((sum, item) => sum + item.totalHT, 0);

  // Group by TVA rate and calculate
  const tvaGroups = new Map<TVARate, number>();

  for (const item of items) {
    const current = tvaGroups.get(item.tvaRate) || 0;
    tvaGroups.set(item.tvaRate, current + item.totalHT);
  }

  // Calculate TVA for each rate
  const tvaBreakdown: QuoteTotal['tvaBreakdown'] = [];
  let totalTVA = 0;

  for (const [rate, baseHT] of tvaGroups.entries()) {
    const tvaAmount = roundPrice(baseHT * TVA_RATES[rate]);
    totalTVA += tvaAmount;
    tvaBreakdown.push({ rate, baseHT: roundPrice(baseHT), tvaAmount });
  }

  totalTVA = roundPrice(totalTVA);
  const totalTTC = roundPrice(subtotalHT + totalTVA);

  // Calculate platform fee
  const platformFeeRate = config.platformFeeRate;
  let platformFeeAmount = roundPrice(subtotalHT * platformFeeRate);

  // Apply minimum fee
  if (platformFeeAmount < config.platformFeeMinimum) {
    platformFeeAmount = config.platformFeeMinimum;
  }

  const providerNetAmount = roundPrice(subtotalHT - platformFeeAmount);

  return {
    items,
    subtotalHT: roundPrice(subtotalHT),
    tvaBreakdown,
    totalTVA,
    totalTTC,
    platformFeeRate,
    platformFeeAmount,
    providerNetAmount,
  };
}

/**
 * Calculate mission total with all components
 */
export function calculateMissionTotal(params: {
  laborItems: { description: string; hours: number; hourlyRateHT: number }[];
  partItems: { reference: string; description: string; quantity: number; unitPriceHT: number }[];
  distanceKm?: number;
  includeEmergencyFee?: boolean;
  emergencyFeeHT?: number;
}): QuoteTotal {
  const items: QuoteItem[] = [];

  // Add travel if distance provided
  if (params.distanceKm && params.distanceKm > 0) {
    items.push(createTravelItem(params.distanceKm));
  }

  // Add labor items
  for (const labor of params.laborItems) {
    items.push(createLaborItem(labor));
  }

  // Add parts
  for (const part of params.partItems) {
    items.push(createPartItem(part));
  }

  // Add emergency fee if applicable
  if (params.includeEmergencyFee) {
    items.push(createQuoteItem({
      type: 'EMERGENCY_FEE',
      description: 'Majoration intervention urgente',
      quantity: 1,
      unit: 'forfait',
      unitPriceHT: params.emergencyFeeHT || 50,
    }));
  }

  return calculateQuoteTotal(items);
}

// ============================================================================
// STAFFING RATE ANALYSIS
// ============================================================================

/**
 * Analyze a proposed staffing rate against market data
 */
export function analyzeStaffingRate(
  proposedRate: number,
  role: string
): MarketAnalysis {
  // Get market data for the role
  const marketData = config.staffingMarketRates[role] || {
    min: 11,
    max: 25,
    avg: 15,
  };

  const { min, max, avg } = marketData;
  const range = max - min;

  // Calculate percentile (0-100)
  let percentile: number;
  if (proposedRate <= min) {
    percentile = 0;
  } else if (proposedRate >= max) {
    percentile = 100;
  } else {
    percentile = Math.round(((proposedRate - min) / range) * 100);
  }

  // Determine competitiveness score
  let score: CompetitivenessScore;
  let recommendation: string;
  let attractivenessForProviders: 'LOW' | 'MEDIUM' | 'HIGH';

  if (proposedRate < min * 0.9) {
    score = 'LOW';
    recommendation = `Votre taux est inférieur au marché. Risque de ne pas trouver de candidat qualifié. Nous recommandons au minimum ${min}€/h.`;
    attractivenessForProviders = 'LOW';
  } else if (proposedRate < avg * 0.95) {
    score = 'BELOW_MARKET';
    recommendation = `Taux légèrement en dessous de la moyenne du marché (${avg}€/h). Vous pourriez avoir moins de candidatures.`;
    attractivenessForProviders = 'LOW';
  } else if (proposedRate <= avg * 1.1) {
    score = 'COMPETITIVE';
    recommendation = `Excellent ! Votre taux est compétitif et dans la moyenne du marché. Vous devriez recevoir de bonnes candidatures.`;
    attractivenessForProviders = 'MEDIUM';
  } else if (proposedRate <= max) {
    score = 'ABOVE_MARKET';
    recommendation = `Très attractif ! Votre taux est au-dessus de la moyenne. Attendez-vous à des candidatures de qualité.`;
    attractivenessForProviders = 'HIGH';
  } else {
    score = 'PREMIUM';
    recommendation = `Taux premium ! Vous attirerez les meilleurs profils du marché.`;
    attractivenessForProviders = 'HIGH';
  }

  return {
    role,
    proposedRate,
    marketRateMin: min,
    marketRateMax: max,
    marketRateAvg: avg,
    score,
    percentile,
    recommendation,
    attractivenessForProviders,
  };
}

/**
 * Calculate staffing mission total
 */
export function calculateStaffingTotal(params: {
  hourlyRate: number;
  estimatedHours: number;
  numberOfPeople: number;
  role: string;
}): {
  marketAnalysis: MarketAnalysis;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  platformFeeAmount: number;
  providerNetAmount: number;
} {
  const marketAnalysis = analyzeStaffingRate(params.hourlyRate, params.role);

  const totalHT = roundPrice(
    params.hourlyRate * params.estimatedHours * params.numberOfPeople
  );

  const tvaRate = TVA_RATES[config.defaultTVARate];
  const totalTVA = roundPrice(totalHT * tvaRate);
  const totalTTC = roundPrice(totalHT + totalTVA);

  const platformFeeAmount = Math.max(
    roundPrice(totalHT * config.platformFeeRate),
    config.platformFeeMinimum
  );

  const providerNetAmount = roundPrice(totalHT - platformFeeAmount);

  return {
    marketAnalysis,
    totalHT,
    totalTVA,
    totalTTC,
    platformFeeAmount,
    providerNetAmount,
  };
}

// ============================================================================
// FULL PRICE BREAKDOWN
// ============================================================================

/**
 * Generate a complete price breakdown for a mission
 */
export function generatePriceBreakdown(params: {
  baseAmount?: number;
  distanceKm?: number;
  laborCost?: number;
  partsCost?: number;
  additionalFees?: number;
  tvaRate?: TVARate;
  isUrgent?: boolean;
}): PriceBreakdown {
  const {
    baseAmount = 0,
    distanceKm = 0,
    laborCost = 0,
    partsCost = 0,
    additionalFees = 0,
    tvaRate = config.defaultTVARate,
    isUrgent = false,
  } = params;

  // Calculate travel if distance provided
  let distanceFee = 0;
  if (distanceKm > 0) {
    const travel = calculateTravelCost(distanceKm);
    distanceFee = travel.totalHT;
  }

  // Add urgency fee if applicable
  let urgencyFee = 0;
  if (isUrgent) {
    urgencyFee = 50; // Fixed urgency fee
  }

  const subtotalHT = roundPrice(
    baseAmount + distanceFee + laborCost + partsCost + additionalFees + urgencyFee
  );

  const tvaMultiplier = TVA_RATES[tvaRate];
  const tvaAmount = roundPrice(subtotalHT * tvaMultiplier);
  const totalTTC = roundPrice(subtotalHT + tvaAmount);

  // Platform fee
  const platformFee = Math.max(
    roundPrice(subtotalHT * config.platformFeeRate),
    config.platformFeeMinimum
  );

  const providerNet = roundPrice(subtotalHT - platformFee);

  return {
    baseAmount,
    distanceFee,
    laborCost,
    partsCost,
    additionalFees: additionalFees + urgencyFee,
    subtotalHT,
    tvaRate,
    tvaAmount,
    totalTTC,
    platformFee,
    providerNet,
  };
}

// ============================================================================
// QUOTE GENERATION
// ============================================================================

/**
 * Generate a quote reference number
 */
export function generateQuoteReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `DEV-${year}-${random}`;
}

/**
 * Generate an invoice reference number
 */
export function generateInvoiceReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `FAC-${year}-${random}`;
}

/**
 * Calculate quote validity date
 */
export function calculateQuoteValidUntil(validityDays?: number): string {
  const days = validityDays || config.defaultQuoteValidityDays;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Create a new quote from items
 */
export function createQuote(params: {
  missionId: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  establishmentId: string;
  establishmentName: string;
  establishmentAddress: string;
  items: QuoteItem[];
  distanceKm?: number;
  notes?: string;
  validityDays?: number;
}): Quote {
  const totals = calculateQuoteTotal(params.items);
  const validUntil = calculateQuoteValidUntil(params.validityDays);

  return {
    id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    missionId: params.missionId,
    providerId: params.providerId,
    providerName: params.providerName,
    clientId: params.clientId,
    clientName: params.clientName,
    establishmentId: params.establishmentId,
    establishmentName: params.establishmentName,
    establishmentAddress: params.establishmentAddress,
    reference: generateQuoteReference(),
    status: 'DRAFT',
    validityDays: params.validityDays || config.defaultQuoteValidityDays,
    validUntil,
    items: params.items,
    subtotalHT: totals.subtotalHT,
    totalTVA: totals.totalTVA,
    totalTTC: totals.totalTTC,
    platformFeeRate: totals.platformFeeRate,
    platformFeeAmount: totals.platformFeeAmount,
    providerNetAmount: totals.providerNetAmount,
    distanceKm: params.distanceKm,
    notes: params.notes,
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Round price to 2 decimal places
 */
function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Generate a unique item ID
 */
function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Format price for display (French locale)
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format TVA rate for display
 */
export function formatTVARate(rate: TVARate): string {
  const percentage = TVA_RATES[rate] * 100;
  return `${percentage}%`;
}

/**
 * Get TVA rate label
 */
export function getTVARateLabel(rate: TVARate): string {
  const labels: Record<TVARate, string> = {
    STANDARD: 'TVA 20%',
    REDUCED: 'TVA 10%',
    SUPER_REDUCED: 'TVA 5.5%',
  };
  return labels[rate];
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate quote items
 */
export function validateQuoteItems(items: QuoteItem[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('Le devis doit contenir au moins une ligne.');
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      errors.push(`La quantité de "${item.description}" doit être positive.`);
    }
    if (item.unitPriceHT < 0) {
      errors.push(`Le prix unitaire de "${item.description}" ne peut pas être négatif.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const FinancialEngine = {
  // Configuration
  setConfig: setFinancialConfig,
  getConfig: getFinancialConfig,

  // Travel
  getTravelZone,
  calculateTravelCost,

  // Quote items
  createQuoteItem,
  createTravelItem,
  createLaborItem,
  createPartItem,

  // Calculations
  calculateQuoteTotal,
  calculateMissionTotal,
  analyzeStaffingRate,
  calculateStaffingTotal,
  generatePriceBreakdown,

  // Quote generation
  createQuote,
  generateQuoteReference,
  generateInvoiceReference,
  calculateQuoteValidUntil,

  // Formatting
  formatPrice,
  formatTVARate,
  getTVARateLabel,

  // Validation
  validateQuoteItems,
};

export default FinancialEngine;
