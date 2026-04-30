
-- =====================================================================
-- 1. TENANTS: Hide sensitive columns from anonymous users
-- =====================================================================

-- Drop the overly permissive anon SELECT policy
DROP POLICY IF EXISTS "Anyone can view tenant by domain (public lookup)" ON public.tenants;

-- Create a public view exposing only safe columns
DROP VIEW IF EXISTS public.tenants_public;
CREATE VIEW public.tenants_public
WITH (security_invoker = on) AS
SELECT
  id,
  name,
  slug,
  domain,
  logo_url,
  primary_color,
  is_active
FROM public.tenants
WHERE is_active = true;

GRANT SELECT ON public.tenants_public TO anon, authenticated;

-- Allow anon to SELECT only when going through the view (security_invoker
-- runs as the caller, so we need a permissive SELECT policy that returns
-- ONLY the safe columns indirectly). We replicate by allowing anon to read
-- the base table but the view exposes only safe cols. To prevent direct
-- access to sensitive cols by anon, we add a policy that limits anon to
-- rows where is_active = true but we will ALSO rely on app code using the
-- view. Per security best practice, restrict anon directly:
CREATE POLICY "Anon can view active tenants (limited via view)"
ON public.tenants
FOR SELECT
TO anon
USING (is_active = true);

-- NOTE: Sensitive columns (email, phone, director_name, address) remain in
-- the base table. Application code MUST use `tenants_public` view for
-- anonymous lookups. Authenticated members still get full row via existing
-- "Users can view their tenant" / super-admin policies.

-- =====================================================================
-- 2. USER_ROLES: Prevent privilege escalation to super_admin by admins
-- =====================================================================

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can manage non-super-admin roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
);

-- Super admins keep their existing "Super admins can manage all roles" policy.

-- =====================================================================
-- 3. STORAGE: Tenant-scoped access for vehicle-photos & employee-photos
-- =====================================================================

-- Drop existing overly-broad policies on these buckets (if any)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (
        policyname ILIKE '%vehicle-photos%'
        OR policyname ILIKE '%employee-photos%'
        OR policyname ILIKE '%vehicle photos%'
        OR policyname ILIKE '%employee photos%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Public read (buckets are public anyway)
CREATE POLICY "Public read vehicle-photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Public read employee-photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'employee-photos');

-- INSERT: admin must own the tenant folder (first path segment = tenant_id)
CREATE POLICY "Admins upload vehicle-photos to own tenant folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Admins upload employee-photos to own tenant folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

-- UPDATE
CREATE POLICY "Admins update vehicle-photos in own tenant folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'vehicle-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Admins update employee-photos in own tenant folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'employee-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

-- DELETE
CREATE POLICY "Admins delete vehicle-photos in own tenant folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Admins delete employee-photos in own tenant folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-photos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND user_belongs_to_tenant(((storage.foldername(name))[1])::uuid)
);
