
-- Subscription payment history table
CREATE TABLE IF NOT EXISTS public.tenant_subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  period_end date,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tsp_tenant ON public.tenant_subscription_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tsp_date ON public.tenant_subscription_payments(payment_date);

ALTER TABLE public.tenant_subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view subscription payments"
  ON public.tenant_subscription_payments FOR SELECT
  TO authenticated USING (public.is_super_admin());

CREATE POLICY "Super admins can insert subscription payments"
  ON public.tenant_subscription_payments FOR INSERT
  TO authenticated WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete subscription payments"
  ON public.tenant_subscription_payments FOR DELETE
  TO authenticated USING (public.is_super_admin());

-- RPC: record a subscription payment and update tenant subscription
CREATE OR REPLACE FUNCTION public.super_admin_record_subscription_payment(
  _tenant_id uuid,
  _amount numeric,
  _payment_date date,
  _period_end date,
  _notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;

  INSERT INTO public.tenant_subscription_payments (tenant_id, amount, payment_date, period_end, notes, created_by)
  VALUES (_tenant_id, _amount, COALESCE(_payment_date, CURRENT_DATE), _period_end, _notes, auth.uid())
  RETURNING id INTO new_id;

  UPDATE public.tenants SET
    last_payment_date = COALESCE(_payment_date, CURRENT_DATE),
    subscription_ends_at = COALESCE(_period_end, subscription_ends_at),
    subscription_status = CASE WHEN subscription_status IN ('expired','trial','cancelled') THEN 'active' ELSE subscription_status END,
    updated_at = now()
  WHERE id = _tenant_id;

  RETURN new_id;
END;
$$;

-- RPC: list payments for a tenant
CREATE OR REPLACE FUNCTION public.super_admin_tenant_subscription_payments(_tenant_id uuid)
RETURNS TABLE(id uuid, amount numeric, payment_date date, period_end date, notes text, created_at timestamp with time zone)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;

  RETURN QUERY
  SELECT p.id, p.amount, p.payment_date, p.period_end, p.notes, p.created_at
  FROM public.tenant_subscription_payments p
  WHERE p.tenant_id = _tenant_id
  ORDER BY p.payment_date DESC, p.created_at DESC;
END;
$$;

-- Replace global stats: revenue = subscription payments
CREATE OR REPLACE FUNCTION public.super_admin_global_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
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
    'revenue_total', (SELECT COALESCE(SUM(amount),0) FROM public.tenant_subscription_payments),
    'revenue_this_month', (
      SELECT COALESCE(SUM(amount),0) FROM public.tenant_subscription_payments
      WHERE date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE)
    ),
    'registrations_open', (SELECT count(*) FROM public.registrations WHERE status = 'new'),
    'vehicles_total', (SELECT count(*) FROM public.vehicles),
    'employees_total', (SELECT count(*) FROM public.employees)
  ) INTO result;

  RETURN result;
END;
$$;

-- Replace monthly series: revenue = subscription payments
CREATE OR REPLACE FUNCTION public.super_admin_monthly_series(_months integer DEFAULT 12)
RETURNS TABLE(month date, revenue numeric, new_candidates bigint, new_registrations bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
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
    COALESCE((SELECT SUM(amount) FROM public.tenant_subscription_payments p WHERE date_trunc('month', p.payment_date)::date = months.m), 0)::numeric,
    COALESCE((SELECT count(*) FROM public.candidates c WHERE date_trunc('month', c.data_regjistrimit)::date = months.m), 0)::bigint,
    COALESCE((SELECT count(*) FROM public.registrations r WHERE date_trunc('month', r.created_at)::date = months.m), 0)::bigint
  FROM months
  ORDER BY months.m;
END;
$$;

-- Per-tenant ranking based on subscription revenue
DROP FUNCTION IF EXISTS public.super_admin_tenant_stats();
CREATE OR REPLACE FUNCTION public.super_admin_tenant_stats()
RETURNS TABLE(tenant_id uuid, tenant_name text, candidates_total bigint, candidates_active bigint, revenue_total numeric, revenue_this_month numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
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
    COALESCE((SELECT SUM(amount) FROM public.tenant_subscription_payments p WHERE p.tenant_id = t.id), 0)::numeric,
    COALESCE((SELECT SUM(amount) FROM public.tenant_subscription_payments p WHERE p.tenant_id = t.id AND date_trunc('month', p.payment_date) = date_trunc('month', CURRENT_DATE)), 0)::numeric
  FROM public.tenants t
  ORDER BY revenue_total DESC NULLS LAST;
END;
$$;
