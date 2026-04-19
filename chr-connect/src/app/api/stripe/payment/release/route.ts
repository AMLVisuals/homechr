import { NextRequest, NextResponse } from 'next/server';
import { releasePayment } from '@/lib/stripe-connect';

/**
 * POST /api/stripe/payment/release
 * Body: { missionId }
 * Annule le PaymentIntent préautorisé (mission annulée avant démarrage).
 */
export async function POST(req: NextRequest) {
  try {
    const { missionId } = await req.json();
    if (!missionId) return NextResponse.json({ error: 'missionId requis' }, { status: 400 });

    const result = await releasePayment(missionId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[stripe/payment/release]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
