-- ============================================================================
-- HOME CHR - SCHEMA SUPABASE COMPLET
-- À exécuter dans le SQL Editor de Supabase (en une seule fois)
-- ============================================================================
-- Note: la table "profiles" existe déjà (créée à l'étape 3)
-- Ce script crée toutes les autres tables nécessaires
-- ============================================================================

-- ============================================================================
-- 1. VENUES (Établissements) — centre de gravité du modèle
-- ============================================================================
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  zip_code TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'FR',
  category TEXT DEFAULT '',
  photo_url TEXT,
  google_place_id TEXT,
  rating NUMERIC(3,2),
  review_count INT,
  price_level SMALLINT,
  capacity INT,
  surface INT,
  team_size INT,
  concept TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT false,
  last_verified TIMESTAMPTZ,
  -- Access
  access_digicode TEXT,
  access_contact_name TEXT,
  access_contact_phone TEXT,
  access_instructions TEXT,
  access_wifi_ssid TEXT,
  access_wifi_password TEXT,
  -- Technical
  tech_elec_type TEXT CHECK (tech_elec_type IN ('MONO','TRI','UNKNOWN')),
  tech_gas_type TEXT CHECK (tech_gas_type IN ('TOWN','BOTTLE','NONE')),
  tech_has_freight_elevator BOOLEAN DEFAULT false,
  tech_has_elevator BOOLEAN DEFAULT false,
  tech_delivery_access TEXT CHECK (tech_delivery_access IN ('STREET','COURTYARD','BACKDOOR')),
  tech_kitchen_type TEXT CHECK (tech_kitchen_type IN ('OPEN','CLOSED','SEMI_OPEN')),
  tech_has_ventilation BOOLEAN DEFAULT false,
  tech_has_air_conditioning BOOLEAN DEFAULT false,
  -- Equipment
  equip_pos_system TEXT,
  equip_has_terrace BOOLEAN,
  equip_has_private_rooms BOOLEAN,
  equip_has_bar BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE venue_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('FACADE','DINING_ROOM','KITCHEN','BAR','ACCESS','ELECTRICAL_PANEL','OTHER')),
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE venue_opening_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false
);

-- ============================================================================
-- 2. EQUIPMENT (Parc machines)
-- ============================================================================
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  category TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  serial_number TEXT,
  nickname TEXT,
  location TEXT DEFAULT '',
  spec_voltage TEXT,
  spec_power TEXT,
  spec_gas_type TEXT CHECK (spec_gas_type IN ('R134a','R404A','R290','OTHER')),
  spec_capacity TEXT,
  spec_dimensions TEXT,
  installation_date DATE,
  purchase_date DATE,
  warranty_expiry DATE,
  last_service_date DATE,
  next_service_due DATE,
  status TEXT NOT NULL DEFAULT 'OPERATIONAL' CHECK (status IN ('OPERATIONAL','WARNING','FAULT','MAINTENANCE')),
  health_score INT CHECK (health_score BETWEEN 0 AND 100),
  qr_code_id TEXT UNIQUE,
  qr_code_url TEXT,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE equipment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('OVERVIEW','NAMEPLATE','SERIAL','FAULT','REPAIR')),
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES profiles(id)
);

CREATE TABLE equipment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('MANUAL','INVOICE','WARRANTY','TECHNICAL_SHEET','MAINTENANCE_REPORT','OTHER')),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  file_size TEXT,
  mime_type TEXT,
  annotations JSONB,
  file_original_name TEXT
);

