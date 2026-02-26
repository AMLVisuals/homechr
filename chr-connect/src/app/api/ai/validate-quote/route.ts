// ============================================================================
// API ROUTE: VALIDATE QUOTE
// ============================================================================
// Valide si un prix proposé est conforme au marché via Perplexity
// POST /api/ai/validate-quote

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface ValidateQuoteRequest {
  reference: string;
  quotedPrice: number;
}

type QuoteStatus = 'FAIR' | 'HIGH' | 'SUSPICIOUS';

interface ValidateQuoteResponse {
  success: boolean;
  status?: QuoteStatus;
  trustScore?: number;
  message?: string;
  marketData?: {
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    sources: string[];
  };
  error?: string;
}

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityChoice {
  message: {
    content: string;
  };
}

interface PerplexityResponse {
  choices: PerplexityChoice[];
}

// ============================================================================
// PERPLEXITY PRICE VALIDATION
// ============================================================================

async function getMarketPrices(reference: string): Promise<{
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  sources: string[];
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY non configurée');
  }

  const systemPrompt = `Tu es un expert en tarification d'équipements et pièces détachées pour la restauration professionnelle (HORECA).

MISSION: Rechercher le prix marché actuel d'une pièce/équipement spécifique.

INSTRUCTIONS:
1. Recherche les prix de vente actuels sur des sites professionnels (fournisseurs HORECA, distributeurs)
2. Priorise les sources françaises et européennes
3. Les prix doivent être en EUROS HT (hors taxes)
4. Inclus les noms des sources où tu as trouvé les prix

RÉPONDS UNIQUEMENT en JSON valide:
{
  "minPrice": 150,
  "maxPrice": 320,
  "averagePrice": 235,
  "sources": ["Site1.fr", "Site2.com"]
}

Si tu ne trouves pas de prix fiables, estime une fourchette basée sur des produits équivalents et indique "Estimation" dans les sources.`;

  const messages: PerplexityMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Prix marché actuel pour: ${reference}` }
  ];

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-small-online',
      messages,
      temperature: 0.1,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Perplexity: ${response.status} - ${errorText}`);
  }

  const data: PerplexityResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Réponse Perplexity vide');
  }

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Format de réponse invalide');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    minPrice: Number(parsed.minPrice) || 0,
    maxPrice: Number(parsed.maxPrice) || 0,
    averagePrice: Number(parsed.averagePrice) || 0,
    sources: Array.isArray(parsed.sources) ? parsed.sources : ['Estimation'],
  };
}

// ============================================================================
// TRUST SCORE CALCULATION
// ============================================================================

function calculateTrustScore(
  quotedPrice: number,
  marketData: { minPrice: number; maxPrice: number; averagePrice: number }
): { status: QuoteStatus; trustScore: number; message: string } {
  const { minPrice, maxPrice, averagePrice } = marketData;

  // Handle edge case: no market data
  if (averagePrice === 0) {
    return {
      status: 'FAIR',
      trustScore: 50,
      message: 'Données marché insuffisantes pour une validation précise.',
    };
  }

  // Calculate price deviation from average
  const deviationFromAvg = ((quotedPrice - averagePrice) / averagePrice) * 100;

  // Calculate position within range
  const range = maxPrice - minPrice;
  const positionInRange = range > 0
    ? ((quotedPrice - minPrice) / range) * 100
    : 50;

  // Determine status and trust score
  let status: QuoteStatus;
  let trustScore: number;
  let message: string;

  // FAIR: Within reasonable range (min to max + 15% margin)
  if (quotedPrice <= maxPrice * 1.15 && quotedPrice >= minPrice * 0.85) {
    if (quotedPrice <= averagePrice * 1.10) {
      // Excellent price (at or below average + 10%)
      status = 'FAIR';
      trustScore = Math.min(95, 85 + (averagePrice - quotedPrice) / averagePrice * 20);
      message = `Prix conforme au marché. Moyenne constatée : ${averagePrice.toFixed(0)}€ HT.`;
    } else {
      // Acceptable but on the higher side
      status = 'FAIR';
      trustScore = Math.max(65, 85 - positionInRange * 0.3);
      message = `Prix acceptable. Légèrement au-dessus de la moyenne (${averagePrice.toFixed(0)}€), mais dans la fourchette marché.`;
    }
  }
  // HIGH: Above max but not suspicious (15-50% above max)
  else if (quotedPrice > maxPrice * 1.15 && quotedPrice <= maxPrice * 1.50) {
    status = 'HIGH';
    trustScore = Math.max(35, 60 - deviationFromAvg * 0.5);
    message = `Prix élevé. ${Math.round(deviationFromAvg)}% au-dessus de la moyenne marché (${averagePrice.toFixed(0)}€). Négociation recommandée.`;
  }
  // SUSPICIOUS: Way above market (>50% above max) or way below (potential counterfeit)
  else if (quotedPrice > maxPrice * 1.50) {
    status = 'SUSPICIOUS';
    trustScore = Math.max(10, 30 - deviationFromAvg * 0.3);
    message = `Prix suspect. ${Math.round(deviationFromAvg)}% au-dessus du marché. Maximum constaté : ${maxPrice.toFixed(0)}€. Vérifiez ce devis.`;
  }
  // SUSPICIOUS: Way below market (potential quality/authenticity issue)
  else {
    status = 'SUSPICIOUS';
    trustScore = Math.max(15, 40);
    message = `Prix anormalement bas. Minimum marché : ${minPrice.toFixed(0)}€. Vérifiez l'authenticité/qualité de la pièce.`;
  }

  // Ensure trustScore is within bounds
  trustScore = Math.round(Math.max(0, Math.min(100, trustScore)));

  return { status, trustScore, message };
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ValidateQuoteResponse>> {
  try {
    const body: ValidateQuoteRequest = await request.json();
    const { reference, quotedPrice } = body;

    // Validation
    if (!reference || typeof reference !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Référence de pièce requise',
        },
        { status: 400 }
      );
    }

    if (typeof quotedPrice !== 'number' || quotedPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prix proposé invalide (doit être un nombre positif)',
        },
        { status: 400 }
      );
    }

    // Get market prices from Perplexity
    const marketData = await getMarketPrices(reference);

    // Calculate trust score
    const validation = calculateTrustScore(quotedPrice, marketData);

    return NextResponse.json({
      success: true,
      status: validation.status,
      trustScore: validation.trustScore,
      message: validation.message,
      marketData: {
        ...marketData,
      },
    });

  } catch (error) {
    console.error('[validate-quote] Erreur:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    service: 'validate-quote',
    description: 'Valide si un prix de devis est conforme au marché',
    provider: 'Perplexity Sonar',
    statuses: ['FAIR', 'HIGH', 'SUSPICIOUS'],
    trustScoreRange: '0-100',
  });
}
