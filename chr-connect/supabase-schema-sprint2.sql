-- ============================================================================
-- SPRINT 2 — Matching temps réel
-- Realtime sur missions + mission_candidates + index skills
-- ============================================================================

-- Active Realtime sur missions et mission_candidates (idempotent)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE missions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE mission_candidates;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Index pour matching par skills (PostgreSQL array overlap &&)
CREATE INDEX IF NOT EXISTS idx_missions_skills_gin ON missions USING GIN (skills);
