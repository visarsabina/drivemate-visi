
CREATE OR REPLACE FUNCTION public.list_candidate_users_in_my_tenant()
 RETURNS TABLE(user_id uuid, candidate_id uuid, email text, emri text, mbiemri text, numri_personal text, numri_regjistrimit text, created_at timestamp with time zone)
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
    c.user_id,
    c.id,
    u.email::text,
    c.emri,
    c.mbiemri,
    c.numri_personal,
    c.numri_regjistrimit,
    u.created_at
  FROM public.candidates c
  INNER JOIN auth.users u ON u.id = c.user_id
  WHERE c.tenant_id = caller_tenant
    AND c.user_id IS NOT NULL
  ORDER BY c.numri_regjistrimit DESC NULLS LAST;
END;
$function$;
