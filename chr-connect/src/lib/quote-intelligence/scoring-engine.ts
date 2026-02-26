// ============================================================================
// QUOTE INTELLIGENCE - SCORING ENGINE
// ============================================================================
// Algorithme intelligent de scoring et validation des devis
// Analyse : Prix pièces, Main d'œuvre, Déplacements, Historique

import type {
  QuoteAnalysisResult,
  QuoteAnalysisRequest,
  ItemAnalysisResult,
  TrustScore,
  TrustLevel,
  AnalysisSummary,
  Recommendation,
  AnalysisFlag,
  ItemVerdict,
  LaborAnalysis,
  LaborTaskType,
  LaborTimeRange,
  LaborRateRange,
  LaborVerdict,
  ComplexityFactor,
  IdentifiedPart,
  MarketPriceData,
  HistoricalComparison,
} from './types';
import { PriceDatabase } from './price-database';

// ============================================================================
// LABOR MARKET DATA
// ============================================================================

/**
 * Données de référence pour le temps de main d'œuvre par type de tâche
 * Basées sur les standards du marché HORECA français
 */
const LABOR_TIME_STANDARDS: Record<LaborTaskType, LaborTimeRange> = {
  DIAGNOSTIC: {
    min: 0.5,
    max: 1.5,
    average: 1,
    typical: '30min à 1h30 selon complexité',
  },
  REPAIR_SIMPLE: {
    min: 0.5,
    max: 2,
    average: 1,
    typical: '30min à 2h pour une réparation simple',
  },
  REPAIR_COMPLEX: {
    min: 2,
    max: 6,
    average: 3.5,
    typical: '2h à 6h pour une réparation complexe',
  },
  REPLACEMENT: {
    min: 1,
    max: 4,
    average: 2,
    typical: '1h à 4h pour un remplacement de pièce',
  },
  INSTALLATION: {
    min: 2,
    max: 8,
    average: 4,
    typical: '2h à 8h pour une installation',
  },
  MAINTENANCE: {
    min: 1,
    max: 3,
    average: 1.5,
    typical: '1h à 3h pour une maintenance préventive',
  },
  EMERGENCY: {
    min: 1,
    max: 4,
    average: 2,
    typical: '1h à 4h pour une intervention urgente',
  },
  CALIBRATION: {
    min: 0.5,
    max: 2,
    average: 1,
    typical: '30min à 2h pour un réglage/calibration',
  },
};

/**
 * Taux horaires de référence par région (€/h HT)
 */
const LABOR_RATE_STANDARDS: LaborRateRange = {
  min: 45,
  max: 95,
  average: 65,
  regional: {
    paris: 85,       // Paris intra-muros
    idf: 75,         // Île-de-France
    province: 55,    // Province
  },
};

/**
 * Facteurs de complexité qui justifient un surcoût
 */
const COMPLEXITY_FACTORS: ComplexityFactor[] = [
  { id: 'access_difficult', label: 'Accès difficile', impact: 1.2, isApplicable: false },
  { id: 'night_work', label: 'Travail de nuit', impact: 1.5, isApplicable: false },
  { id: 'weekend', label: 'Week-end/Jour férié', impact: 1.5, isApplicable: false },
  { id: 'hazardous', label: 'Zone dangereuse', impact: 1.3, isApplicable: false },
  { id: 'height', label: 'Travail en hauteur', impact: 1.25, isApplicable: false },
  { id: 'confined', label: 'Espace confiné', impact: 1.3, isApplicable: false },
  { id: 'old_equipment', label: 'Équipement ancien (>10 ans)', impact: 1.15, isApplicable: false },
  { id: 'rare_brand', label: 'Marque rare/obsolète', impact: 1.2, isApplicable: false },
];

/**
 * Frais de déplacement standards par zone
 */
