CREATE OR REPLACE FUNCTION public.is_active_public_tenant(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = _tenant_id
      AND t.is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_public_tenant(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can submit a registration to an active tenant" ON public.registrations;

CREATE POLICY "Anyone can submit a registration to an active tenant"
ON public.registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_active_public_tenant(tenant_id));