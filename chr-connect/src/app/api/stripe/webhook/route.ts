import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe-server';
import { createClient } from '@supabase/supabase-js';

// Client admin Supabase (server-side, bypasse RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/stripe/webhook
 * Reçoit les événements Stripe (checkout.session.completed, invoice.paid, etc.)
 * Met à jour Supabase en conséquence.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripeServer();

  if (!stripe) {
    return NextResponse.json({ received: true, mock: true });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.includes('REMPLACER')) {
      // En dev sans webhook secret, on parse directement
      event = JSON.parse(body);
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Paiement unique réussi (mission fee 20€) ──
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, type, missionId } = session.metadata || {};

        if (type === 'MISSION_FEE' && missionId) {
          // Marquer la mission comme payée
          await supabaseAdmin
            .from('missions')
            .update({ paid_relation_fee: true, relation_fee_amount: 20 })
            .eq('id', missionId);
        }

        if (type === 'PRO_SUBSCRIPTION' || type === 'PREMIUM_SUBSCRIPTION') {
          const tier = type === 'PRO_SUBSCRIPTION' ? 'PRO' : 'PREMIUM';
          // Mettre à jour le profil
          await supabaseAdmin
            .from('profiles')
            .update({ subscription_tier: tier })
            .eq('id', userId);

          // Créer l'entrée subscription
          await supabaseAdmin.from('subscriptions').insert({
            user_id: userId,
            plan: tier,
            amount: tier === 'PRO' ? 49 : 99,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'ACTIVE',
            stripe_subscription_id: session.subscription || null,
          });
        }
        break;
      }

      // ── Abonnement renouvelé (paiement mensuel récurrent) ──
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          // Prolonger la date de fin
          await supabaseAdmin
            .from('subscriptions')
            .update({
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'ACTIVE',
            })
            .eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      // ── Abonnement annulé ──
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'CANCELLED' })
          .eq('stripe_subscription_id', subscription.id);

        // Repasser le profil en FREE
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (sub?.user_id) {
          await supabaseAdmin
            .from('profiles')
            .update({ subscription_tier: 'FREE' })
            .eq('id', sub.user_id);
        }
        break;
      }

      // ── Paiement échoué ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.warn('[Stripe] Paiement échoué pour subscription:', invoice.subscription);
        break;
      }
    }
  } catch (error) {
    console.error('[Stripe Webhook] Processing error:', error);
  }

  return NextResponse.json({ received: true });
}
