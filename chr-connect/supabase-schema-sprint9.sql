-- ============================================================================
-- SPRINT 9 — Fix RLS patron accept/reject candidat
-- ============================================================================
-- BUG : le patron ne pouvait pas accepter/refuser un candidat car seule
-- la policy FOR SELECT existait. Il faut une policy FOR UPDATE.
-- Sans ça : updateCandidateStatus() échoue silencieusement côté client.
-- ============================================================================

-- Permet aux patrons d'UPDATE le status des candidats sur leurs missions
DROP POLICY IF EXISTS "Patrons update candidate status" ON mission_candidates;
CREATE POLICY "Patrons update candidate status" ON mission_candidates
  FOR UPDATE
  USING (mission_id IN (SELECT id FROM missions WHERE patron_id = auth.uid()))
  WITH CHECK (mission_id IN (SELECT id FROM missions WHERE patron_id = auth.uid()));
