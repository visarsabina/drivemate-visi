-- 1) Revoke anon EXECUTE on every public function (none of them should be callable by anon)
REVOKE EXECUTE ON FUNCTION public.add_existing_user_to_my_tenant(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_tenant_with_admin(text, text, text, text, text, text, text, text, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_all_users_with_roles() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_instructor() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.list_all_tenants_with_stats() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.list_instructors_in_my_tenant() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.list_users_for_super_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.list_users_in_my_tenant() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.remove_user_from_my_tenant(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.revoke_admin_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_tenant_active(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_belongs_to_tenant(uuid) FROM anon, public;

-- 2) Revoke authenticated EXECUTE on internal RLS helpers (they are still callable
-- by RLS engine because they are SECURITY DEFINER; clients should not invoke them).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_instructor() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.user_belongs_to_tenant(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id() FROM authenticated;

-- 3) Restrict storage object listing on public buckets (photos still served by URL,
-- but clients can no longer enumerate every file in the bucket).
DROP POLICY IF EXISTS "Public read vehicle-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read employee-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read staff-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view vehicle-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view employee-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view staff-photos" ON storage.objects;