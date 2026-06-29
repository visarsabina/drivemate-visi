
-- 1) Replace admin INSERT policy on user_roles to prevent cross-tenant escalation
DROP POLICY IF EXISTS "Admins can assign limited roles in their tenant" ON public.user_roles;

CREATE POLICY "Admins can assign limited roles in their tenant"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND role = ANY (ARRAY['instructor'::app_role, 'candidate'::app_role])
  -- Target user must belong to the admin's current tenant
  AND EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = user_roles.user_id
      AND ut.tenant_id = public.get_user_tenant_id()
  )
  -- Target user must not belong to any OTHER tenant
  AND NOT EXISTS (
    SELECT 1 FROM public.user_tenants ut2
    WHERE ut2.user_id = user_roles.user_id
      AND ut2.tenant_id <> public.get_user_tenant_id()
  )
  -- Target user must not already hold admin or super_admin role
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles existing
    WHERE existing.user_id = user_roles.user_id
      AND existing.role IN ('admin'::app_role, 'super_admin'::app_role)
  )
);

-- 2) Allow instructors to view vehicles and vehicle services within their tenant
CREATE POLICY "Instructors can view vehicles in their tenant"
ON public.vehicles
FOR SELECT
USING (
  public.is_instructor()
  AND public.user_belongs_to_tenant(tenant_id)
);

CREATE POLICY "Instructors can view vehicle services in their tenant"
ON public.vehicle_services
FOR SELECT
USING (
  public.is_instructor()
  AND public.user_belongs_to_tenant(tenant_id)
);
