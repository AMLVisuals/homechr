-- ============================================================================
-- SPRINT 4 — Contractualisation légale
-- Signature électronique (Yousign) + DPAE URSSAF + bulletins PayFit
-- ============================================================================

-- Colonnes signature sur dpae_contracts
ALTER TABLE dpae_contracts ADD COLUMN IF NOT EXISTS yousign_request_id TEXT;
ALTER TABLE dpae_contracts ADD COLUMN IF NOT EXISTS yousign_procedure_id TEXT;
ALTER TABLE dpae_contracts ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'DRAFT' CHECK (signature_status IN (
  'DRAFT',       -- contrat généré mais pas envoyé à signer
  'SENT',        -- envoyé à Yousign, en attente signature
  'SIGNED',      -- tous les signataires ont signé
  'DECLINED',    -- un signataire a refusé
  'EXPIRED',     -- délai expiré
  'CANCELED'     -- annulé par le patron
));
ALTER TABLE dpae_contracts ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT;
ALTER TABLE dpae_contracts ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE dpae_contracts ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contracts_yousign ON dpae_contracts(yousign_request_id);
CREATE INDEX IF NOT EXISTS idx_contracts_signature_status ON dpae_contracts(signature_status);

-- Table liaison PayFit : chaque mission peut générer 1 bulletin via PayFit
CREATE TABLE IF NOT EXISTS payslip_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES profiles(id),
  patron_id UUID NOT NULL REFERENCES profiles(id),
  provider TEXT NOT NULL DEFAULT 'PAYFIT' CHECK (provider IN ('PAYFIT', 'SILAE', 'LUCCA', 'MANUAL')),
  external_id TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'READY', 'FAILED')),
  hours_worked NUMERIC,
  gross_amount NUMERIC,
  net_amount NUMERIC,
  payslip_pdf_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payslip_jobs_mission ON payslip_jobs(mission_id);
CREATE INDEX IF NOT EXISTS idx_payslip_jobs_worker ON payslip_jobs(worker_id);
CREATE INDEX IF NOT EXISTS idx_payslip_jobs_status ON payslip_jobs(status);

ALTER TABLE payslip_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mission participants see payslip jobs"
  ON payslip_jobs FOR SELECT
  USING (auth.uid() = worker_id OR auth.uid() = patron_id);

-- DPAE URSSAF : déjà une table dpae_declarations, on ajoute juste le tracking
ALTER TABLE dpae_declarations ADD COLUMN IF NOT EXISTS submission_mode TEXT DEFAULT 'MOCK' CHECK (submission_mode IN (
  'MOCK',           -- simulé (dev)
  'MANUAL_PDF',     -- patron télécharge le PDF et soumet lui-même à Net-Entreprises
  'API_NET_ENTREPRISES' -- API réelle (quand les credentials seront obtenus)
));
ALTER TABLE dpae_declarations ADD COLUMN IF NOT EXISTS submitted_pdf_url TEXT;
ALTER TABLE dpae_declarations ADD COLUMN IF NOT EXISTS error_message TEXT;
-- Elargir status pour accepter PENDING/VALIDATED utilisés par le service
ALTER TABLE dpae_declarations DROP CONSTRAINT IF EXISTS dpae_declarations_status_check;
ALTER TABLE dpae_declarations ADD CONSTRAINT dpae_declarations_status_check
  CHECK (status IN ('DRAFT','PENDING','SUBMITTED','VALIDATED','ACKNOWLEDGED','ERROR'));
