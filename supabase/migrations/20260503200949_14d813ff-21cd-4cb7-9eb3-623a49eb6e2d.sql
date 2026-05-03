-- Faza 4B: Super-admin global statistics
CREATE OR REPLACE FUNCTION public.super_admin_global_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'tenants_total', (SELECT count(*) FROM public.tenants),
    'tenants_active', (SELECT count(*) FROM public.tenants WHERE is_active),
    'candidates_total', (SELECT count(*) FROM public.candidates),
    'candidates_in_progress', (SELECT count(*) FROM public.candidates WHERE statusi IN ('regjistuar','ne_proces')),
    'candidates_passed', (SELECT count(*) FROM public.candidates WHERE statusi = 'kaluar'),
    'candidates_failed', (SELECT count(*) FROM public.candidates WHERE statusi = 'deshtur'),
    'revenue_total', (SELECT COALESCE(SUM(shuma),0) FROM public.candidate_payments),
    'revenue_this_month', (
      SELECT COALESCE(SUM(shuma),0) FROM public.candidate_payments
      WHERE date_trunc('month', data) = date_trunc('month', CURRENT_DATE)
    ),
    'registrations_open', (SELECT count(*) FROM public.registrations WHERE status = 'new'),
    'vehicles_total', (SELECT count(*) FROM public.vehicles),
    'employees_total', (SELECT count(*) FROM public.employees)
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.super_admin_monthly_series(_months int DEFAULT 12)
RETURNS TABLE(month date, revenue numeric, new_candidates bigint, new_registrations bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', CURRENT_DATE) - ((_months - 1) || ' months')::interval,
      date_trunc('month', CURRENT_DATE),
      '1 month'::interval
    )::date AS m
  )
  SELECT
    months.m,
    COALESCE((SELECT SUM(shuma) FROM public.candidate_payments p WHERE date_trunc('month', p.data)::date = months.m), 0)::numeric,
    COALESCE((SELECT count(*) FROM public.candidates c WHERE date_trunc('month', c.data_regjistrimit)::date = months.m), 0)::bigint,
    COALESCE((SELECT count(*) FROM public.registrations r WHERE date_trunc('month', r.created_at)::date = months.m), 0)::bigint
  FROM months
  ORDER BY months.m;
END;
$$;

CREATE OR REPLACE FUNCTION public.super_admin_tenant_stats()
RETURNS TABLE(
  tenant_id uuid,
  tenant_name text,
  candidates_total bigint,
  candidates_active bigint,
  revenue_total numeric,
  revenue_this_month numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.name,
    COALESCE((SELECT count(*) FROM public.candidates c WHERE c.tenant_id = t.id), 0)::bigint,
    COALESCE((SELECT count(*) FROM public.candidates c WHERE c.tenant_id = t.id AND c.statusi IN ('regjistuar','ne_proces')), 0)::bigint,
    COALESCE((SELECT SUM(shuma) FROM public.candidate_payments p WHERE p.tenant_id = t.id), 0)::numeric,
    COALESCE((SELECT SUM(shuma) FROM public.candidate_payments p WHERE p.tenant_id = t.id AND date_trunc('month', p.data) = date_trunc('month', CURRENT_DATE)), 0)::numeric
  FROM public.tenants t
  ORDER BY revenue_total DESC NULLS LAST;
END;
$$;