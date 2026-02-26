// ============================================================================
// QUOTE INTELLIGENCE SYSTEM - TYPES
// ============================================================================
// Système intelligent de validation des devis pour protéger les patrons HORECA
// Analyse : Pièces, Main d'œuvre, Prix marché, Historique

// ============================================================================
// PART IDENTIFICATION
// ============================================================================

export interface PartIdentification {
  // Input
  serialNumber?: string;
  modelNumber?: string;
  brand?: string;
  imageBase64?: string;
  manualQuery?: string;

  // OCR Result
  ocrExtracted?: {
    brand: string;
    model: string;
    serialNumber: string;
    rawText: string;
    confidence: number; // 0-100
  };
}

export interface IdentifiedPart {
  id: string;
  reference: string;           // Ex: "Danfoss SC15G"
  brand: string;               // Ex: "Danfoss"
  model: string;               // Ex: "SC15G"
  serialNumber?: string;

  // Enriched data from Perplexity
  fullName: string;            // Ex: "Compresseur hermétique Danfoss SC15G"
  description: string;         // Description technique complète
  category: PartCategory;
  specifications: PartSpecification[];

  // Images
  officialImageUrl?: string;
  userImageUrl?: string;

  // Market Data
  marketData: MarketPriceData;

  // Metadata
  identifiedAt: Date;
  source: 'OCR' | 'MANUAL' | 'DATABASE';
  confidence: number;          // 0-100
}

export type PartCategory =
  | 'COMPRESSOR'       // Compresseurs
  | 'THERMOSTAT'       // Thermostats
  | 'EVAPORATOR'       // Évaporateurs
  | 'CONDENSER'        // Condenseurs
  | 'FAN_MOTOR'        // Moteurs ventilateurs
  | 'GASKET'           // Joints
  | 'HEATING_ELEMENT'  // Résistances
  | 'VALVE'            // Vannes
  | 'SENSOR'           // Sondes/Capteurs
  | 'CONTROL_BOARD'    // Cartes électroniques
  | 'PUMP'             // Pompes
  | 'FILTER'           // Filtres
  | 'BURNER'           // Brûleurs
  | 'IGNITER'          // Allumeurs
  | 'OTHER';           // Autre

export interface PartSpecification {
  label: string;       // Ex: "Puissance"
  value: string;       // Ex: "1/2 CV"
  unit?: string;       // Ex: "CV"
}

// ============================================================================
// MARKET PRICE DATA
// ============================================================================

export interface MarketPriceData {
  // Price Range (HT - Hors Taxes)
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  medianPrice?: number;

  // Price Analysis
  priceVolatility: 'STABLE' | 'MODERATE' | 'VOLATILE';
  lastUpdated: Date;
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';

  // Sources
  sources: PriceSource[];
  sampleSize: number;          // Nombre de prix analysés

  // Regional Data
  regionalPrices?: {
    france: number;
    europe: number;
    worldwide?: number;
  };
}

export interface PriceSource {
  name: string;                // Ex: "Frigoriste-Pro.fr"
  url?: string;
  price: number;
  currency: 'EUR';
  isVerified: boolean;
  scrapedAt: Date;
}

// ============================================================================
// LABOR ANALYSIS
// ============================================================================

export interface LaborAnalysis {
  taskType: LaborTaskType;
  description: string;

  // Time Analysis
  quotedHours: number;
  marketHours: LaborTimeRange;
  timeVariance: number;        // % difference from market average

  // Rate Analysis
  quotedHourlyRate: number;
  marketHourlyRate: LaborRateRange;
  rateVariance: number;        // % difference from market average

  // Total Analysis
  quotedTotal: number;
  marketTotal: {
    min: number;
    max: number;
    average: number;
  };

  // Complexity Factors
  complexityFactors: ComplexityFactor[];
  adjustedMarketTotal?: {
    min: number;
    max: number;
    average: number;
  };

  // Verdict
  verdict: LaborVerdict;
}

export type LaborTaskType =
  | 'DIAGNOSTIC'           // Diagnostic initial
  | 'REPAIR_SIMPLE'        // Réparation simple
  | 'REPAIR_COMPLEX'       // Réparation complexe
  | 'REPLACEMENT'          // Remplacement pièce
  | 'INSTALLATION'         // Installation équipement
  | 'MAINTENANCE'          // Maintenance préventive
  | 'EMERGENCY'            // Intervention urgente
  | 'CALIBRATION';         // Calibration/Réglage

