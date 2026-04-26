-- Function: list users in caller's tenant (admin or super_admin only)
CREATE OR REPLACE FUNCTION public.list_users_in_my_tenant()
RETURNS TABLE(user_id uuid, email text, created_at timestamp with time zone, is_admin boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_tenant uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  caller_tenant := public.get_user_tenant_id();
  IF caller_tenant IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    u.created_at,
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'admin'::app_role
    ) AS is_admin
  FROM auth.users u
  INNER JOIN public.user_tenants ut ON ut.user_id = u.id
  WHERE ut.tenant_id = caller_tenant
  ORDER BY u.created_at DESC;
END;
$$;

-- Function: link existing user to caller's tenant + assign role
CREATE OR REPLACE FUNCTION public.add_existing_user_to_my_tenant(_target_user_id uuid, _as_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_tenant uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  caller_tenant := public.get_user_tenant_id();
  IF caller_tenant IS NULL THEN
    RAISE EXCEPTION 'Caller has no tenant';
  END IF;

  INSERT INTO public.user_tenants (user_id, tenant_id)
  VALUES (_target_user_id, caller_tenant)
  ON CONFLICT DO NOTHING;

  IF _as_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Function: remove user from caller's tenant
CREATE OR REPLACE FUNCTION public.remove_user_from_my_tenant(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_tenant uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself from the tenant';
  END IF;

  caller_tenant := public.get_user_tenant_id();
  IF caller_tenant IS NULL THEN
    RAISE EXCEPTION 'Caller has no tenant';
  END IF;

  DELETE FROM public.user_tenants
  WHERE user_id = _target_user_id AND tenant_id = caller_tenant;
END;
$$;

-- Public-readable tenant lookup by slug (for /school/:slug route)
-- The existing "Anyone can view tenant by domain" already covers active tenants for anon,
-- so slug lookup also works. No new policy needed.