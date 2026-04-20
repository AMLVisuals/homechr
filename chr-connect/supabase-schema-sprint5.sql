-- ============================================================================
-- SPRINT 5 — Admin litiges : colonnes + RLS admin
-- À exécuter dans Supabase SQL Editor après les sprints 1-4.
-- ============================================================================

-- Colonnes admin sur mission_disputes
ALTER TABLE mission_disputes
  ADD COLUMN IF NOT EXISTS resolved_by_admin_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IN ('NONE','REQUESTED','REFUNDED','FAILED')),
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;

ALTER TABLE mission_disputes ALTER COLUMN refund_status SET DEFAULT 'NONE';

-- Role admin : ajout d'un flag is_admin sur profiles (si pas déjà)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Marquer les comptes staff existants comme admin (basé sur email hardcodé)
UPDATE profiles SET is_admin = true
  WHERE email IN ('admin@home-chr.fr','support@home-chr.fr');

-- RLS : l'admin peut lire + modifier tous les litiges
DROP POLICY IF EXISTS "Admins manage all disputes" ON mission_disputes;
CREATE POLICY "Admins manage all disputes" ON mission_disputes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Index pour filtrage rapide par status
CREATE INDEX IF NOT EXISTS idx_disputes_status ON mission_disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON mission_disputes(created_at DESC);

-- Blacklist réciproque (bonus sprint 5) : table de relation patron <-> worker
CREATE TABLE IF NOT EXISTS user_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  dispute_id UUID REFERENCES mission_disputes(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE user_blacklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own blacklist" ON user_blacklist FOR ALL
  USING (auth.uid() = blocker_id);
CREATE POLICY "Admins read blacklist" ON user_blacklist FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE INDEX IF NOT EXISTS idx_blacklist_blocker ON user_blacklist(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_blocked ON user_blacklist(blocked_id);
