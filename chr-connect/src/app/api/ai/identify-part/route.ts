// ============================================================================
// API ROUTE: IDENTIFY PART
// ============================================================================
// Identifie une pièce via OCR (Gemini) et recherche web (Perplexity)
// POST /api/ai/identify-part

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// TYPES
// ============================================================================

interface IdentifyPartRequest {
  image?: string; // Base64 encoded image
  query?: string; // Manual reference query
}

interface MarketStats {
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
}

interface IdentifyPartResponse {
  success: boolean;
  data?: {
    reference: string;
    description: string;
    officialImageUrl: string;
    marketStats: MarketStats;
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
// GEMINI OCR - Extract reference from image
// ============================================================================

async function extractReferenceFromImage(base64Image: string): Promise<{
  brand: string;
  model: string;
  rawText: string;
}> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY non configurée');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Remove data URL prefix if present
  const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const systemPrompt = `Tu es un expert technique en équipements de restauration professionnelle (HORECA).
Analyse cette photo d'étiquette industrielle ou de plaque signalétique.

OBJECTIF: Extraire UNIQUEMENT les informations d'identification du produit.

INSTRUCTIONS:
1. Identifie la MARQUE (fabricant) - ex: Danfoss, Embraco, Bitzer, Electrolux, etc.
2. Identifie le NUMÉRO DE MODÈLE/RÉFÉRENCE précis - ex: SC15G, NEK6213GK, etc.
3. Ignore les informations secondaires (numéros de série, dates, certifications).

RÉPONDS UNIQUEMENT en JSON valide:
{
  "brand": "NOM_MARQUE",
  "model": "REFERENCE_MODELE",
  "rawText": "texte brut extrait de l'étiquette"
}

Si l'image est illisible ou ne contient pas d'étiquette, réponds:
{
  "brand": "",
  "model": "",
  "rawText": "ILLISIBLE"
}`;

  const result = await model.generateContent([
    systemPrompt,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData,
      },
    },
  ]);

  const response = result.response.text();

  // Parse JSON response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Impossible d\'extraire les informations de l\'étiquette');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (parsed.rawText === 'ILLISIBLE' || (!parsed.brand && !parsed.model)) {
    throw new Error('Étiquette illisible ou non reconnue. Veuillez prendre une photo plus nette.');
  }

  return parsed;
}

// ============================================================================
// PERPLEXITY SEARCH - Get market info
// ============================================================================

async function searchMarketInfo(reference: string): Promise<{
  description: string;
  officialImageUrl: string;
  marketStats: MarketStats;
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY non configurée');
  }

  const systemPrompt = `Tu es un assistant spécialisé en pièces détachées pour équipements de restauration professionnelle (HORECA).

MISSION: Rechercher des informations précises sur une pièce/équipement.

INSTRUCTIONS:
1. Trouve le NOM COMPLET et la DESCRIPTION technique de ce modèle
2. Trouve une URL d'IMAGE PRODUIT officielle (préférer fond blanc, image produit e-commerce)
3. Recherche les PRIX en Euros sur des sites de vente professionnels français/européens

RÉPONDS UNIQUEMENT en JSON valide:
{
  "description": "Description technique complète",
  "imageUrl": "https://url-image-produit.jpg",
  "minPrice": 150,
  "maxPrice": 280,
  "averagePrice": 215
}

Si tu ne trouves pas d'informations fiables sur les prix, estime une fourchette basée sur des produits similaires.
Les prix doivent être en EUROS, sans TVA (HT).`;

  const messages: PerplexityMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Recherche les informations marché pour: ${reference}` }
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
      max_tokens: 1000,
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
    // Fallback if no JSON found
    return {
      description: `Pièce de référence ${reference}`,
      officialImageUrl: '',
      marketStats: {
        minPrice: 0,
        maxPrice: 0,
        averagePrice: 0,
      },
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    description: parsed.description || `Pièce de référence ${reference}`,
    officialImageUrl: parsed.imageUrl || '',
    marketStats: {
      minPrice: Number(parsed.minPrice) || 0,
      maxPrice: Number(parsed.maxPrice) || 0,
      averagePrice: Number(parsed.averagePrice) || 0,
    },
  };
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<IdentifyPartResponse>> {
  try {
    const body: IdentifyPartRequest = await request.json();
    const { image, query } = body;

    // Validation
    if (!image && !query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Veuillez fournir une image (base64) ou une référence textuelle',
        },
        { status: 400 }
      );
    }

    let reference: string;

    // ÉTAPE 1: OCR si image fournie
    if (image) {
      try {
        const ocrResult = await extractReferenceFromImage(image);
        reference = ocrResult.brand && ocrResult.model
          ? `${ocrResult.brand} ${ocrResult.model}`
          : ocrResult.model || ocrResult.brand;

        if (!reference) {
          return NextResponse.json(
            {
              success: false,
              error: 'Impossible d\'extraire une référence de l\'image. Veuillez entrer la référence manuellement.',
            },
            { status: 422 }
          );
        }
      } catch (ocrError) {
        return NextResponse.json(
          {
            success: false,
            error: ocrError instanceof Error
              ? ocrError.message
              : 'Erreur lors de l\'analyse de l\'image',
          },
          { status: 422 }
        );
      }
    } else {
      reference = query!;
    }

    // ÉTAPE 2: Recherche marché via Perplexity
    const marketInfo = await searchMarketInfo(reference);

    return NextResponse.json({
      success: true,
      data: {
        reference,
        description: marketInfo.description,
        officialImageUrl: marketInfo.officialImageUrl,
        marketStats: marketInfo.marketStats,
      },
    });

  } catch (error) {
    console.error('[identify-part] Erreur:', error);

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
    service: 'identify-part',
    capabilities: ['image-ocr', 'text-search'],
    providers: {
      ocr: 'Google Gemini 1.5 Flash',
      search: 'Perplexity Sonar',
    },
  });
}
