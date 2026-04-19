import { NextRequest, NextResponse } from 'next/server';
import { preauthorizeMissionPayment } from '@/lib/stripe-connect';

/**
 * POST /api/stripe/payment/preauth
 * Body: { missionId, amountEuros, patronUserId, workerUserId, patronEmail }
 * Crée un PaymentIntent préauto (capture_method=manual) côté patron vers worker.
 * Renvoie clientSecret pour confirmer la carte dans le front.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { missionId, amountEuros, patronUserId, workerUserId, patronEmail } = body;

    if (!missionId || !amountEuros || !patronUserId || !workerUserId || !patronEmail) {
      return NextResponse.json(
        { error: 'missionId, amountEuros, patronUserId, workerUserId, patronEmail requis' },
        { status: 400 }
      );
    }

    const result = await preauthorizeMissionPayment({
      missionId,
      amountEuros: Number(amountEuros),
      patronUserId,
      workerUserId,
      patronEmail,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[stripe/payment/preauth]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
