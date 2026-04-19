import { NextRequest, NextResponse } from 'next/server';
import { syncConnectAccountStatus } from '@/lib/stripe-connect';

/**
 * GET /api/stripe/connect/status?userId=xxx
 * Renvoie le statut du compte Connect : charges/payouts enabled, details submitted, requirements.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const status = await syncConnectAccountStatus(userId);
    return NextResponse.json({ ok: true, ...status });
  } catch (err: any) {
    console.error('[stripe/connect/status]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
