import { NextRequest, NextResponse } from 'next/server';
import { getExpiringDocuments, getExpiredDocuments } from '@/services/complianceService';
import type { ComplianceDocument } from '@/types/compliance';

/**
 * POST /api/compliance/check-expiry
 * Vérifie les documents proches de l'expiration ou expirés
 * Body: { documents: ComplianceDocument[], daysBeforeExpiry?: number }
 *
 * En production : appelé par un CRON job quotidien
 * Actuellement : appelé à la demande depuis le frontend
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { documents, daysBeforeExpiry } = body;

  if (!documents || !Array.isArray(documents)) {
    return NextResponse.json(
      { success: false, error: 'La liste des documents est requise.' },
      { status: 400 }
    );
  }

  const typedDocs = documents as ComplianceDocument[];
  const expiring = getExpiringDocuments(typedDocs, daysBeforeExpiry);
  const expired = getExpiredDocuments(typedDocs);

  return NextResponse.json({
    success: true,
    expiring: expiring.map(d => ({ id: d.id, type: d.type, expiresAt: d.expiresAt })),
    expired: expired.map(d => ({ id: d.id, type: d.type, expiresAt: d.expiresAt })),
    summary: {
      totalDocuments: typedDocs.length,
      expiringCount: expiring.length,
      expiredCount: expired.length,
    },
  });
}
