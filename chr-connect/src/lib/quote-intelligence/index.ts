// ============================================================================
// QUOTE INTELLIGENCE SYSTEM - INDEX
// ============================================================================
// Point d'entrée principal pour le système d'intelligence devis
// Protège les patrons HORECA contre les arnaques

export * from './types';
export { PriceDatabase } from './price-database';
export { ScoringEngine } from './scoring-engine';

// Re-export main functions for convenience
import { PriceDatabase } from './price-database';
import { ScoringEngine } from './scoring-engine';

export const QuoteIntelligence = {
  // Database operations
  findPart: PriceDatabase.find,
  savePart: PriceDatabase.upsert,
  recordPrice: PriceDatabase.recordPrice,
  getPriceHistory: PriceDatabase.getHistory,
  analyzePriceTrend: PriceDatabase.analyzeTrend,
  getDatabaseStats: PriceDatabase.getStats,

  // Analysis operations
  analyzeQuote: ScoringEngine.analyzeQuote,

  // Reference data
  laborTimeStandards: ScoringEngine.LABOR_TIME_STANDARDS,
  laborRateStandards: ScoringEngine.LABOR_RATE_STANDARDS,
  travelStandards: ScoringEngine.TRAVEL_STANDARDS,
  complexityFactors: ScoringEngine.COMPLEXITY_FACTORS,
};

export default QuoteIntelligence;
