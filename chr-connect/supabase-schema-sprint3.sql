-- ============================================================================
-- SPRINT 3 — Stripe Connect marketplace
-- Colonnes Stripe Connect sur profiles + paiement sur missions
-- ============================================================================

-- Profils : comptes Stripe Connect Express (workers + patrons qui payent)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- Missions : paiement préauto + capture
ALTER TABLE missions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN (
  'NONE',        -- pas encore initié
  'PENDING',     -- PaymentIntent créé mais pas encore authorisé
  'AUTHORIZED',  -- fonds bloqués sur carte patron (préauto)
  'CAPTURED',    -- fonds prélevés + transférés vers Connect account worker
  'RELEASED',    -- préauto libérée (annulation avant capture)
  'REFUNDED',    -- remboursé après capture
  'FAILED'       -- paiement échoué
));
ALTER TABLE missions ADD COLUMN IF NOT EXISTS authorized_amount NUMERIC;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS captured_amount NUMERIC;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS authorized_at TIMESTAMPTZ;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_missions_payment_intent ON missions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_missions_payment_status ON missions(payment_status);

-- Table d'audit des événements Stripe Connect (webhook log)
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  object_id TEXT,
  account_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  received_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_object ON stripe_events(object_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_account ON stripe_events(account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed) WHERE processed = false;

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
-- Seul le service_role peut lire/écrire dans stripe_events, donc pas de policy accessible aux users
