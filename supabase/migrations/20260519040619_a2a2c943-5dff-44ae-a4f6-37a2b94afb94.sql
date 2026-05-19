
-- Staff photos: drop loose admin-only policies, recreate with tenant isolation and authenticated role
DROP POLICY IF EXISTS "Admins upload staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins update staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete staff photos" ON storage.objects;

CREATE POLICY "Admins upload staff photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'staff-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Admins update staff photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'staff-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'staff-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Admins delete staff photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'staff-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

-- user_roles: replace the loose admin policy with a tenant-scoped check
DROP POLICY IF EXISTS "Admins can manage non-super-admin roles" ON public.user_roles;

CREATE POLICY "Admins can manage non-super-admin roles in their tenant"
ON public.user_roles FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
  AND EXISTS (
    SELECT 1 FROM public.user_tenants ut_target
    JOIN public.user_tenants ut_admin ON ut_admin.tenant_id = ut_target.tenant_id
    WHERE ut_target.user_id = user_roles.user_id
      AND ut_admin.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
  AND EXISTS (
    SELECT 1 FROM public.user_tenants ut_target
    JOIN public.user_tenants ut_admin ON ut_admin.tenant_id = ut_target.tenant_id
    WHERE ut_target.user_id = user_roles.user_id
      AND ut_admin.user_id = auth.uid()
  )
);
