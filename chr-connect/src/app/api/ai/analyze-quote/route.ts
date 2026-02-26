// ============================================================================
// API ROUTE: ANALYZE QUOTE (COMPLETE)
// ============================================================================
// Analyse intelligente complète d'un devis
// Combine: OCR, Perplexity, Base de données locale, Scoring
// POST /api/ai/analyze-quote

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScoringEngine } from '@/lib/quote-intelligence/scoring-engine';
import { PriceDatabase } from '@/lib/quote-intelligence/price-database';
import type {
  QuoteAnalysisRequest,
  QuoteAnalysisResult,
  IdentifiedPart,
  MarketPriceData,
  PartCategory,
} from '@/lib/quote-intelligence/types';

// ============================================================================
// TYPES
// ============================================================================

interface AnalyzeQuoteAPIRequest {
  quote: QuoteAnalysisRequest;
  options?: {
    deepAnalysis?: boolean;
    includeHistory?: boolean;
    region?: 'paris' | 'idf' | 'province';
  };
}

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityChoice {
  message: { content: string };
}

interface PerplexityResponse {
  choices: PerplexityChoice[];
}

// ============================================================================
// OCR - Extract from image
// ============================================================================

async function extractFromImage(base64Image: string): Promise<{
  brand: string;
  model: string;
  serialNumber: string;
  confidence: number;
}> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY non configurée');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `Tu es un expert technique HORECA. Analyse cette étiquette/plaque signalétique.

EXTRAIS:
1. MARQUE (fabricant)
2. MODÈLE/RÉFÉRENCE
3. NUMÉRO DE SÉRIE (si visible)

RÉPONDS en JSON:
{
  "brand": "MARQUE",
  "model": "MODELE",
  "serialNumber": "NUMERO_SERIE_OU_VIDE",
  "confidence": 85
}

confidence = ton niveau de confiance 0-100`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType: 'image/jpeg', data: imageData } },
  ]);

  const response = result.response.text();
  const jsonMatch = response.match(/\{[\s\S]*\}/);

  if (!jsonMatch) throw new Error('OCR: impossible d\'extraire les informations');

  return JSON.parse(jsonMatch[0]);
}

// ============================================================================
// PERPLEXITY - Get market data
// ============================================================================

async function getMarketDataFromPerplexity(reference: string): Promise<{
  fullName: string;
  description: string;
  category: PartCategory;
  imageUrl: string;
  marketData: MarketPriceData;
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY non configurée');

  const systemPrompt = `Tu es un expert en équipements HORECA (restauration professionnelle).

MISSION: Rechercher les informations complètes sur une pièce/équipement.

RECHERCHE:
1. Nom complet et description technique
2. Catégorie (COMPRESSOR, THERMOSTAT, EVAPORATOR, CONDENSER, FAN_MOTOR, GASKET, HEATING_ELEMENT, VALVE, SENSOR, CONTROL_BOARD, PUMP, FILTER, BURNER, IGNITER, OTHER)
3. Image produit officielle (URL)
4. Prix en France (min, max, moyenne) en € HT
5. Sources des prix

