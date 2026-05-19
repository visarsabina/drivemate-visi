
-- 1. Drop cross-tenant user enumeration function
DROP FUNCTION IF EXISTS public.get_all_users_with_roles();

-- 2. Tenant-scope grant/revoke admin role
CREATE OR REPLACE FUNCTION public.grant_admin_role(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF NOT EXISTS (
    SELECT 1 FROM public.user_tenants
    WHERE user_id = _target_user_id AND tenant_id = caller_tenant
  ) THEN
    RAISE EXCEPTION 'Target user is not in your tenant';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.revoke_admin_role(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_tenant uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own admin role';
  END IF;

  caller_tenant := public.get_user_tenant_id();
  IF caller_tenant IS NULL THEN
    RAISE EXCEPTION 'Caller has no tenant';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_tenants
    WHERE user_id = _target_user_id AND tenant_id = caller_tenant
  ) THEN
    RAISE EXCEPTION 'Target user is not in your tenant';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id AND role = 'admin'::app_role;
END;
$function$;

-- 3. Employee photos: make bucket private + tenant-scoped read
UPDATE storage.buckets SET public = false WHERE id = 'employee-photos';

DROP POLICY IF EXISTS "Anyone can view employee photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read employee photos" ON storage.objects;
DROP POLICY IF EXISTS "employee-photos public read" ON storage.objects;
DROP POLICY IF EXISTS "Tenant members view employee photos" ON storage.objects;

CREATE POLICY "Tenant members view employee photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-photos'
  AND public.user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

-- 4. Staff photos: add tenant isolation to write/delete (mirror vehicle-photos pattern)
DROP POLICY IF EXISTS "Admins upload staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins update staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete staff photos" ON storage.objects;

CREATE POLICY "Admins upload staff photos in their tenant"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff-photos'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND public.user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Admins update staff photos in their tenant"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff-photos'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND public.user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Admins delete staff photos in their tenant"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff-photos'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND public.user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

-- 5. Remove anon SELECT on tenants base table (use SECURITY DEFINER public RPCs instead)
DROP POLICY IF EXISTS "Anon can view active tenants (limited via view)" ON public.tenants;
DROP POLICY IF EXISTS "Anon can view active tenants" ON public.tenants;
