import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, STRIPE_PRICES } from '@/lib/stripe-server';

/**
 * POST /api/stripe/checkout
 * Crée une session Stripe Checkout pour :
 * - Paiement unique 20€ (mission fee, Free tier)
 * - Abonnement Pro 49€/mois
 * - Abonnement Premium 99€/mois
 */
export async function POST(req: NextRequest) {
  const stripe = getStripeServer();

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe non configuré', mock: true, url: '/patron/tableau-de-bord' },
      { status: 200 }
    );
  }

  try {
    const body = await req.json();
    const { type, userId, email, missionId, successUrl, cancelUrl } = body;

    let lineItems;
    let mode: 'payment' | 'subscription';

    switch (type) {
      case 'MISSION_FEE':
        mode = 'payment';
        lineItems = [{ price: STRIPE_PRICES.MISSION_FEE, quantity: 1 }];
        break;
      case 'PRO_SUBSCRIPTION':
        mode = 'subscription';
        lineItems = [{ price: STRIPE_PRICES.PRO_MONTHLY, quantity: 1 }];
        break;
      case 'PREMIUM_SUBSCRIPTION':
        mode = 'subscription';
        lineItems = [{ price: STRIPE_PRICES.PREMIUM_MONTHLY, quantity: 1 }];
        break;
      default:
        return NextResponse.json({ error: 'Type de paiement invalide' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: lineItems,
      customer_email: email,
      metadata: {
        userId,
        type,
        missionId: missionId || '',
      },
      success_url: successUrl || `${req.nextUrl.origin}/patron/tableau-de-bord?payment=success`,
      cancel_url: cancelUrl || `${req.nextUrl.origin}/patron/tableau-de-bord?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[Stripe Checkout]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