-- ============================================================================
-- 3. MISSIONS (Coeur du business)
-- ============================================================================
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  venue_id UUID REFERENCES venues(id),
  equipment_id UUID REFERENCES equipment(id),
  patron_id UUID NOT NULL REFERENCES profiles(id),
  provider_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL DEFAULT '',
  category TEXT,
  status TEXT NOT NULL DEFAULT 'SEARCHING' CHECK (status IN (
    'DRAFT','SEARCHING','MATCHED','SCHEDULED','ON_WAY','ON_SITE','IN_PROGRESS',
    'COMPLETED','CANCELLED','DIAGNOSING','QUOTE_SENT','STANDBY',
    'PENDING_VALIDATION','AWAITING_PATRON_CONFIRMATION','DISPUTED'
  )),
  priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT','EMERGENCY')),
  description TEXT,
  problem_id TEXT,
  problem_label TEXT,
  price_estimated_min NUMERIC,
  price_estimated_max NUMERIC,
  price_final NUMERIC,
  urgent BOOLEAN DEFAULT false,
  scheduled BOOLEAN DEFAULT false,
  required_workers INT DEFAULT 1,
  skills TEXT[],
  attributes JSONB,
  icon_name TEXT,
  color TEXT,
  before_photo TEXT,
  after_photo TEXT,
  evidence JSONB,
  report TEXT,
  notes TEXT[],
  match_score INT,
  parts_status TEXT CHECK (parts_status IN ('PART_ORDERED','PART_RECEIVED')),
  parts_description TEXT,
  -- DPAE / Compliance
  dpae_status TEXT DEFAULT 'NOT_REQUIRED' CHECK (dpae_status IN ('NOT_REQUIRED','PENDING','VALIDATED','ERROR')),
  dpae_receipt_id TEXT,
  actual_hours_worked NUMERIC,
  payslip_url TEXT,
  -- Payment
  paid_relation_fee BOOLEAN DEFAULT false,
  relation_fee_amount NUMERIC,
  -- Provider tracking
  provider_eta INT,
  provider_location JSONB,
  estimated_duration INT,
  -- Staffing
  staffing_role TEXT,
  staffing_date DATE,
  staffing_start_time TEXT,
  staffing_end_time TEXT,
  staffing_number_of_people INT,
  staffing_hourly_rate NUMERIC,
  -- Dates
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mission_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  specialty TEXT DEFAULT '',
  rating NUMERIC(3,2),
  avatar TEXT,
  completed_missions INT DEFAULT 0,
  applied_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','REJECTED')),
  message TEXT
);

CREATE TABLE mission_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  photos TEXT[],
  videos TEXT[],
  date TIMESTAMPTZ DEFAULT now(),
  revealed_at TIMESTAMPTZ
);

CREATE TABLE mission_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID UNIQUE NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'NO_SHOW','QUALITY_ISSUE','INCOMPLETE_WORK','DAMAGE',
    'LATE_ARRIVAL','UNPROFESSIONAL','BILLING_DISPUTE','OTHER'
  )),
  description TEXT NOT NULL DEFAULT '',
  photos TEXT[],
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED_PATRON','RESOLVED_PROVIDER','CLOSED')),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  replacement_mission_id UUID REFERENCES missions(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. MAINTENANCE RECORDS
-- ============================================================================
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id),
  type TEXT CHECK (type IN ('REPAIR','PREVENTIVE','INSTALLATION','INSPECTION')),
  description TEXT NOT NULL DEFAULT '',
  fault_type TEXT,
  resolution TEXT,
  technician_id UUID REFERENCES profiles(id),
  technician_name TEXT,
  technician_rating NUMERIC(3,2),
  cost NUMERIC,
  parts_replaced TEXT[],
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration INT,
  photos JSONB
);

