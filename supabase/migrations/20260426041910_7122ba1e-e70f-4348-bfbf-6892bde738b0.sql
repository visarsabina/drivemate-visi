
-- Helper: is current user a super admin?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin'::app_role)
$$;

-- ===== TENANTS table: add super-admin policies =====
CREATE POLICY "Super admins can view all tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Super admins can insert tenants"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update any tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete tenants"
ON public.tenants
FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- ===== USER_TENANTS: super-admin policies =====
CREATE POLICY "Super admins can view all memberships"
ON public.user_tenants
FOR SELECT
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Super admins can add any user to any tenant"
ON public.user_tenants
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can remove any membership"
ON public.user_tenants
FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- ===== USER_ROLES: super-admin can view & manage =====
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ===== Function: create tenant + assign existing user as admin =====
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  _name text,
  _slug text,
  _domain text,
  _phone text,
  _address text,
  _email text,
  _director_name text,
  _primary_color text,
  _admin_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;

  INSERT INTO public.tenants (
    name, slug, domain, phone, address, email, director_name, primary_color, is_active
  ) VALUES (
    _name, _slug,
    NULLIF(_domain, ''),
    NULLIF(_phone, ''),
    NULLIF(_address, ''),
    NULLIF(_email, ''),
    NULLIF(_director_name, ''),
    COALESCE(NULLIF(_primary_color, ''), '#0ea5e9'),
    true
  )
  RETURNING id INTO new_tenant_id;

  -- Link admin user
  INSERT INTO public.user_tenants (user_id, tenant_id)
  VALUES (_admin_user_id, new_tenant_id)
  ON CONFLICT DO NOTHING;

  -- Ensure they have the admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_admin_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new_tenant_id;
END;
$$;

-- ===== Function: activate / deactivate tenant =====
CREATE OR REPLACE FUNCTION public.set_tenant_active(
  _tenant_id uuid,
  _is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;

  UPDATE public.tenants
  SET is_active = _is_active, updated_at = now()
  WHERE id = _tenant_id;
END;
$$;

-- ===== Function: list all tenants with stats (super-admin only) =====
CREATE OR REPLACE FUNCTION public.list_all_tenants_with_stats()
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  domain text,
  phone text,
  address text,
  email text,
  director_name text,
  primary_color text,
  logo_url text,
  is_active boolean,
  created_at timestamptz,
  admin_count bigint,
  vehicles_count bigint,
  employees_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;

  RETURN QUERY
  SELECT
    t.id, t.name, t.slug, t.domain, t.phone, t.address, t.email,
    t.director_name, t.primary_color, t.logo_url, t.is_active, t.created_at,
    (SELECT COUNT(*) FROM public.user_tenants ut WHERE ut.tenant_id = t.id) AS admin_count,
    (SELECT COUNT(*) FROM public.vehicles v WHERE v.tenant_id = t.id) AS vehicles_count,
    (SELECT COUNT(*) FROM public.employees e WHERE e.tenant_id = t.id) AS employees_count
  FROM public.tenants t
  ORDER BY t.created_at DESC;
END;
$$;

-- ===== Function: list users available to assign as admins =====
CREATE OR REPLACE FUNCTION public.list_users_for_super_admin()
RETURNS TABLE(
  user_id uuid,
  email text,
  created_at timestamptz,
  is_super_admin boolean,
  tenant_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    u.created_at,
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'super_admin'::app_role
    ) AS is_super_admin,
    (SELECT COUNT(*) FROM public.user_tenants ut WHERE ut.user_id = u.id) AS tenant_count
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;