export interface LaborTimeRange {
  min: number;             // Heures
  max: number;
  average: number;
  typical: string;         // Ex: "2-3h pour ce type d'intervention"
}

export interface LaborRateRange {
  min: number;             // €/h HT
  max: number;
  average: number;
  regional: {
    paris: number;
    idf: number;
    province: number;
  };
}

export interface ComplexityFactor {
  id: string;
  label: string;           // Ex: "Accès difficile"
  impact: number;          // Multiplicateur (1.2 = +20%)
  isApplicable: boolean;
}

export type LaborVerdict = 'EXCELLENT' | 'FAIR' | 'HIGH' | 'EXCESSIVE';

// ============================================================================
// QUOTE ANALYSIS
// ============================================================================

export interface QuoteAnalysisRequest {
  quoteId: string;

  // Provider Info
  provider: {
    id: string;
    name: string;
    siret?: string;
  };

  // Quote Items
  items: QuoteItemForAnalysis[];

  // Totals
  subtotalHT: number;
  tva: number;
  totalTTC: number;

  // Context
  context?: {
    equipmentAge?: number;      // Années
    previousRepairs?: number;
    isUrgent?: boolean;
    location?: string;          // Pour ajustement régional
  };
}

export interface QuoteItemForAnalysis {
  id: string;
  type: 'PART' | 'LABOR' | 'TRAVEL' | 'OTHER' | 'CUSTOM';

  // For Parts
  part?: {
    reference?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    imageBase64?: string;
  };

  // For Labor
  labor?: {
    taskType: LaborTaskType;
    description: string;
    hours: number;
  };

  // Common
  description: string;
  quantity: number;
  unitPriceHT: number;
  totalHT: number;
}

// ============================================================================
// ANALYSIS RESULTS
// ============================================================================

export interface QuoteAnalysisResult {
  quoteId: string;
  analyzedAt: Date;

  // Global Score
  globalScore: TrustScore;

  // Item Analysis
  itemAnalysis: ItemAnalysisResult[];

  // Summary
  summary: AnalysisSummary;

  // Recommendations
  recommendations: Recommendation[];

  // Comparison with History
  historicalComparison?: HistoricalComparison;

  // Detailed Breakdown
  breakdown: {
    partsScore: number;
    laborScore: number;
    travelScore: number;
    overallFairness: number;
  };
}

export interface TrustScore {
  score: number;               // 0-100
  level: TrustLevel;
  emoji: string;               // Pour UI
  color: string;               // Tailwind color
  label: string;               // Ex: "Devis conforme"
  shortMessage: string;        // Message court
  detailedMessage: string;     // Explication détaillée
}

export type TrustLevel =
  | 'EXCELLENT'    // 85-100 : Prix très compétitif
  | 'GOOD'         // 70-84  : Prix correct
  | 'FAIR'         // 55-69  : Prix acceptable
  | 'HIGH'         // 40-54  : Prix élevé
  | 'SUSPICIOUS'   // 0-39   : Prix suspect
  ;

export interface ItemAnalysisResult {
  itemId: string;
  type: 'PART' | 'LABOR' | 'TRAVEL' | 'OTHER' | 'CUSTOM';

  // Identification (for parts)
  identifiedPart?: IdentifiedPart;

  // Labor Analysis
  laborAnalysis?: LaborAnalysis;

  // Price Comparison
  quotedPrice: number;
  marketPrice: {
    min: number;
    max: number;
    average: number;
  };
  variance: number;            // % par rapport à la moyenne

  // Item Score
  score: number;               // 0-100
  verdict: ItemVerdict;

  // Flags
  flags: AnalysisFlag[];
}

export type ItemVerdict =
  | 'EXCELLENT'    // Bien en dessous du marché
  | 'GOOD'         // Légèrement sous la moyenne
  | 'FAIR'         // Dans la moyenne
  | 'HIGH'         // Au-dessus de la moyenne
  | 'VERY_HIGH'    // Bien au-dessus
  | 'SUSPICIOUS'   // Anormalement élevé ou bas
  ;

