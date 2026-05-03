CREATE OR REPLACE FUNCTION public.super_admin_tenant_details(_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'tenant_id', t.id,
    'tenant_name', t.name,
    'slug', t.slug,
    'phone', t.phone,
    'email', t.email,
    'address', t.address,
    'is_active', t.is_active,
    'candidates_total', (SELECT count(*) FROM public.candidates c WHERE c.tenant_id = t.id),
    'candidates_regjistuar', (SELECT count(*) FROM public.candidates c WHERE c.tenant_id = t.id AND c.statusi = 'regjistuar'),
    'candidates_ne_proces', (SELECT count(*) FROM public.candidates c WHERE c.tenant_id = t.id AND c.statusi = 'ne_proces'),
    'candidates_kaluar', (SELECT count(*) FROM public.candidates c WHERE c.tenant_id = t.id AND c.statusi = 'kaluar'),
    'candidates_deshtur', (SELECT count(*) FROM public.candidates c WHERE c.tenant_id = t.id AND c.statusi = 'deshtur'),
    'registrations_open', (SELECT count(*) FROM public.registrations r WHERE r.tenant_id = t.id AND r.status = 'new'),
    'registrations_total', (SELECT count(*) FROM public.registrations r WHERE r.tenant_id = t.id),
    'revenue_total', (SELECT COALESCE(SUM(shuma),0) FROM public.candidate_payments p WHERE p.tenant_id = t.id),
    'revenue_this_month', (
      SELECT COALESCE(SUM(shuma),0) FROM public.candidate_payments p
      WHERE p.tenant_id = t.id AND date_trunc('month', p.data) = date_trunc('month', CURRENT_DATE)
    ),
    'vehicles_total', (SELECT count(*) FROM public.vehicles v WHERE v.tenant_id = t.id),
    'employees_total', (SELECT count(*) FROM public.employees e WHERE e.tenant_id = t.id)
  ) INTO result
  FROM public.tenants t
  WHERE t.id = _tenant_id;

  RETURN result;
END;
$$;