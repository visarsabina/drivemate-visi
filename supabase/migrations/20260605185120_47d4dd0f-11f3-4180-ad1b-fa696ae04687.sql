DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view roles in their tenant"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.user_tenants ut_target
    JOIN public.user_tenants ut_admin ON ut_admin.tenant_id = ut_target.tenant_id
    WHERE ut_target.user_id = user_roles.user_id
      AND ut_admin.user_id = auth.uid()
  )
);