export interface AnalysisFlag {
  type: FlagType;
  severity: 'INFO' | 'WARNING' | 'ALERT';
  message: string;
  suggestion?: string;
}

export type FlagType =
  | 'PRICE_HIGH'           // Prix au-dessus du marché
  | 'PRICE_LOW'            // Prix suspicieusement bas
  | 'LABOR_EXCESSIVE'      // Temps de MO excessif
  | 'LABOR_RATE_HIGH'      // Taux horaire élevé
  | 'UNKNOWN_PART'         // Pièce non reconnue
  | 'NO_REFERENCE'         // Pas de référence fournie
  | 'DUPLICATE_ITEM'       // Item en double
  | 'MISSING_WARRANTY'     // Garantie non mentionnée
  | 'EMERGENCY_MARKUP'     // Surcharge urgence
  | 'HISTORICAL_ANOMALY'   // Écart avec historique
  ;

// ============================================================================
// SUMMARY & RECOMMENDATIONS
// ============================================================================

export interface AnalysisSummary {
  // Totals Comparison
  quotedTotal: number;
  estimatedMarketTotal: {
    min: number;
    max: number;
    average: number;
  };
  potentialSavings: number;    // Si le patron négocie

  // Stats
  itemsAnalyzed: number;
  itemsWithIssues: number;

  // Key Insights
  keyInsights: string[];       // Points clés en français

  // Quick Stats
  partsOverpriced: number;
  laborOverpriced: number;
  fairlyPriced: number;
}

export interface Recommendation {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  type: RecommendationType;
  title: string;
  description: string;
  potentialImpact?: number;    // Économie potentielle en €
  actionable: boolean;
}

export type RecommendationType =
  | 'NEGOTIATE_PRICE'      // Négocier le prix
  | 'REQUEST_DETAILS'      // Demander plus de détails
  | 'COMPARE_QUOTES'       // Comparer avec d'autres devis
  | 'VERIFY_REFERENCE'     // Vérifier la référence pièce
  | 'CHECK_WARRANTY'       // Vérifier la garantie
  | 'CONSIDER_ALTERNATIVE' // Considérer alternative
  | 'APPROVE'              // Approuver le devis
  ;

// ============================================================================
// HISTORICAL DATA
// ============================================================================

export interface HistoricalComparison {
  // Same Part/Service History
  previousPurchases: PreviousPurchase[];

  // Trend
  priceTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  averageHistoricalPrice: number;

  // Provider History
  providerHistory?: {
    previousQuotes: number;
    averageVariance: number;   // % vs marché
    reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export interface PreviousPurchase {
  date: Date;
  reference: string;
  pricePaid: number;
  provider: string;
  wasNegotiated: boolean;
}

// ============================================================================
// PRICE DATABASE
// ============================================================================

export interface PriceDatabaseEntry {
  id: string;

  // Part Identification
  reference: string;
  brand: string;
  model: string;
  category: PartCategory;

  // Normalized Name (for matching)
  normalizedName: string;
  keywords: string[];

  // Price Data
  prices: RecordedPrice[];
  currentMarketData: MarketPriceData;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  timesQueried: number;
  lastVerifiedAt: Date;
}

export interface RecordedPrice {
  id: string;
  price: number;
  source: 'USER_QUOTE' | 'WEB_SCRAPE' | 'MANUAL_ENTRY' | 'API';
  sourceName?: string;
  recordedAt: Date;
  location?: string;
  isVerified: boolean;
}

// ============================================================================
// API INTERFACES
// ============================================================================

export interface IdentifyPartRequest {
  image?: string;              // Base64
  query?: string;              // Manual query
  serialNumber?: string;
  saveToDatabase?: boolean;    // Save to local DB
}

export interface IdentifyPartResponse {
  success: boolean;
  part?: IdentifiedPart;
  fromDatabase: boolean;       // Found in local DB
  error?: string;
}

export interface AnalyzeQuoteRequest {
  quote: QuoteAnalysisRequest;
  options?: {
    deepAnalysis?: boolean;    // More thorough analysis
    includeHistory?: boolean;  // Include historical comparison
    region?: string;           // For regional pricing
  };
}

export interface AnalyzeQuoteResponse {
  success: boolean;
  analysis?: QuoteAnalysisResult;
  error?: string;
}
