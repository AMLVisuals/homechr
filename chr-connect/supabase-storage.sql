-- ============================================================================
-- HOME CHR - SUPABASE STORAGE BUCKETS
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================================

-- 1. Créer les buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('venues', 'venues', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('equipment', 'equipment', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('missions', 'missions', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance', 'compliance', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true);

-- 2. Policies RLS pour chaque bucket

-- AVATARS (public read, owner write)
CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "Avatar owner upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatar owner update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatar owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- VENUES (public read, owner write via folder = userId)
CREATE POLICY "Venue photos public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'venues');
CREATE POLICY "Venue photos owner upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'venues' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Venue photos owner update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'venues' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Venue photos owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'venues' AND (storage.foldername(name))[1] = auth.uid()::text);

-- EQUIPMENT (public read, owner write)
CREATE POLICY "Equipment photos public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'equipment');
CREATE POLICY "Equipment photos owner upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'equipment' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Equipment photos owner update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'equipment' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Equipment photos owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'equipment' AND (storage.foldername(name))[1] = auth.uid()::text);

-- MISSIONS (public read, authenticated write)
CREATE POLICY "Mission files public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'missions');
CREATE POLICY "Mission files auth upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'missions' AND auth.uid() IS NOT NULL);
CREATE POLICY "Mission files auth update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'missions' AND auth.uid() IS NOT NULL);
CREATE POLICY "Mission files auth delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'missions' AND auth.uid() IS NOT NULL);

-- DOCUMENTS (private, owner only)
CREATE POLICY "Documents owner read" ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Documents owner upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Documents owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- INVOICES (private, owner only)
CREATE POLICY "Invoices owner read" ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Invoices owner upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Invoices owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

-- COMPLIANCE (private, worker owner only)
CREATE POLICY "Compliance owner read" ON storage.objects FOR SELECT
  USING (bucket_id = 'compliance' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Compliance owner upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'compliance' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Compliance owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'compliance' AND (storage.foldername(name))[1] = auth.uid()::text);

-- PORTFOLIO (public read, worker owner write)
CREATE POLICY "Portfolio public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');
CREATE POLICY "Portfolio owner upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Portfolio owner update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Portfolio owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
