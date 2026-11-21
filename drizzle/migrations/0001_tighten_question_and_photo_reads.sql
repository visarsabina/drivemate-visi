DROP POLICY IF EXISTS "Public read vehicle-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Signed-in users can read question images" ON storage.objects;
CREATE POLICY "App members can read question images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'question-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()));
DROP POLICY IF EXISTS "Signed-in users can read question overrides" ON public.question_overrides;
CREATE POLICY "App members can read question overrides" ON public.question_overrides FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()));