const TRAVEL_STANDARDS = {
  local: { max: 15, rate: 45 },      // 0-15km : forfait 45€
  zone1: { max: 30, rate: 65 },      // 15-30km : 65€
  zone2: { max: 50, rate: 85 },      // 30-50km : 85€
  zone3: { max: 100, rate: 120 },    // 50-100km : 120€
  perKmBeyond: 0.85,                 // Au-delà : 0.85€/km
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calcule le score de confiance global (0-100)
 */
function calculateGlobalScore(itemResults: ItemAnalysisResult[]): TrustScore {
  if (itemResults.length === 0) {
    return createTrustScore(50, 'FAIR');
  }

  // Weighted average based on item prices
  let totalWeight = 0;
  let weightedScore = 0;

  for (const item of itemResults) {
    const weight = item.quotedPrice;
    totalWeight += weight;
    weightedScore += item.score * weight;
  }

  const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 50;

  // Determine level based on score
  let level: TrustLevel;
  if (score >= 85) level = 'EXCELLENT';
  else if (score >= 70) level = 'GOOD';
  else if (score >= 55) level = 'FAIR';
  else if (score >= 40) level = 'HIGH';
  else level = 'SUSPICIOUS';

  return createTrustScore(score, level);
}

/**
 * Crée un objet TrustScore complet
 */
function createTrustScore(score: number, level: TrustLevel): TrustScore {
  const configs: Record<TrustLevel, {
    emoji: string;
    color: string;
    label: string;
    shortMessage: string;
    detailedMessage: string;
  }> = {
    EXCELLENT: {
      emoji: '🌟',
      color: 'text-green-400',
      label: 'Excellent',
      shortMessage: 'Prix très compétitif',
      detailedMessage: 'Ce devis est bien en dessous des prix du marché. Le prestataire propose des tarifs très avantageux.',
    },
    GOOD: {
      emoji: '✅',
      color: 'text-green-500',
      label: 'Bon',
      shortMessage: 'Prix correct',
      detailedMessage: 'Ce devis est conforme aux prix du marché. Les tarifs sont raisonnables et justifiés.',
    },
    FAIR: {
      emoji: '👍',
      color: 'text-yellow-500',
      label: 'Acceptable',
      shortMessage: 'Prix dans la moyenne',
      detailedMessage: 'Ce devis est dans la fourchette haute du marché. Vous pouvez tenter une légère négociation.',
    },
    HIGH: {
      emoji: '⚠️',
      color: 'text-orange-500',
      label: 'Élevé',
      shortMessage: 'Prix au-dessus du marché',
      detailedMessage: 'Ce devis est significativement au-dessus des prix du marché. Nous vous recommandons de négocier ou demander d\'autres devis.',
    },
    SUSPICIOUS: {
      emoji: '🚨',
      color: 'text-red-500',
      label: 'Suspect',
      shortMessage: 'Prix anormal',
      detailedMessage: 'Ce devis présente des prix très éloignés du marché. Vérifiez les références et demandez des justifications.',
    },
  };

  return {
    score,
    level,
    ...configs[level],
  };
}

/**
 * Analyse un item de type PIÈCE
 */
function analyzePartItem(
  item: {
    id: string;
    description: string;
    unitPriceHT: number;
    quantity: number;
    totalHT: number;
    part?: {
      reference?: string;
      brand?: string;
      model?: string;
    };
  },
  identifiedPart?: IdentifiedPart
): ItemAnalysisResult {
  const flags: AnalysisFlag[] = [];
  let score = 50; // Default neutral score
  let marketPrice = { min: 0, max: 0, average: 0 };

  // Check if we have market data
  if (identifiedPart?.marketData) {
    marketPrice = {
      min: identifiedPart.marketData.minPrice,
      max: identifiedPart.marketData.maxPrice,
      average: identifiedPart.marketData.averagePrice,
    };
  } else if (item.part?.reference) {
    // Try to find in local database
    const dbEntry = PriceDatabase.find({ reference: item.part.reference });
    if (dbEntry) {
      marketPrice = {
        min: dbEntry.currentMarketData.minPrice,
        max: dbEntry.currentMarketData.maxPrice,
        average: dbEntry.currentMarketData.averagePrice,
      };
    }
  }

  // Calculate variance from market
  const variance = marketPrice.average > 0
    ? ((item.unitPriceHT - marketPrice.average) / marketPrice.average) * 100
    : 0;

  // Determine verdict and score
  let verdict: ItemVerdict;

  if (marketPrice.average === 0) {
    // No market data
    verdict = 'FAIR';
    score = 50;
    flags.push({
      type: 'UNKNOWN_PART',
      severity: 'WARNING',
      message: 'Pièce non référencée dans notre base',
      suggestion: 'Vérifiez la référence exacte pour une meilleure analyse',
    });
  } else if (variance <= -15) {
    verdict = 'EXCELLENT';
    score = 95;
  } else if (variance <= -5) {
    verdict = 'GOOD';
    score = 85;
  } else if (variance <= 10) {
    verdict = 'FAIR';
    score = 70;
  } else if (variance <= 25) {
    verdict = 'HIGH';
    score = 50;
    flags.push({
      type: 'PRICE_HIGH',
      severity: 'WARNING',
      message: `Prix ${Math.round(variance)}% au-dessus de la moyenne`,
      suggestion: 'Négociez ou demandez une justification',
    });
  } else if (variance <= 50) {
    verdict = 'VERY_HIGH';
    score = 30;
    flags.push({
      type: 'PRICE_HIGH',
      severity: 'ALERT',
      message: `Prix ${Math.round(variance)}% au-dessus du marché`,
      suggestion: 'Prix excessif - demandez d\'autres devis',
    });
  } else {
    verdict = 'SUSPICIOUS';
    score = 15;
    flags.push({
      type: 'PRICE_HIGH',
      severity: 'ALERT',
      message: `Prix anormalement élevé (+${Math.round(variance)}%)`,
      suggestion: 'Ce prix est suspect. Vérifiez l\'authenticité de la pièce.',
    });
  }

  // Check for suspiciously low prices
  if (variance < -40 && marketPrice.average > 0) {
    flags.push({
      type: 'PRICE_LOW',
      severity: 'WARNING',
      message: 'Prix anormalement bas',
      suggestion: 'Vérifiez la qualité et l\'origine de la pièce',
    });
  }

  // Check for missing reference
  if (!item.part?.reference && !item.part?.brand) {
    flags.push({
      type: 'NO_REFERENCE',
      severity: 'INFO',
      message: 'Aucune référence fournie',
      suggestion: 'Demandez la référence exacte pour vérification',
    });
  }

  return {
    itemId: item.id,
    type: 'PART',
    identifiedPart,
    quotedPrice: item.unitPriceHT,
    marketPrice,
    variance: Math.round(variance * 10) / 10,
    score,
    verdict,
    flags,
  };
}

/**
 * Analyse un item de type MAIN D'ŒUVRE
 */
function analyzeLaborItem(
  item: {
    id: string;
    description: string;
    unitPriceHT: number; // Taux horaire
    quantity: number;    // Heures
    totalHT: number;
    labor?: {
      taskType: LaborTaskType;
      description: string;
      hours: number;
    };
  },
  region: 'paris' | 'idf' | 'province' = 'province'
): ItemAnalysisResult {
  const flags: AnalysisFlag[] = [];
  const taskType = item.labor?.taskType || 'REPAIR_SIMPLE';
  const hours = item.labor?.hours || item.quantity;
  const hourlyRate = item.unitPriceHT;

  const timeStandard = LABOR_TIME_STANDARDS[taskType];
  const rateStandard = LABOR_RATE_STANDARDS;

  // Analyze time
  const timeVariance = ((hours - timeStandard.average) / timeStandard.average) * 100;

  // Analyze rate (region-adjusted)
  const regionalRate = rateStandard.regional[region];
  const rateVariance = ((hourlyRate - regionalRate) / regionalRate) * 100;

  // Calculate labor verdict
  let laborVerdict: LaborVerdict;
  if (timeVariance <= 0 && rateVariance <= 10) laborVerdict = 'EXCELLENT';
  else if (timeVariance <= 20 && rateVariance <= 20) laborVerdict = 'FAIR';
  else if (timeVariance <= 50 || rateVariance <= 40) laborVerdict = 'HIGH';
  else laborVerdict = 'EXCESSIVE';

  const laborAnalysis: LaborAnalysis = {
    taskType,
    description: item.labor?.description || item.description,
    quotedHours: hours,
    marketHours: timeStandard,
    timeVariance: Math.round(timeVariance),
    quotedHourlyRate: hourlyRate,
    marketHourlyRate: rateStandard,
    rateVariance: Math.round(rateVariance),
    quotedTotal: item.totalHT,
    marketTotal: {
      min: timeStandard.min * rateStandard.min,
      max: timeStandard.max * rateStandard.max,
      average: timeStandard.average * regionalRate,
    },
    complexityFactors: COMPLEXITY_FACTORS,
    verdict: laborVerdict,
  };

  // Calculate score
  const avgVariance = (Math.abs(timeVariance) + Math.abs(rateVariance)) / 2;
  let score: number;
  let verdict: ItemVerdict;

  if (avgVariance <= 10) {
    score = 90;
    verdict = 'EXCELLENT';
  } else if (avgVariance <= 25) {
    score = 75;
    verdict = 'GOOD';
  } else if (avgVariance <= 40) {
    score = 60;
    verdict = 'FAIR';
  } else if (avgVariance <= 60) {
    score = 40;
    verdict = 'HIGH';
    flags.push({
      type: 'LABOR_EXCESSIVE',
      severity: 'WARNING',
      message: `Temps ou taux horaire ${Math.round(avgVariance)}% au-dessus du marché`,
      suggestion: 'Demandez une justification du temps passé',
    });
  } else {
    score = 25;
    verdict = 'VERY_HIGH';
    flags.push({
      type: 'LABOR_EXCESSIVE',
      severity: 'ALERT',
      message: 'Main d\'œuvre excessive',
      suggestion: 'Ce temps de travail semble anormalement élevé',
    });
  }

  // Check for high hourly rate
  if (rateVariance > 30) {
    flags.push({
      type: 'LABOR_RATE_HIGH',
      severity: 'WARNING',
      message: `Taux horaire élevé: ${hourlyRate}€/h (moyenne région: ${regionalRate}€/h)`,
      suggestion: 'Vérifiez si des certifications spéciales justifient ce tarif',
    });
  }

  return {
    itemId: item.id,
    type: 'LABOR',
    laborAnalysis,
    quotedPrice: item.totalHT,
    marketPrice: laborAnalysis.marketTotal,
    variance: Math.round(((item.totalHT - laborAnalysis.marketTotal.average) / laborAnalysis.marketTotal.average) * 100),
    score,
    verdict,
    flags,
  };
}

/**
 * Analyse les frais de déplacement
 */
function analyzeTravelItem(
  item: {
    id: string;
    description: string;
    totalHT: number;
  },
  distanceKm?: number
): ItemAnalysisResult {
  const flags: AnalysisFlag[] = [];
  const quotedPrice = item.totalHT;

  // Estimate expected travel cost
  let expectedPrice: number;
  const distance = distanceKm || 20; // Default 20km if unknown

  if (distance <= TRAVEL_STANDARDS.local.max) {
    expectedPrice = TRAVEL_STANDARDS.local.rate;
  } else if (distance <= TRAVEL_STANDARDS.zone1.max) {
    expectedPrice = TRAVEL_STANDARDS.zone1.rate;
  } else if (distance <= TRAVEL_STANDARDS.zone2.max) {
    expectedPrice = TRAVEL_STANDARDS.zone2.rate;
  } else if (distance <= TRAVEL_STANDARDS.zone3.max) {
    expectedPrice = TRAVEL_STANDARDS.zone3.rate;
  } else {
    expectedPrice = TRAVEL_STANDARDS.zone3.rate +
      (distance - TRAVEL_STANDARDS.zone3.max) * TRAVEL_STANDARDS.perKmBeyond;
  }

  const variance = ((quotedPrice - expectedPrice) / expectedPrice) * 100;

  let score: number;
  let verdict: ItemVerdict;

  if (variance <= 10) {
    score = 85;
    verdict = 'GOOD';
  } else if (variance <= 25) {
    score = 70;
    verdict = 'FAIR';
  } else if (variance <= 50) {
    score = 50;
    verdict = 'HIGH';
    flags.push({
      type: 'PRICE_HIGH',
      severity: 'INFO',
      message: `Frais de déplacement ${Math.round(variance)}% au-dessus du standard`,
    });
  } else {
    score = 30;
    verdict = 'VERY_HIGH';
    flags.push({
      type: 'PRICE_HIGH',
      severity: 'WARNING',
      message: 'Frais de déplacement excessifs',
      suggestion: 'Demandez une justification (péages, stationnement...)',
    });
  }

  return {
    itemId: item.id,
    type: 'TRAVEL',
    quotedPrice,
    marketPrice: {
      min: expectedPrice * 0.8,
      max: expectedPrice * 1.3,
      average: expectedPrice,
    },
    variance: Math.round(variance),
    score,
    verdict,
    flags,
  };
}

// ============================================================================
// SUMMARY & RECOMMENDATIONS
// ============================================================================

/**
 * Génère le résumé de l'analyse
 */
function generateSummary(
  request: QuoteAnalysisRequest,
  itemResults: ItemAnalysisResult[]
): AnalysisSummary {
  // Calculate estimated market total
  let marketMin = 0;
  let marketMax = 0;
  let marketAvg = 0;

  for (const result of itemResults) {
    marketMin += result.marketPrice.min;
    marketMax += result.marketPrice.max;
    marketAvg += result.marketPrice.average;
  }

  // Count issues
  const partsOverpriced = itemResults.filter(
    r => r.type === 'PART' && (r.verdict === 'HIGH' || r.verdict === 'VERY_HIGH' || r.verdict === 'SUSPICIOUS')
  ).length;

  const laborOverpriced = itemResults.filter(
    r => r.type === 'LABOR' && (r.verdict === 'HIGH' || r.verdict === 'VERY_HIGH')
  ).length;

  const fairlyPriced = itemResults.filter(
    r => r.verdict === 'EXCELLENT' || r.verdict === 'GOOD' || r.verdict === 'FAIR'
  ).length;

  // Calculate potential savings
  const potentialSavings = Math.max(0, request.subtotalHT - marketAvg);

  // Generate key insights
  const keyInsights: string[] = [];

  if (potentialSavings > 50) {
    keyInsights.push(`💰 Économie potentielle de ${Math.round(potentialSavings)}€ en négociant`);
  }

  if (partsOverpriced > 0) {
    keyInsights.push(`⚠️ ${partsOverpriced} pièce(s) au-dessus du prix marché`);
  }

  if (laborOverpriced > 0) {
    keyInsights.push(`⏱️ Main d'œuvre ${laborOverpriced > 1 ? 'sur plusieurs postes' : ''} au-dessus des standards`);
  }

  if (fairlyPriced === itemResults.length) {
    keyInsights.push('✅ Tous les postes sont correctement tarifés');
  }

  return {
    quotedTotal: request.subtotalHT,
    estimatedMarketTotal: {
      min: Math.round(marketMin),
      max: Math.round(marketMax),
      average: Math.round(marketAvg),
    },
    potentialSavings: Math.round(potentialSavings),
    itemsAnalyzed: itemResults.length,
    itemsWithIssues: itemResults.filter(r => r.flags.length > 0).length,
    keyInsights,
    partsOverpriced,
    laborOverpriced,
    fairlyPriced,
  };
}

/**
 * Génère les recommandations
 */
function generateRecommendations(
  summary: AnalysisSummary,
  itemResults: ItemAnalysisResult[],
  globalScore: TrustScore
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Check if negotiation is recommended
  if (summary.potentialSavings > 100) {
    recommendations.push({
      id: 'negotiate',
      priority: 'HIGH',
      type: 'NEGOTIATE_PRICE',
      title: 'Négocier le prix',
      description: `Ce devis est ${Math.round((summary.quotedTotal - summary.estimatedMarketTotal.average) / summary.estimatedMarketTotal.average * 100)}% au-dessus de la moyenne. Vous pouvez économiser jusqu'à ${summary.potentialSavings}€.`,
      potentialImpact: summary.potentialSavings,
      actionable: true,
    });
  }

  // Check for items without references
  const itemsWithoutRef = itemResults.filter(
    r => r.type === 'PART' && r.flags.some(f => f.type === 'NO_REFERENCE')
  );
  if (itemsWithoutRef.length > 0) {
    recommendations.push({
      id: 'verify_ref',
      priority: 'MEDIUM',
      type: 'REQUEST_DETAILS',
      title: 'Demander les références',
      description: `${itemsWithoutRef.length} pièce(s) sans référence. Demandez les références exactes pour vérifier les prix.`,
      actionable: true,
    });
  }

  // Check for suspicious items
  const suspiciousItems = itemResults.filter(r => r.verdict === 'SUSPICIOUS');
  if (suspiciousItems.length > 0) {
    recommendations.push({
      id: 'compare',
      priority: 'HIGH',
      type: 'COMPARE_QUOTES',
      title: 'Demander d\'autres devis',
      description: 'Certains prix semblent anormaux. Nous vous recommandons de comparer avec d\'autres prestataires.',
      actionable: true,
    });
  }

  // If everything is fine
  if (globalScore.level === 'EXCELLENT' || globalScore.level === 'GOOD') {
    recommendations.push({
      id: 'approve',
      priority: 'LOW',
      type: 'APPROVE',
      title: 'Approuver le devis',
      description: 'Ce devis est conforme au marché. Vous pouvez l\'accepter en toute confiance.',
      actionable: true,
    });
  }

  return recommendations;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyse complète d'un devis
 */
export async function analyzeQuote(
  request: QuoteAnalysisRequest,
  identifiedParts: Map<string, IdentifiedPart> = new Map(),
  options?: {
    region?: 'paris' | 'idf' | 'province';
    includeHistory?: boolean;
  }
): Promise<QuoteAnalysisResult> {
  const itemResults: ItemAnalysisResult[] = [];
  const region = options?.region || 'province';

  // Analyze each item
  for (const item of request.items) {
    let result: ItemAnalysisResult;

    switch (item.type) {
      case 'PART':
        const identifiedPart = item.part?.reference
          ? identifiedParts.get(item.part.reference)
          : undefined;
        result = analyzePartItem(
          {
            id: item.id,
            description: item.description,
            unitPriceHT: item.unitPriceHT,
            quantity: item.quantity,
            totalHT: item.totalHT,
            part: item.part,
          },
          identifiedPart
        );
        break;

      case 'LABOR':
        result = analyzeLaborItem(
          {
            id: item.id,
            description: item.description,
            unitPriceHT: item.unitPriceHT,
            quantity: item.quantity,
            totalHT: item.totalHT,
            labor: item.labor,
          },
          region
        );
        break;

      case 'TRAVEL':
        result = analyzeTravelItem({
          id: item.id,
          description: item.description,
          totalHT: item.totalHT,
        });
        break;

      default:
        // For OTHER items, just pass through with neutral score
        result = {
          itemId: item.id,
          type: 'OTHER',
          quotedPrice: item.totalHT,
          marketPrice: { min: 0, max: 0, average: 0 },
          variance: 0,
          score: 50,
          verdict: 'FAIR',
          flags: [],
        };
    }

    itemResults.push(result);
  }

  // Calculate global score
  const globalScore = calculateGlobalScore(itemResults);

  // Generate summary
  const summary = generateSummary(request, itemResults);

  // Generate recommendations
  const recommendations = generateRecommendations(summary, itemResults, globalScore);

  // Calculate breakdown
  const partsResults = itemResults.filter(r => r.type === 'PART');
  const laborResults = itemResults.filter(r => r.type === 'LABOR');
  const travelResults = itemResults.filter(r => r.type === 'TRAVEL');

  const avgScore = (results: ItemAnalysisResult[]) =>
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 50;

  // Historical comparison (if requested)
  let historicalComparison: HistoricalComparison | undefined;
  if (options?.includeHistory) {
    // Build historical data from database
    const previousPurchases = [];
    for (const item of request.items) {
      if (item.type === 'PART' && item.part?.reference) {
        const history = PriceDatabase.getHistory(item.part.reference);
        for (const h of history) {
          previousPurchases.push({
            date: h.recordedAt,
            reference: item.part.reference,
            pricePaid: h.price,
            provider: h.sourceName || 'Inconnu',
            wasNegotiated: false,
          });
        }
      }
    }

    if (previousPurchases.length > 0) {
      const avgHistorical = previousPurchases.reduce((s, p) => s + p.pricePaid, 0) / previousPurchases.length;
      historicalComparison = {
        previousPurchases,
        priceTrend: 'STABLE',
        averageHistoricalPrice: Math.round(avgHistorical),
      };
    }
  }

  return {
    quoteId: request.quoteId,
    analyzedAt: new Date(),
    globalScore,
    itemAnalysis: itemResults,
    summary,
    recommendations,
    historicalComparison,
    breakdown: {
      partsScore: avgScore(partsResults),
      laborScore: avgScore(laborResults),
      travelScore: avgScore(travelResults),
      overallFairness: globalScore.score,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ScoringEngine = {
  analyzeQuote,
  calculateGlobalScore,
  analyzePartItem,
  analyzeLaborItem,
  analyzeTravelItem,
  LABOR_TIME_STANDARDS,
  LABOR_RATE_STANDARDS,
  TRAVEL_STANDARDS,
  COMPLEXITY_FACTORS,
};

export default ScoringEngine;
