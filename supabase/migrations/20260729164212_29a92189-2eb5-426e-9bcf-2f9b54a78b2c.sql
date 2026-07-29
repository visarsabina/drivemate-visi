CREATE POLICY "Admins read own tenant social images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'social-images'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
  AND (public.has_role(auth.uid(), 'admin') OR public.is_super_admin())
);

CREATE POLICY "Admins upload own tenant social images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'social-images'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
  AND (public.has_role(auth.uid(), 'admin') OR public.is_super_admin())
);

CREATE POLICY "Admins delete own tenant social images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'social-images'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
  AND (public.has_role(auth.uid(), 'admin') OR public.is_super_admin())
);