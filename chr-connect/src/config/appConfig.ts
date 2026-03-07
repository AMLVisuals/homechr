// ============================================================================
// APP CONFIG - Centralised hardcoded values
// ============================================================================

export const APP_CONFIG = {
  // Tarification
  MISSION_FEE: 20, // Frais de mise en relation (free tier), en euros
  PREMIUM_MONTHLY_PRICE: 100, // Abonnement premium mensuel, en euros
  PREMIUM_TRIAL_DAYS: 7, // Durée essai gratuit, en jours
  PLATFORM_FEE_PERCENT: 15, // Commission plateforme (%)
  PLATFORM_FEE_RATE: 0.15, // Commission plateforme (décimal)

  // Réglementation
  SMIC_HOURLY_RATE: 11.88, // SMIC horaire brut 2024
  DEFAULT_APE_CODE: '5610A', // Code APE restauration traditionnelle

  // Defaults
  DEFAULT_OWNER_ID: 'patron_001',
} as const;
