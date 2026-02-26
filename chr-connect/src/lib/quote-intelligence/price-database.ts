// ============================================================================
// QUOTE INTELLIGENCE - PRICE DATABASE
// ============================================================================
// Base de données locale des prix pour comparaison intelligente
// Combine données locales + données web pour une analyse complète

import type {
  PriceDatabaseEntry,
  RecordedPrice,
  MarketPriceData,
  PartCategory,
  IdentifiedPart,
} from './types';

// ============================================================================
// IN-MEMORY DATABASE (Will be replaced by real DB later)
// ============================================================================

// Simule une base de données - en production, utiliser Prisma/Supabase
const priceDatabase: Map<string, PriceDatabaseEntry> = new Map();

// ============================================================================
// NORMALIZATION UTILITIES
// ============================================================================

/**
 * Normalise une référence pour le matching
 * Ex: "Danfoss SC-15G" -> "danfoss sc15g"
 */
export function normalizeReference(ref: string): string {
  return ref
    .toLowerCase()
    .replace(/[-_\s]+/g, '')      // Remove separators
    .replace(/[^\w]/g, '')         // Remove special chars
    .trim();
}

/**
 * Génère des keywords pour la recherche
 */
export function generateKeywords(part: {
  brand?: string;
  model?: string;
  reference?: string;
  description?: string;
}): string[] {
  const keywords: string[] = [];

  if (part.brand) keywords.push(part.brand.toLowerCase());
  if (part.model) keywords.push(part.model.toLowerCase());
  if (part.reference) {
    keywords.push(part.reference.toLowerCase());
    // Also add without separators
    keywords.push(normalizeReference(part.reference));
  }
  if (part.description) {
    // Extract significant words
    const words = part.description
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);
    keywords.push(...words);
  }

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Calcule un score de similarité entre deux strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeReference(str1);
  const s2 = normalizeReference(str2);

  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 85;

  // Levenshtein-based similarity
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(s1, s2);
  return Math.round((1 - distance / maxLen) * 100);
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Recherche une pièce dans la base de données
 */
export function findInDatabase(query: {
  reference?: string;
  brand?: string;
  model?: string;
}): PriceDatabaseEntry | null {
  const searchRef = query.reference || `${query.brand || ''} ${query.model || ''}`.trim();
  if (!searchRef) return null;

  const normalizedQuery = normalizeReference(searchRef);

  // Exact match first
  for (const [, entry] of priceDatabase) {
    if (entry.normalizedName === normalizedQuery) {
      return entry;
    }
  }

  // Fuzzy match
  let bestMatch: { entry: PriceDatabaseEntry; score: number } | null = null;

  for (const [, entry] of priceDatabase) {
    const score = calculateSimilarity(searchRef, entry.reference);
    if (score >= 80 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { entry, score };
    }
  }

  return bestMatch?.entry || null;
}

/**
 * Ajoute ou met à jour une entrée dans la base de données
 */
export function upsertPriceEntry(part: IdentifiedPart): PriceDatabaseEntry {
  const normalizedName = normalizeReference(part.reference);
  const existingEntry = findInDatabase({ reference: part.reference });

  if (existingEntry) {
    // Update existing entry
    const updatedEntry: PriceDatabaseEntry = {
      ...existingEntry,
      currentMarketData: part.marketData,
      updatedAt: new Date(),
      timesQueried: existingEntry.timesQueried + 1,
      lastVerifiedAt: new Date(),
    };

    // Add new price record if significantly different
    const latestPrice = part.marketData.averagePrice;
    const lastRecordedPrice = existingEntry.prices[existingEntry.prices.length - 1]?.price || 0;

    if (Math.abs(latestPrice - lastRecordedPrice) / lastRecordedPrice > 0.05) {
      updatedEntry.prices.push({
        id: `price_${Date.now()}`,
        price: latestPrice,
        source: 'API',
        sourceName: 'Perplexity',
        recordedAt: new Date(),
        isVerified: true,
      });
    }

    priceDatabase.set(existingEntry.id, updatedEntry);
    return updatedEntry;
  }

  // Create new entry
  const newEntry: PriceDatabaseEntry = {
    id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    reference: part.reference,
    brand: part.brand,
    model: part.model,
    category: part.category,
    normalizedName,
    keywords: generateKeywords({
      brand: part.brand,
      model: part.model,
      reference: part.reference,
      description: part.description,
    }),
    prices: [{
      id: `price_${Date.now()}`,
      price: part.marketData.averagePrice,
      source: 'API',
      sourceName: 'Perplexity',
      recordedAt: new Date(),
      isVerified: true,
    }],
    currentMarketData: part.marketData,
    createdAt: new Date(),
    updatedAt: new Date(),
    timesQueried: 1,
    lastVerifiedAt: new Date(),
  };

  priceDatabase.set(newEntry.id, newEntry);
  return newEntry;
}

