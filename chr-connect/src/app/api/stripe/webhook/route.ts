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

  // Idempotence : ignore l'événement s'il a déjà été traité
  if (event?.id) {
    const { data: existing } = await supabaseAdmin
      .from('stripe_events')
      .select('id, processed')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    if (existing?.processed) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await supabaseAdmin.from('stripe_events').upsert(
      {
        stripe_event_id: event.id,
        type: event.type,
        object_id: (event.data?.object as any)?.id || null,
        account_id: (event as any).account || null,
        payload: event,
        processed: false,
      },
      { onConflict: 'stripe_event_id' }
    );
  }

  try {
    switch (event.type) {
      // ── Compte Connect mis à jour (KYC progressé / terminé) ──
      case 'account.updated': {
        const account = event.data.object;
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_charges_enabled: account.charges_enabled ?? false,
            stripe_payouts_enabled: account.payouts_enabled ?? false,
            stripe_details_submitted: account.details_submitted ?? false,
          })
          .eq('stripe_account_id', account.id);
        break;
      }

      // ── Préauto réussie : fonds bloqués sur carte patron ──
      case 'payment_intent.amount_capturable_updated':
      case 'payment_intent.requires_action': {
        const pi = event.data.object;
        const missionId = pi.metadata?.mission_id;
        if (missionId && pi.amount_capturable > 0) {
          await supabaseAdmin
            .from('missions')
            .update({
              payment_status: 'AUTHORIZED',
              authorized_at: new Date().toISOString(),
            })
            .eq('id', missionId);
        }
        break;
      }

      // ── Paiement capturé (fonds transférés au worker via Connect) ──
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const missionId = pi.metadata?.mission_id;
        if (missionId) {
          await supabaseAdmin
            .from('missions')
            .update({
              payment_status: 'CAPTURED',
              captured_amount: (pi.amount_received || 0) / 100,
              captured_at: new Date().toISOString(),
            })
            .eq('id', missionId);
        }
        break;
      }

      // ── Paiement échoué ──
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const missionId = pi.metadata?.mission_id;
        if (missionId) {
          await supabaseAdmin
            .from('missions')
            .update({ payment_status: 'FAILED' })
            .eq('id', missionId);
        }
        break;
      }

      // ── Remboursement ──
      case 'charge.refunded': {
        const charge = event.data.object;
        const piId = charge.payment_intent;
        if (piId) {
          await supabaseAdmin
            .from('missions')
            .update({ payment_status: 'REFUNDED' })
            .eq('stripe_payment_intent_id', piId);
        }
        break;
      }

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

      // ── Paiement échoué sur abonnement ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.warn('[Stripe] Paiement échoué pour subscription:', invoice.subscription);
        break;
      }
    }

    if (event?.id) {
      await supabaseAdmin
        .from('stripe_events')
        .update({ processed: true })
        .eq('stripe_event_id', event.id);
    }
  } catch (error: any) {
    console.error('[Stripe Webhook] Processing error:', error);
    if (event?.id) {
      await supabaseAdmin
        .from('stripe_events')
        .update({ error: error?.message || String(error) })
        .eq('stripe_event_id', event.id);
    }
  }

  return NextResponse.json({ received: true });
}
