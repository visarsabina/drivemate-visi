DROP POLICY IF EXISTS "Anyone can read question overrides" ON public.question_overrides;
CREATE POLICY "Signed-in users can read question overrides" ON public.question_overrides
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can read question images" ON storage.objects;
CREATE POLICY "Signed-in users can read question images" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'question-images' AND auth.uid() IS NOT NULL);