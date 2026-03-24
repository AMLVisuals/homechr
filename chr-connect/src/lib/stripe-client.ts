import { loadStripe } from '@stripe/stripe-js';

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key || key.includes('REMPLACER')) {
      console.warn('[Stripe] Clé publishable non configurée — paiements désactivés');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
