import { NextRequest, NextResponse } from 'next/server';
import { verifySiret } from '@/services/complianceService';

/**
 * POST /api/compliance/verify-siret
 * Vérifie un numéro SIRET via l'API Sirene / Pappers
 * Body: { siret: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { siret } = body;

  if (!siret || typeof siret !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Le numéro SIRET est requis.' },
      { status: 400 }
    );
  }

  const result = await verifySiret(siret);

  return NextResponse.json(result, {
    status: result.success ? 200 : 422,
  });
}
