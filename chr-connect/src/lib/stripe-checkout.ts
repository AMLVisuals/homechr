import { getStripe } from './stripe-client';

interface CheckoutParams {
  type: 'MISSION_FEE' | 'PRO_SUBSCRIPTION' | 'PREMIUM_SUBSCRIPTION';
  userId: string;
  email: string;
  missionId?: string;
}

/**
 * Lance une session Stripe Checkout.
 * Redirige l'utilisateur vers la page de paiement Stripe.
 * Si Stripe n'est pas configuré, simule un succès (mode dev).
 */
export async function startCheckout(params: CheckoutParams): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    // Mode mock (Stripe pas configuré)
    if (data.mock) {
      console.warn('[Stripe] Mode mock — paiement simulé');
      return { success: true };
    }

    if (data.error) {
      return { success: false, error: data.error };
    }

    // Redirection vers Stripe Checkout
    if (data.url) {
      const stripe = await getStripe();
      if (stripe) {
        window.location.href = data.url;
      } else {
        window.location.href = data.url;
      }
      return { success: true };
    }

    return { success: false, error: 'URL de paiement non reçue' };
  } catch (error: any) {
    console.error('[Stripe Checkout]', error);
    return { success: false, error: error.message };
  }
}

/**
 * Raccourci : payer les frais de mission (20€, Free tier)
 */
export function payMissionFee(userId: string, email: string, missionId: string) {
  return startCheckout({ type: 'MISSION_FEE', userId, email, missionId });
}

/**
 * Raccourci : s'abonner Pro (49€/mois)
 */
export function subscribePro(userId: string, email: string) {
  return startCheckout({ type: 'PRO_SUBSCRIPTION', userId, email });
}

/**
 * Raccourci : s'abonner Premium (99€/mois)
 */
export function subscribePremium(userId: string, email: string) {
  return startCheckout({ type: 'PREMIUM_SUBSCRIPTION', userId, email });
}
