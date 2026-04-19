import { getStripeServer } from './stripe-server';
import { getAdminSupabase } from './push-server';

export const PLATFORM_FEE_BPS = 1500; // 15% commission plateforme (en basis points)
export const STAFF_RATE_CAPTURE_DELAY_HOURS = 48;

function computePlatformFee(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
}

/**
 * Crée un compte Stripe Connect Express pour un worker.
 * Idempotent : si profile.stripe_account_id existe déjà, renvoie celui-là.
 */
export async function ensureConnectAccount(userId: string, email: string): Promise<{
  accountId: string;
  isNew: boolean;
}> {
  const stripe = getStripeServer();
  if (!stripe) throw new Error('Stripe non configuré');

  const admin = getAdminSupabase();

  const { data: profile, error } = await admin
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', userId)
    .single();

  if (error) throw error;

  if (profile?.stripe_account_id) {
    return { accountId: profile.stripe_account_id, isNew: false };
  }

  const account = await stripe.accounts.create({
    type: 'express',
    email,
    country: 'FR',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: { user_id: userId },
  });

  await admin
    .from('profiles')
    .update({
      stripe_account_id: account.id,
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_details_submitted: account.details_submitted ?? false,
    })
    .eq('id', userId);

  return { accountId: account.id, isNew: true };
}

/**
 * Crée un lien d'onboarding hébergé par Stripe pour compléter KYC + RIB.
 */
export async function createOnboardingLink(accountId: string, origin: string): Promise<string> {
  const stripe = getStripeServer();
  if (!stripe) throw new Error('Stripe non configuré');

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/prestataire/mon-profil?stripe=refresh`,
    return_url: `${origin}/prestataire/mon-profil?stripe=return`,
    type: 'account_onboarding',
  });

  return link.url;
}

/**
 * Récupère le statut courant d'un compte Connect + sync la BDD.
 */
export async function syncConnectAccountStatus(userId: string): Promise<{
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: string[];
}> {
  const stripe = getStripeServer();
  if (!stripe) throw new Error('Stripe non configuré');

  const admin = getAdminSupabase();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', userId)
    .single();

  if (!profile?.stripe_account_id) {
    return {
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      requirementsDue: [],
    };
  }

  const account = await stripe.accounts.retrieve(profile.stripe_account_id);

  await admin
    .from('profiles')
    .update({
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_details_submitted: account.details_submitted ?? false,
    })
    .eq('id', userId);

  return {
    accountId: account.id,
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
    requirementsDue: account.requirements?.currently_due ?? [],
  };
}

/**
 * Récupère ou crée un Customer Stripe pour un patron (pour stocker ses moyens de paiement).
 */
export async function ensureCustomer(userId: string, email: string): Promise<string> {
  const stripe = getStripeServer();
  if (!stripe) throw new Error('Stripe non configuré');

  const admin = getAdminSupabase();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  await admin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

/**
 * Crée un PaymentIntent préauto pour une mission.
 * Fonds bloqués sur carte du patron, transfert vers worker à la capture.
 * Montant exprimé en EUROS (sera converti en cents).
 */
export async function preauthorizeMissionPayment(params: {
  missionId: string;
  amountEuros: number;
  patronUserId: string;
  workerUserId: string;
  patronEmail: string;
}): Promise<{ paymentIntentId: string; clientSecret: string }> {
  const stripe = getStripeServer();
  if (!stripe) throw new Error('Stripe non configuré');

  const admin = getAdminSupabase();
  const amountCents = Math.round(params.amountEuros * 100);
  if (amountCents < 50) throw new Error('Montant minimum 0.50€');

  const { data: worker } = await admin
    .from('profiles')
    .select('stripe_account_id, stripe_charges_enabled')
    .eq('id', params.workerUserId)
    .single();

  if (!worker?.stripe_account_id || !worker.stripe_charges_enabled) {
    throw new Error('Le prestataire doit compléter son onboarding Stripe avant de recevoir des paiements');
  }

  const customerId = await ensureCustomer(params.patronUserId, params.patronEmail);
  const platformFee = computePlatformFee(amountCents);

  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'eur',
    customer: customerId,
    capture_method: 'manual',
    payment_method_types: ['card'],
    application_fee_amount: platformFee,
    transfer_data: { destination: worker.stripe_account_id },
    metadata: {
      mission_id: params.missionId,
      patron_id: params.patronUserId,
      worker_id: params.workerUserId,
    },
  });

  await admin
    .from('missions')
    .update({
      stripe_payment_intent_id: pi.id,
      payment_status: 'PENDING',
      authorized_amount: params.amountEuros,
      platform_fee_amount: platformFee / 100,
    })
    .eq('id', params.missionId);

  return { paymentIntentId: pi.id, clientSecret: pi.client_secret || '' };
}

/**
 * Capture un PaymentIntent préautorisé (une fois la mission terminée).
 */
export async function capturePayment(missionId: string): Promise<{ captured: boolean; amount: number }> {
  const stripe = getStripeServer();
  if (!stripe) throw new Error('Stripe non configuré');

  const admin = getAdminSupabase();
  const { data: mission } = await admin
    .from('missions')
    .select('stripe_payment_intent_id, payment_status')
    .eq('id', missionId)
    .single();

  if (!mission?.stripe_payment_intent_id) throw new Error('Aucun paiement à capturer');
  if (mission.payment_status === 'CAPTURED') return { captured: false, amount: 0 };

  const pi = await stripe.paymentIntents.capture(mission.stripe_payment_intent_id);

  await admin
    .from('missions')
    .update({
      payment_status: 'CAPTURED',
      captured_amount: (pi.amount_received || 0) / 100,
      captured_at: new Date().toISOString(),
    })
    .eq('id', missionId);

  return { captured: true, amount: (pi.amount_received || 0) / 100 };
}

/**
 * Annule un PaymentIntent préautorisé et libère les fonds (mission annulée avant démarrage).
 */
export async function releasePayment(missionId: string): Promise<{ released: boolean }> {
  const stripe = getStripeServer();
  if (!stripe) throw new Error('Stripe non configuré');

  const admin = getAdminSupabase();
  const { data: mission } = await admin
    .from('missions')
    .select('stripe_payment_intent_id, payment_status')
    .eq('id', missionId)
    .single();

  if (!mission?.stripe_payment_intent_id) return { released: false };
  if (mission.payment_status === 'CAPTURED') {
    throw new Error('Fonds déjà capturés — utiliser remboursement');
  }

  await stripe.paymentIntents.cancel(mission.stripe_payment_intent_id);

  await admin
    .from('missions')
    .update({ payment_status: 'RELEASED' })
    .eq('id', missionId);

  return { released: true };
}