RÉPONDS en JSON UNIQUEMENT:
{
  "fullName": "Nom complet",
  "description": "Description technique",
  "category": "COMPRESSOR",
  "imageUrl": "https://...",
  "minPrice": 180,
  "maxPrice": 320,
  "averagePrice": 245,
  "sources": ["Site1.fr", "Site2.com"],
  "priceQuality": "HIGH"
}`;

  const messages: PerplexityMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Recherche complète pour: ${reference}` },
  ];

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-small-online',
      messages,
      temperature: 0.1,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity error: ${response.status}`);
  }

  const data: PerplexityResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) throw new Error('Réponse Perplexity vide');

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      fullName: reference,
      description: `Pièce ${reference}`,
      category: 'OTHER',
      imageUrl: '',
      marketData: {
        minPrice: 0,
        maxPrice: 0,
        averagePrice: 0,
        priceVolatility: 'STABLE',
        lastUpdated: new Date(),
        dataQuality: 'LOW',
        sources: [],
        sampleSize: 0,
      },
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    fullName: parsed.fullName || reference,
    description: parsed.description || '',
    category: parsed.category || 'OTHER',
    imageUrl: parsed.imageUrl || '',
    marketData: {
      minPrice: Number(parsed.minPrice) || 0,
      maxPrice: Number(parsed.maxPrice) || 0,
      averagePrice: Number(parsed.averagePrice) || 0,
      priceVolatility: 'STABLE',
      lastUpdated: new Date(),
      dataQuality: parsed.priceQuality === 'HIGH' ? 'HIGH' : 'MEDIUM',
      sources: (parsed.sources || []).map((name: string) => ({
        name,
        price: parsed.averagePrice,
        currency: 'EUR' as const,
        isVerified: true,
        scrapedAt: new Date(),
      })),
      sampleSize: parsed.sources?.length || 1,
    },
  };
}

// ============================================================================
// IDENTIFY PART (Combined: DB + OCR + Perplexity)
// ============================================================================

async function identifyPart(input: {
  reference?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  imageBase64?: string;
}): Promise<IdentifiedPart | null> {
  let reference = input.reference;
  let brand = input.brand || '';
  let model = input.model || '';
  let serialNumber = input.serialNumber;
  let confidence = 100;

  // STEP 1: If image provided, do OCR first
  if (input.imageBase64) {
    try {
      const ocrResult = await extractFromImage(input.imageBase64);
      brand = ocrResult.brand || brand;
      model = ocrResult.model || model;
      serialNumber = ocrResult.serialNumber || serialNumber;
      confidence = ocrResult.confidence;

      if (!reference && (brand || model)) {
        reference = `${brand} ${model}`.trim();
      }
    } catch (error) {
      console.error('[identify-part] OCR error:', error);
      // Continue with manual data if OCR fails
    }
  }

  if (!reference) {
    reference = `${brand} ${model}`.trim();
  }

  if (!reference) {
    return null;
  }

  // STEP 2: Check local database first
  const dbEntry = PriceDatabase.find({ reference, brand, model });

  if (dbEntry && dbEntry.currentMarketData.dataQuality === 'HIGH') {
    // Fresh data in DB, use it
    const daysSinceUpdate = (Date.now() - new Date(dbEntry.updatedAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate < 7) {
      return {
        id: dbEntry.id,
        reference: dbEntry.reference,
        brand: dbEntry.brand,
        model: dbEntry.model,
        serialNumber,
        fullName: dbEntry.reference,
        description: '',
        category: dbEntry.category,
        specifications: [],
        marketData: dbEntry.currentMarketData,
        identifiedAt: new Date(),
        source: 'DATABASE',
        confidence,
      };
    }
  }

  // STEP 3: Get fresh data from Perplexity
  try {
    const perplexityData = await getMarketDataFromPerplexity(reference);

    const identifiedPart: IdentifiedPart = {
      id: `part_${Date.now()}`,
      reference,
      brand,
      model,
      serialNumber,
      fullName: perplexityData.fullName,
      description: perplexityData.description,
      category: perplexityData.category,
      specifications: [],
      officialImageUrl: perplexityData.imageUrl,
      marketData: perplexityData.marketData,
      identifiedAt: new Date(),
      source: input.imageBase64 ? 'OCR' : 'MANUAL',
      confidence,
    };

    // Save to database for future use
    PriceDatabase.upsert(identifiedPart);

    return identifiedPart;
  } catch (error) {
    console.error('[identify-part] Perplexity error:', error);

    // Return with DB data if available, otherwise null
    if (dbEntry) {
      return {
        id: dbEntry.id,
        reference: dbEntry.reference,
        brand: dbEntry.brand,
        model: dbEntry.model,
        serialNumber,
        fullName: dbEntry.reference,
        description: '',
        category: dbEntry.category,
        specifications: [],
        marketData: dbEntry.currentMarketData,
        identifiedAt: new Date(),
        source: 'DATABASE',
        confidence: 70,
      };
    }

    return null;
  }
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: boolean; analysis?: QuoteAnalysisResult; error?: string }>> {
  try {
    const body: AnalyzeQuoteAPIRequest = await request.json();
    const { quote, options } = body;

    // Validate input
    if (!quote || !quote.items || quote.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Devis invalide ou vide' },
        { status: 400 }
      );
    }

    // STEP 1: Identify all parts
    const identifiedParts = new Map<string, IdentifiedPart>();

    for (const item of quote.items) {
      if (item.type === 'PART' && item.part) {
        const identified = await identifyPart({
          reference: item.part.reference,
          brand: item.part.brand,
          model: item.part.model,
          serialNumber: item.part.serialNumber,
          imageBase64: item.part.imageBase64,
        });

        if (identified && item.part.reference) {
          identifiedParts.set(item.part.reference, identified);
        }
      }
    }

    // STEP 2: Analyze the quote
    const analysis = await ScoringEngine.analyzeQuote(quote, identifiedParts, {
      region: options?.region || 'province',
      includeHistory: options?.includeHistory ?? true,
    });

    // STEP 3: Record prices from this quote for future reference
    for (const item of quote.items) {
      if (item.type === 'PART' && item.part?.reference) {
        PriceDatabase.recordPrice(
          item.part.reference,
          item.unitPriceHT,
          quote.provider.name
        );
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('[analyze-quote] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// IDENTIFY PART ENDPOINT (Sub-route for individual part identification)
// ============================================================================

export async function PUT(
  request: NextRequest
): Promise<NextResponse<{ success: boolean; part?: IdentifiedPart; error?: string }>> {
  try {
    const body = await request.json();
    const { reference, brand, model, serialNumber, imageBase64 } = body;

    if (!reference && !imageBase64 && !brand && !model) {
      return NextResponse.json(
        { success: false, error: 'Fournissez une référence, une image, ou marque+modèle' },
        { status: 400 }
      );
    }

    const part = await identifyPart({
      reference,
      brand,
      model,
      serialNumber,
      imageBase64,
    });

    if (!part) {
      return NextResponse.json(
        { success: false, error: 'Impossible d\'identifier cette pièce' },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, part });
  } catch (error) {
    console.error('[identify-part] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function GET(): Promise<NextResponse> {
  const stats = PriceDatabase.getStats();

  return NextResponse.json({
    status: 'ok',
    service: 'analyze-quote',
    version: '2.0',
    capabilities: [
      'full-quote-analysis',
      'ocr-identification',
      'market-price-lookup',
      'labor-analysis',
      'travel-analysis',
      'historical-comparison',
      'smart-recommendations',
    ],
    database: {
      totalParts: stats.totalParts,
      totalPriceRecords: stats.totalPriceRecords,
      averageDataAge: `${stats.averageDataAge} jours`,
    },
    providers: {
      ocr: 'Google Gemini 1.5 Flash',
      search: 'Perplexity Sonar',
    },
    endpoints: {
      POST: 'Analyze complete quote',
      PUT: 'Identify single part',
      GET: 'Health check',
    },
  });
}