-- ============================================================================
-- 5. QUOTES & INVOICES
-- ============================================================================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  establishment_id UUID REFERENCES venues(id),
  reference TEXT UNIQUE,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED','INVOICED')),
  validity_days INT DEFAULT 30,
  valid_until TIMESTAMPTZ,
  subtotal_ht NUMERIC DEFAULT 0,
  total_tva NUMERIC DEFAULT 0,
  total_ttc NUMERIC DEFAULT 0,
  platform_fee_rate NUMERIC DEFAULT 0.15,
  platform_fee_amount NUMERIC DEFAULT 0,
  provider_net_amount NUMERIC DEFAULT 0,
  distance_km DOUBLE PRECISION,
  travel_zone TEXT,
  notes TEXT,
  terms_and_conditions TEXT,
  client_signature TEXT,
  client_signed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('LABOR','PART','TRAVEL','DIAGNOSTIC','EMERGENCY_FEE','OTHER')),
  reference TEXT,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'unité',
  unit_price_ht NUMERIC DEFAULT 0,
  tva_rate TEXT DEFAULT 'STANDARD' CHECK (tva_rate IN ('STANDARD','REDUCED','SUPER_REDUCED')),
  total_ht NUMERIC DEFAULT 0,
  total_ttc NUMERIC DEFAULT 0,
  sort_order INT DEFAULT 0
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  reference TEXT UNIQUE,
  date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','PAID','OVERDUE','CANCELLED','REFUNDED','PENDING')),
  subtotal_ht NUMERIC DEFAULT 0,
  total_tva NUMERIC DEFAULT 0,
  total_ttc NUMERIC DEFAULT 0,
  platform_fee_amount NUMERIC DEFAULT 0,
  provider_net_amount NUMERIC DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('CARD','TRANSFER','CHECK','CASH')),
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC,
  settled_to_provider_at TIMESTAMPTZ,
  file_url TEXT,
  issuer_name TEXT,
  issuer_address TEXT,
  issuer_siret TEXT,
  issuer_email TEXT,
  client_name TEXT,
  client_address TEXT,
  client_vat_number TEXT,
  sent_at TIMESTAMPTZ,
  history JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('LABOR','PART','TRAVEL','DIAGNOSTIC','EMERGENCY_FEE','OTHER')),
  reference TEXT,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'unité',
  unit_price_ht NUMERIC DEFAULT 0,
  tva_rate TEXT DEFAULT 'STANDARD',
  total_ht NUMERIC DEFAULT 0,
  total_ttc NUMERIC DEFAULT 0,
  sort_order INT DEFAULT 0
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT CHECK (method IN ('CARD','TRANSFER','CHECK','CASH')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','COMPLETED','FAILED','REFUNDED')),
  stripe_payment_intent_id TEXT,
  processed_at TIMESTAMPTZ,
  failure_reason TEXT
);

-- ============================================================================
-- 6. PAYSLIPS (Fiches de paie)
-- ============================================================================
CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT UNIQUE,
  employee_id UUID NOT NULL REFERENCES profiles(id),
  employee_name TEXT NOT NULL DEFAULT '',
  venue_id UUID REFERENCES venues(id),
  period TEXT NOT NULL,
  period_type TEXT DEFAULT 'MONTHLY' CHECK (period_type IN ('MONTHLY','WEEKLY','BIWEEKLY')),
  start_date DATE,
  end_date DATE,
  issue_date DATE DEFAULT CURRENT_DATE,
  gross_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  social_security NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PAID','PENDING','FAILED','PROCESSING')),
  type TEXT DEFAULT 'STANDARD' CHECK (type IN ('STANDARD','OVERTIME','BONUS','DEDUCTION')),
  hours_worked NUMERIC,
  hourly_rate NUMERIC,
  overtime_hours NUMERIC,
  overtime_rate NUMERIC,
  pdf_url TEXT,
  external_reference TEXT,
  external_provider_id TEXT,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 7. DPAE (Déclarations)
-- ============================================================================
CREATE TABLE dpae_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES missions(id),
  employer_siret TEXT NOT NULL,
  employer_name TEXT NOT NULL,
  employer_address TEXT NOT NULL DEFAULT '',
  employer_ape TEXT DEFAULT '',
  employee_last_name TEXT NOT NULL,
  employee_first_name TEXT NOT NULL,
  employee_birth_date DATE,
  employee_ssn TEXT,
  employee_nationality TEXT DEFAULT 'FR',
  contract_type TEXT DEFAULT 'CDD_USAGE',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  work_hours TEXT,
  hourly_rate NUMERIC,
  job_title TEXT DEFAULT '',
  collective_agreement TEXT DEFAULT 'HCR',
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','ACKNOWLEDGED','ERROR')),
  urssaf_reference TEXT,
  aee_number TEXT,
  submitted_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  contract_pdf_url TEXT,
  mission_unlocked BOOLEAN DEFAULT false
);

CREATE TABLE dpae_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  declaration_id UUID NOT NULL REFERENCES dpae_declarations(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id),
  generated_at TIMESTAMPTZ DEFAULT now(),
  html_content TEXT DEFAULT '',
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SIGNED','SENT'))
);

