// ============================================================================
// APP CONFIG - Centralised hardcoded values
// ============================================================================

export const APP_CONFIG = {
  // Tarification
  MISSION_FEE: 20, // Frais de mise en relation (free tier), en euros — inclut l'accès DPAE
  PREMIUM_MONTHLY_PRICE: 100, // Abonnement premium mensuel, en euros
  PREMIUM_TRIAL_DAYS: 7, // Durée essai gratuit, en jours
  PLATFORM_FEE_PERCENT: 0, // Pas de commission % — modèle entremetteur forfaitaire (20€/mission)
  PLATFORM_FEE_RATE: 0, // Idem en décimal

  // Réglementation
  SMIC_HOURLY_RATE: 11.88, // SMIC horaire brut 2024
  DEFAULT_APE_CODE: '5610A', // Code APE restauration traditionnelle

  // Conformité & KYB
  KBIS_VALIDITY_MONTHS: 3, // KBIS valide 3 mois
  URSSAF_VALIDITY_MONTHS: 6, // Attestation URSSAF valide 6 mois
  RC_PRO_VALIDITY_MONTHS: 12, // Assurance RC Pro valide 1 an
  DECENNALE_VALIDITY_MONTHS: 12, // Garantie décennale valide 1 an
  EXPIRY_ALERT_DAYS: 15, // Notification J-15 avant expiration document
  DPAE_REQUIRED_FOR_STAFF: true, // DPAE obligatoire pour extras (bloquante)
  COMPLIANCE_REQUIRED_FOR_FREELANCE: true, // Vérification SIRET/URSSAF obligatoire pour indépendants

  // Defaults
  DEFAULT_OWNER_ID: 'patron_001',
} as const;
