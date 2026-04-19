import { NextRequest, NextResponse } from 'next/server';
import { capturePayment } from '@/lib/stripe-connect';

/**
 * POST /api/stripe/payment/capture
 * Body: { missionId }
 * Capture le PaymentIntent préautorisé (mission terminée).
 */
export async function POST(req: NextRequest) {
  try {
    const { missionId } = await req.json();
    if (!missionId) return NextResponse.json({ error: 'missionId requis' }, { status: 400 });

    const result = await capturePayment(missionId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[stripe/payment/capture]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
