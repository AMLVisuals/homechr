// ============================================================================
// HOOK: useQuoteIntelligence
// ============================================================================
// Hook React pour l'analyse intelligente des devis
// Gère les appels API, le cache, et l'état

import { useState, useCallback } from 'react';
import type {
  QuoteAnalysisRequest,
  QuoteAnalysisResult,
  IdentifiedPart,
} from '@/lib/quote-intelligence/types';

// ============================================================================
// TYPES
// ============================================================================

interface UseQuoteIntelligenceOptions {
  region?: 'paris' | 'idf' | 'province';
  includeHistory?: boolean;
  deepAnalysis?: boolean;
}

interface UseQuoteIntelligenceReturn {
  // Analysis
  analysis: QuoteAnalysisResult | null;
  isAnalyzing: boolean;
  analyzeQuote: (quote: QuoteAnalysisRequest) => Promise<QuoteAnalysisResult | null>;

  // Part Identification
  identifiedParts: Map<string, IdentifiedPart>;
  isIdentifying: boolean;
  identifyPart: (input: {
    reference?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    imageBase64?: string;
  }) => Promise<IdentifiedPart | null>;

  // Price Validation
  isValidating: boolean;
  validatePrice: (reference: string, price: number) => Promise<{
    status: 'FAIR' | 'HIGH' | 'SUSPICIOUS';
    trustScore: number;
    message: string;
  } | null>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useQuoteIntelligence(
  options: UseQuoteIntelligenceOptions = {}
): UseQuoteIntelligenceReturn {
  const [analysis, setAnalysis] = useState<QuoteAnalysisResult | null>(null);
  const [identifiedParts, setIdentifiedParts] = useState<Map<string, IdentifiedPart>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Identify a single part
  const identifyPart = useCallback(async (input: {
    reference?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    imageBase64?: string;
  }): Promise<IdentifiedPart | null> => {
    setIsIdentifying(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-quote', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Échec de l\'identification');
      }

      if (data.part) {
        // Add to cache
        setIdentifiedParts((prev) => {
          const next = new Map(prev);
          next.set(data.part.reference, data.part);
          return next;
        });
        return data.part;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur d\'identification';
      setError(message);
      return null;
    } finally {
      setIsIdentifying(false);
    }
  }, []);

  // Analyze complete quote
  const analyzeQuote = useCallback(async (
    quote: QuoteAnalysisRequest
  ): Promise<QuoteAnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote,
          options: {
            region: options.region || 'province',
            includeHistory: options.includeHistory ?? true,
            deepAnalysis: options.deepAnalysis ?? false,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Échec de l\'analyse');
      }

      setAnalysis(data.analysis);

      // Cache any identified parts
      if (data.analysis?.itemAnalysis) {
        setIdentifiedParts((prev) => {
          const next = new Map(prev);
          for (const item of data.analysis.itemAnalysis) {
            if (item.identifiedPart) {
              next.set(item.identifiedPart.reference, item.identifiedPart);
            }
          }
          return next;
        });
      }

      return data.analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur d\'analyse';
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [options.region, options.includeHistory, options.deepAnalysis]);

  // Validate a single price
  const validatePrice = useCallback(async (
    reference: string,
    price: number
  ): Promise<{ status: 'FAIR' | 'HIGH' | 'SUSPICIOUS'; trustScore: number; message: string } | null> => {
    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/validate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, quotedPrice: price }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Échec de la validation');
      }

      return {
        status: data.status,
        trustScore: data.trustScore,
        message: data.message,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de validation';
      setError(message);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    analysis,
    isAnalyzing,
    analyzeQuote,
    identifiedParts,
    isIdentifying,
    identifyPart,
    isValidating,
    validatePrice,
    error,
    clearError,
  };
}

export default useQuoteIntelligence;
