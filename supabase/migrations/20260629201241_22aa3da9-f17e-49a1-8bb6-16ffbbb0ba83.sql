
CREATE POLICY "Anyone authenticated can read question images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'question-images');

CREATE POLICY "Super admins can upload question images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'question-images' AND public.is_super_admin());

CREATE POLICY "Super admins can update question images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'question-images' AND public.is_super_admin());

CREATE POLICY "Super admins can delete question images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'question-images' AND public.is_super_admin());
