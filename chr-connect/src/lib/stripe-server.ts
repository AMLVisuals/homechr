import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripeServer(): Stripe | null {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.includes('REMPLACER')) {
      console.warn('[Stripe] Clé secrète non configurée — paiements désactivés');
      return null;
    }
    stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });
  }
  return stripe;
}

// ============================================================================
// PRIX — IDs des produits Stripe (à créer dans le dashboard Stripe)
// ============================================================================
// Quand tu auras créé les produits dans Stripe, remplace ces valeurs
// par les vrais Price IDs (format: price_xxxxxxxxxxxxxxxx)

export const STRIPE_PRICES = {
  // Paiement unique 20€ par mission (Free tier)
  MISSION_FEE: process.env.STRIPE_PRICE_MISSION_FEE || 'price_mission_fee_placeholder',

  // Abonnement Pro 49€/mois
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_placeholder',

  // Abonnement Premium 99€/mois
  PREMIUM_MONTHLY: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly_placeholder',

  // Fiche de paie supplémentaire 8€ (Premium, au-delà de 5)
  PAYSLIP_EXTRA: process.env.STRIPE_PRICE_PAYSLIP_EXTRA || 'price_payslip_extra_placeholder',
};