-- ============================================================================
-- 8. WORKER COMPLIANCE
-- ============================================================================
CREATE TABLE worker_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employment_category TEXT CHECK (employment_category IN ('EXTRA','FREELANCE')),
  compliance_status TEXT DEFAULT 'PENDING' CHECK (compliance_status IN ('PENDING','VERIFIED','SUSPENDED','EXPIRED')),
  social_security_number TEXT,
  next_expiry_date DATE,
  alert_sent_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  -- KYB
  kyb_siret TEXT,
  kyb_company_name TEXT,
  kyb_legal_form TEXT,
  kyb_ape_code TEXT,
  kyb_registration_date DATE,
  kyb_is_active BOOLEAN,
  kyb_verified_at TIMESTAMPTZ,
  kyb_source TEXT CHECK (kyb_source IN ('PAPPERS','SIRENE','MANUAL')),
  -- URSSAF
  urssaf_attestation_number TEXT,
  urssaf_valid_from DATE,
  urssaf_valid_until DATE,
  urssaf_is_valid BOOLEAN,
  urssaf_verified_at TIMESTAMPTZ
);

CREATE TABLE compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IDENTITY','ATTESTATION_PRO_KBIS','URSSAF_ATTESTATION','RC_PRO','RIB','SOCIAL_SECURITY_CARD','CERTIFICATIONS')),
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ,
  expires_at DATE,
  status TEXT DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED','VERIFIED','EXPIRED','REJECTED')),
  rejection_reason TEXT
);

-- ============================================================================
-- 9. WORKER PROFILE EXTRAS
-- ============================================================================
CREATE TABLE worker_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL DEFAULT '',
  date_obtained DATE,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  document_url TEXT
);

CREATE TABLE worker_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  start_date DATE,
  end_date DATE,
  description TEXT DEFAULT ''
);

CREATE TABLE worker_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('IMAGE','VIDEO','BEFORE_AFTER')),
  url TEXT NOT NULL,
  before_url TEXT,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  sort_order INT DEFAULT 0
);

-- ============================================================================
-- 10. TEAM MEMBERS (Équipe curatée du patron)
-- ============================================================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patron_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id),
  venue_id UUID REFERENCES venues(id),
  name TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT '',
  company TEXT,
  rating NUMERIC(3,2),
  missions INT DEFAULT 0,
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','BUSY','OFFLINE')),
  avatar TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  email TEXT,
  phone TEXT
);

-- ============================================================================
-- 11. STOCK
-- ============================================================================
CREATE TABLE stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '',
  alert_threshold NUMERIC DEFAULT 0,
  category TEXT CHECK (category IN ('BOISSONS','ALIMENTATION','CONSOMMABLES','EQUIPEMENTS')),
  supplier TEXT,
  unit_price NUMERIC,
  last_updated DATE DEFAULT CURRENT_DATE
);

CREATE TABLE stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  changes JSONB DEFAULT '[]'
);

-- ============================================================================
-- 12. CALENDAR
-- ============================================================================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  time TIME,
  end_time TIME,
  type TEXT CHECK (type IN ('MAINTENANCE','STAFFING','SUPPLY','EVENT','OTHER','NOTE')),
  description TEXT,
  location TEXT,
  media JSONB
);

-- ============================================================================
-- 13. NOTIFICATIONS
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES venues(id),
  mission_id UUID REFERENCES missions(id),
  equipment_id UUID REFERENCES equipment(id),
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 14. STORED DOCUMENTS (GED)
-- ============================================================================
CREATE TABLE stored_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('FACTURE','DEVIS','CONTRAT','ATTESTATION','AUTRE')),
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  thumbnail_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 15. SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE','PRO','PREMIUM')),
  amount NUMERIC DEFAULT 0,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CANCELLED','EXPIRED')),
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 16. FAULT DECLARATIONS
-- ============================================================================
CREATE TABLE fault_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id),
  fault_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  description TEXT,
  photos TEXT[],
  reported_at TIMESTAMPTZ DEFAULT now(),
  reported_by UUID NOT NULL REFERENCES profiles(id),
  mission_id UUID REFERENCES missions(id)
);

-- ============================================================================
-- TRIGGERS: auto updated_at sur toutes les tables avec updated_at
-- ============================================================================
-- La fonction update_updated_at() existe déjà (créée avec profiles)

CREATE TRIGGER venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER missions_updated_at BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payslips_updated_at BEFORE UPDATE ON payslips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER stored_documents_updated_at BEFORE UPDATE ON stored_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RLS (Row Level Security) — Politiques de base
-- ============================================================================

-- Venues: patron voit ses propres venues, workers voient toutes les venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their venues" ON venues FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Authenticated users can read venues" ON venues FOR SELECT USING (auth.uid() IS NOT NULL);

