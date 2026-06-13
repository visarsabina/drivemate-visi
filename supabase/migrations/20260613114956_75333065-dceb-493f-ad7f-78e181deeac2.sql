-- Restrict non-admin SELECT access to tenants billing/internal columns.
-- Approach: keep RLS policies (admins/super_admins/candidates/members can still see their row),
-- but use column-level GRANTs so that PostgREST can only return non-sensitive columns
-- to authenticated/anon. Admin/super-admin reads of billing data go through SECURITY DEFINER
-- RPCs (get_my_tenant_subscription, list_all_tenants_with_stats, super_admin_*),
-- which run with elevated privileges and are unaffected by these grants.

REVOKE SELECT ON public.tenants FROM authenticated;
REVOKE SELECT ON public.tenants FROM anon;

GRANT SELECT (
  id,
  name,
  slug,
  domain,
  logo_url,
  primary_color,
  phone,
  address,
  email,
  director_name,
  is_active,
  created_at,
  updated_at
) ON public.tenants TO authenticated;

-- service_role retains full access for edge functions/admin operations
GRANT ALL ON public.tenants TO service_role;