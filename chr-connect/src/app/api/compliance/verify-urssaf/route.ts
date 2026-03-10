import { NextRequest, NextResponse } from 'next/server';
import { verifyURSSAFAttestation } from '@/services/complianceService';

/**
 * POST /api/compliance/verify-urssaf
 * Vérifie une attestation de vigilance URSSAF
 * Body: { attestationFileUrl: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { attestationFileUrl } = body;

  if (!attestationFileUrl || typeof attestationFileUrl !== 'string') {
    return NextResponse.json(
      { success: false, error: 'L\'URL du fichier d\'attestation est requise.' },
      { status: 400 }
    );
  }

  const result = await verifyURSSAFAttestation(attestationFileUrl);

  return NextResponse.json(result, {
    status: result.success ? 200 : 422,
  });
}