/**
 * Enregistre un prix depuis un devis utilisateur
 */
export function recordUserPrice(
  reference: string,
  price: number,
  providerName?: string,
  location?: string
): RecordedPrice {
  const entry = findInDatabase({ reference });

  const newPrice: RecordedPrice = {
    id: `price_${Date.now()}`,
    price,
    source: 'USER_QUOTE',
    sourceName: providerName,
    recordedAt: new Date(),
    location,
    isVerified: false,
  };

  if (entry) {
    entry.prices.push(newPrice);
    entry.updatedAt = new Date();

    // Recalculate market data including user prices
    const allPrices = entry.prices.map(p => p.price);
    const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

    entry.currentMarketData = {
      ...entry.currentMarketData,
      minPrice: Math.min(...allPrices),
      maxPrice: Math.max(...allPrices),
      averagePrice: Math.round(avgPrice),
      sampleSize: allPrices.length,
      lastUpdated: new Date(),
    };

    priceDatabase.set(entry.id, entry);
  }

  return newPrice;
}

/**
 * Récupère l'historique des prix pour une pièce
 */
export function getPriceHistory(reference: string): RecordedPrice[] {
  const entry = findInDatabase({ reference });
  return entry?.prices || [];
}

/**
 * Analyse la tendance des prix
 */
