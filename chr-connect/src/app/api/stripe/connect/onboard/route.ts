import { NextRequest, NextResponse } from 'next/server';
import { ensureConnectAccount, createOnboardingLink } from '@/lib/stripe-connect';

/**
 * POST /api/stripe/connect/onboard
 * Body: { userId: string, email: string }
 * Crée (ou récupère) un compte Connect Express, renvoie un lien d'onboarding.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();
    if (!userId || !email) {
      return NextResponse.json({ error: 'userId et email requis' }, { status: 400 });
    }

    const { accountId } = await ensureConnectAccount(userId, email);

    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const url = await createOnboardingLink(accountId, origin);

    return NextResponse.json({ ok: true, accountId, onboardingUrl: url });
  } catch (err: any) {
    console.error('[stripe/connect/onboard]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
