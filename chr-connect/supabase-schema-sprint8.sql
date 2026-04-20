-- ============================================================================
-- SPRINT 8 — Facturation électronique (loi septembre 2026)
-- Factur-X + PDP/PPF transmission + historique envois + archivage 10 ans
-- ============================================================================

-- Colonnes facturation électronique sur invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS electronic_status TEXT
    CHECK (electronic_status IN ('DRAFT','ISSUED','TRANSMITTED','DELIVERED','PAID','REJECTED','NONE'))
    DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS transmission_channel TEXT
    CHECK (transmission_channel IN ('PDP','PPF','EMAIL','MANUAL','NONE'))
    DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS transmitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transmission_reference TEXT,   -- ID de la plateforme PDP/PPF
  ADD COLUMN IF NOT EXISTS archive_until DATE,            -- 10 ans après émission (L.123-22 C. com.)
  ADD COLUMN IF NOT EXISTS facturx_xml_url TEXT;          -- XML CII embarqué/séparé

-- Historique des envois (audit trail complet)
CREATE TABLE IF NOT EXISTS invoice_send_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'GENERATED','TRANSMITTED','DELIVERED','REJECTED','REMINDER_SENT','PAID'
  )),
  channel TEXT CHECK (channel IN ('PDP','PPF','EMAIL','MANUAL','NONE')),
  target TEXT,                                             -- destinataire (email, SIRET client, etc.)
  external_reference TEXT,                                 -- ID retour plateforme
  payload JSONB,                                           -- réponse brute de la PDP/PPF
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE invoice_send_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Invoice history via mission participants" ON invoice_send_history FOR ALL
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE mission_id IN (
      SELECT id FROM missions WHERE patron_id = auth.uid() OR provider_id = auth.uid()
    )
  ));
CREATE POLICY "Admins read invoice history" ON invoice_send_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE INDEX IF NOT EXISTS idx_invoice_history_invoice ON invoice_send_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_history_event ON invoice_send_history(event_type);

-- Auto-calcul de archive_until (10 ans) quand la facture passe en ISSUED
CREATE OR REPLACE FUNCTION set_invoice_archive_until() RETURNS trigger AS $$
BEGIN
  IF NEW.electronic_status = 'ISSUED' AND NEW.archive_until IS NULL THEN
    NEW.archive_until := (COALESCE(NEW.date, CURRENT_DATE) + INTERVAL '10 years')::date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_archive_until ON invoices;
CREATE TRIGGER trg_invoice_archive_until
  BEFORE INSERT OR UPDATE OF electronic_status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_archive_until();
