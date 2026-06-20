
DROP FUNCTION IF EXISTS public.list_users_in_my_tenant();
CREATE OR REPLACE FUNCTION public.list_users_in_my_tenant()
 RETURNS TABLE(user_id uuid, email text, first_name text, last_name text, created_at timestamp with time zone, is_admin boolean, is_instructor boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_tenant uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  caller_tenant := public.get_user_tenant_id();
  IF caller_tenant IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    COALESCE(u.raw_user_meta_data->>'first_name','')::text,
    COALESCE(u.raw_user_meta_data->>'last_name','')::text,
    u.created_at,
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'::app_role),
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'instructor'::app_role)
  FROM auth.users u
  INNER JOIN public.user_tenants ut ON ut.user_id = u.id
  WHERE ut.tenant_id = caller_tenant
  ORDER BY u.created_at DESC;
END;
$function$;

DROP FUNCTION IF EXISTS public.list_instructors_in_my_tenant();
CREATE OR REPLACE FUNCTION public.list_instructors_in_my_tenant()
 RETURNS TABLE(user_id uuid, email text, first_name text, last_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_tenant uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  caller_tenant := public.get_user_tenant_id();
  IF caller_tenant IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    COALESCE(u.raw_user_meta_data->>'first_name','')::text,
    COALESCE(u.raw_user_meta_data->>'last_name','')::text
  FROM auth.users u
  INNER JOIN public.user_tenants ut ON ut.user_id = u.id
  INNER JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE ut.tenant_id = caller_tenant
    AND ur.role = 'instructor'::public.app_role
  ORDER BY u.email;
END;
$function$;
