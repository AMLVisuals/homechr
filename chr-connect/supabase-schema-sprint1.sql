-- ============================================================================
-- SPRINT 1 — Fondations temps réel
-- Chat (message_threads + messages) + Push notifications
-- À exécuter dans Supabase SQL Editor après le schema principal
-- ============================================================================

-- ============================================================================
-- 17. CHAT — THREADS & MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  patron_id UUID NOT NULL REFERENCES profiles(id),
  worker_id UUID NOT NULL REFERENCES profiles(id),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mission_id, patron_id, worker_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 4000),
  attachments TEXT[],
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Update last_message_at on insert
CREATE OR REPLACE FUNCTION touch_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_touch_thread ON messages;
CREATE TRIGGER messages_touch_thread
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION touch_thread_last_message();

-- ============================================================================
-- 18. PUSH SUBSCRIPTIONS (Web Push / VAPID)
-- ============================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- ============================================================================
-- RLS POLICIES — Sprint 1
-- ============================================================================

-- message_threads : accessible aux 2 participants
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread participants read"
  ON message_threads FOR SELECT
  USING (auth.uid() = patron_id OR auth.uid() = worker_id);

CREATE POLICY "Thread participants create"
  ON message_threads FOR INSERT
  WITH CHECK (auth.uid() = patron_id OR auth.uid() = worker_id);

CREATE POLICY "Thread participants update"
  ON message_threads FOR UPDATE
  USING (auth.uid() = patron_id OR auth.uid() = worker_id);

-- messages : accessibles aux 2 participants du thread
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread members read messages"
  ON messages FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM message_threads
      WHERE auth.uid() = patron_id OR auth.uid() = worker_id
    )
  );

CREATE POLICY "Thread members send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND thread_id IN (
      SELECT id FROM message_threads
      WHERE auth.uid() = patron_id OR auth.uid() = worker_id
    )
  );

CREATE POLICY "Receiver can mark read"
  ON messages FOR UPDATE
  USING (
    thread_id IN (
      SELECT id FROM message_threads
      WHERE auth.uid() = patron_id OR auth.uid() = worker_id
    )
  );

-- push_subscriptions : chaque user gère les siennes
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subs"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- INDEX
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_threads_mission ON message_threads(mission_id);
CREATE INDEX IF NOT EXISTS idx_threads_patron ON message_threads(patron_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_worker ON message_threads(worker_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(thread_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================
-- Activer Realtime pour messages et threads
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_threads;