-- Equipment: via venue ownership
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their equipment" ON equipment FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Authenticated users can read equipment" ON equipment FOR SELECT USING (auth.uid() IS NOT NULL);

-- Missions: patron ou provider assigné
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patrons manage their missions" ON missions FOR ALL USING (auth.uid() = patron_id);
CREATE POLICY "Workers see assigned missions" ON missions FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Workers see searching missions" ON missions FOR SELECT USING (status = 'SEARCHING');

-- Notifications: chaque user voit les siennes
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Stock: via venue ownership (select via join)
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stock access via venue" ON stock_items FOR ALL USING (
  venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
);

-- Stored documents: owner
ALTER TABLE stored_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their documents" ON stored_documents FOR ALL USING (auth.uid() = owner_id);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- Worker compliance: worker voit le sien
ALTER TABLE worker_compliance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers manage own compliance" ON worker_compliance FOR ALL USING (auth.uid() = worker_id);
CREATE POLICY "Anyone can read compliance status" ON worker_compliance FOR SELECT USING (auth.uid() IS NOT NULL);

-- Compliance documents
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers manage own docs" ON compliance_documents FOR ALL USING (auth.uid() = worker_id);

-- Reviews: public read, author write
ALTER TABLE mission_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads reviews" ON mission_reviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Reviewers write reviews" ON mission_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Calendar events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON calendar_events FOR ALL USING (auth.uid() = user_id);

-- Payslips
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees see own payslips" ON payslips FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Venue owners manage payslips" ON payslips FOR ALL USING (
  venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
);

-- Team members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patrons manage their team" ON team_members FOR ALL USING (auth.uid() = patron_id);

-- DPAE
ALTER TABLE dpae_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mission patrons manage DPAE" ON dpae_declarations FOR ALL USING (
  mission_id IN (SELECT id FROM missions WHERE patron_id = auth.uid())
);

-- Quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients and providers see quotes" ON quotes FOR SELECT USING (auth.uid() IN (client_id, provider_id));
CREATE POLICY "Providers create quotes" ON quotes FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Clients and providers update quotes" ON quotes FOR UPDATE USING (auth.uid() IN (client_id, provider_id));

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mission participants see invoices" ON invoices FOR SELECT USING (
  mission_id IN (SELECT id FROM missions WHERE patron_id = auth.uid() OR provider_id = auth.uid())
);

-- Mission candidates
ALTER TABLE mission_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers manage own candidatures" ON mission_candidates FOR ALL USING (auth.uid() = worker_id);
CREATE POLICY "Patrons see candidates" ON mission_candidates FOR SELECT USING (
  mission_id IN (SELECT id FROM missions WHERE patron_id = auth.uid())
);

-- Mission disputes
ALTER TABLE mission_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mission participants manage disputes" ON mission_disputes FOR ALL USING (
  mission_id IN (SELECT id FROM missions WHERE patron_id = auth.uid() OR provider_id = auth.uid())
);

-- Worker profile extras: public read, owner write
ALTER TABLE worker_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read certs" ON worker_certifications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Workers manage own certs" ON worker_certifications FOR ALL USING (auth.uid() = worker_id);

ALTER TABLE worker_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read experiences" ON worker_experiences FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Workers manage own experiences" ON worker_experiences FOR ALL USING (auth.uid() = worker_id);

ALTER TABLE worker_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read portfolio" ON worker_portfolio FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Workers manage own portfolio" ON worker_portfolio FOR ALL USING (auth.uid() = worker_id);

-- ============================================================================
-- INDEX pour les requêtes fréquentes
-- ============================================================================
CREATE INDEX idx_venues_owner ON venues(owner_id);
CREATE INDEX idx_equipment_venue ON equipment(venue_id);
CREATE INDEX idx_missions_patron ON missions(patron_id);
CREATE INDEX idx_missions_provider ON missions(provider_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_venue ON missions(venue_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_stock_venue ON stock_items(venue_id);
CREATE INDEX idx_payslips_employee ON payslips(employee_id);
CREATE INDEX idx_payslips_venue ON payslips(venue_id);
CREATE INDEX idx_calendar_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_date ON calendar_events(date);
CREATE INDEX idx_compliance_worker ON worker_compliance(worker_id);
CREATE INDEX idx_team_patron ON team_members(patron_id);