export function analyzePriceTrend(reference: string): {
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  percentChange: number;
  period: string;
} {
  const history = getPriceHistory(reference);

  if (history.length < 2) {
    return { trend: 'STABLE', percentChange: 0, period: 'N/A' };
  }

  // Sort by date
  const sorted = [...history].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const oldestPrice = sorted[0].price;
  const newestPrice = sorted[sorted.length - 1].price;
  const percentChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;

  const oldestDate = new Date(sorted[0].recordedAt);
  const newestDate = new Date(sorted[sorted.length - 1].recordedAt);
  const daysDiff = Math.round(
    (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  if (percentChange > 5) trend = 'INCREASING';
  else if (percentChange < -5) trend = 'DECREASING';
  else trend = 'STABLE';

  return {
    trend,
    percentChange: Math.round(percentChange * 10) / 10,
    period: daysDiff > 30 ? `${Math.round(daysDiff / 30)} mois` : `${daysDiff} jours`,
  };
}

/**
 * Récupère les statistiques globales de la base de données
 */
export function getDatabaseStats(): {
  totalParts: number;
  totalPriceRecords: number;
  categoriesCount: Record<PartCategory, number>;
  averageDataAge: number; // en jours
} {
  let totalPriceRecords = 0;
  const categoriesCount: Record<string, number> = {};
  let totalAge = 0;
  const now = new Date();

  for (const [, entry] of priceDatabase) {
    totalPriceRecords += entry.prices.length;

    const category = entry.category || 'OTHER';
    categoriesCount[category] = (categoriesCount[category] || 0) + 1;

    const ageInDays = (now.getTime() - new Date(entry.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    totalAge += ageInDays;
  }

  return {
    totalParts: priceDatabase.size,
    totalPriceRecords,
    categoriesCount: categoriesCount as Record<PartCategory, number>,
    averageDataAge: priceDatabase.size > 0 ? Math.round(totalAge / priceDatabase.size) : 0,
  };
}

// ============================================================================
// SEED DATA - Common HORECA Parts
// ============================================================================

const SEED_DATA: Partial<PriceDatabaseEntry>[] = [
  {
    reference: 'Danfoss SC15G',
    brand: 'Danfoss',
    model: 'SC15G',
    category: 'COMPRESSOR',
    currentMarketData: {
      minPrice: 180,
      maxPrice: 320,
      averagePrice: 245,
      priceVolatility: 'STABLE',
      lastUpdated: new Date(),
      dataQuality: 'HIGH',
      sources: [{ name: 'Frigoriste-Pro', price: 245, currency: 'EUR', isVerified: true, scrapedAt: new Date() }],
      sampleSize: 12,
    },
  },
  {
    reference: 'Embraco NEK6213GK',
    brand: 'Embraco',
    model: 'NEK6213GK',
    category: 'COMPRESSOR',
    currentMarketData: {
      minPrice: 220,
      maxPrice: 380,
      averagePrice: 295,
      priceVolatility: 'STABLE',
      lastUpdated: new Date(),
      dataQuality: 'HIGH',
      sources: [{ name: 'PiecesFroid.com', price: 295, currency: 'EUR', isVerified: true, scrapedAt: new Date() }],
      sampleSize: 8,
    },
  },
  {
    reference: 'Dixell XR06CX',
    brand: 'Dixell',
    model: 'XR06CX',
    category: 'THERMOSTAT',
    currentMarketData: {
      minPrice: 45,
      maxPrice: 85,
      averagePrice: 62,
      priceVolatility: 'STABLE',
      lastUpdated: new Date(),
      dataQuality: 'HIGH',
      sources: [{ name: 'Friga-Bohn', price: 62, currency: 'EUR', isVerified: true, scrapedAt: new Date() }],
      sampleSize: 15,
    },
  },
  {
    reference: 'Carel IR33',
    brand: 'Carel',
    model: 'IR33',
    category: 'THERMOSTAT',
    currentMarketData: {
      minPrice: 120,
      maxPrice: 180,
      averagePrice: 145,
      priceVolatility: 'STABLE',
      lastUpdated: new Date(),
      dataQuality: 'MEDIUM',
      sources: [{ name: 'Carel Direct', price: 145, currency: 'EUR', isVerified: true, scrapedAt: new Date() }],
      sampleSize: 6,
    },
  },
  {
    reference: 'Ebmpapst A4E300',
    brand: 'Ebmpapst',
    model: 'A4E300',
    category: 'FAN_MOTOR',
    currentMarketData: {
      minPrice: 85,
      maxPrice: 140,
      averagePrice: 110,
      priceVolatility: 'MODERATE',
      lastUpdated: new Date(),
      dataQuality: 'MEDIUM',
      sources: [{ name: 'Ebmpapst', price: 110, currency: 'EUR', isVerified: true, scrapedAt: new Date() }],
      sampleSize: 9,
    },
  },
];

/**
 * Initialise la base de données avec des données de départ
 */
export function seedDatabase(): void {
  for (const data of SEED_DATA) {
    if (!data.reference || !data.currentMarketData) continue;

    const entry: PriceDatabaseEntry = {
      id: `seed_${normalizeReference(data.reference)}`,
      reference: data.reference,
      brand: data.brand || '',
      model: data.model || '',
      category: data.category || 'OTHER',
      normalizedName: normalizeReference(data.reference),
      keywords: generateKeywords({
        brand: data.brand,
        model: data.model,
        reference: data.reference,
      }),
      prices: [{
        id: `seed_price_${Date.now()}`,
        price: data.currentMarketData.averagePrice,
        source: 'MANUAL_ENTRY',
        sourceName: 'Initial Seed',
        recordedAt: new Date(),
        isVerified: true,
      }],
      currentMarketData: data.currentMarketData,
      createdAt: new Date(),
      updatedAt: new Date(),
      timesQueried: 0,
      lastVerifiedAt: new Date(),
    };

    priceDatabase.set(entry.id, entry);
  }
}

// Initialize with seed data
seedDatabase();

// ============================================================================
// EXPORT
// ============================================================================

export const PriceDatabase = {
  find: findInDatabase,
  upsert: upsertPriceEntry,
  recordPrice: recordUserPrice,
  getHistory: getPriceHistory,
  analyzeTrend: analyzePriceTrend,
  getStats: getDatabaseStats,
  normalize: normalizeReference,
  generateKeywords,
};

export default PriceDatabase;
