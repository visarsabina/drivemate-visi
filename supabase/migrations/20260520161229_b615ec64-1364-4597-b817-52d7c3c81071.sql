
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS trial_ends_at date DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_ends_at date,
  ADD COLUMN IF NOT EXISTS monthly_fee numeric NOT NULL DEFAULT 29,
  ADD COLUMN IF NOT EXISTS last_payment_date date,
  ADD COLUMN IF NOT EXISTS subscription_notes text;

DO $$ BEGIN
  ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_subscription_status_check
    CHECK (subscription_status IN ('trial','active','expired','cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.get_my_tenant_subscription()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  result jsonb;
BEGIN
  tid := public.get_user_tenant_id();
  IF tid IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'tenant_id', t.id,
    'subscription_status', t.subscription_status,
    'trial_ends_at', t.trial_ends_at,
    'subscription_ends_at', t.subscription_ends_at,
    'monthly_fee', t.monthly_fee,
    'last_payment_date', t.last_payment_date,
    'effective_end_date', CASE
      WHEN t.subscription_status = 'trial' THEN t.trial_ends_at
      ELSE t.subscription_ends_at
    END,
    'days_remaining', CASE
      WHEN t.subscription_status = 'trial' THEN (t.trial_ends_at - CURRENT_DATE)
      WHEN t.subscription_ends_at IS NOT NULL THEN (t.subscription_ends_at - CURRENT_DATE)
      ELSE NULL
    END,
    'is_expired', CASE
      WHEN t.subscription_status IN ('expired','cancelled') THEN true
      WHEN t.subscription_status = 'trial' AND t.trial_ends_at < CURRENT_DATE THEN true
      WHEN t.subscription_status = 'active' AND t.subscription_ends_at IS NOT NULL AND t.subscription_ends_at < CURRENT_DATE THEN true
      ELSE false
    END
  ) INTO result
  FROM public.tenants t
  WHERE t.id = tid;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.super_admin_update_subscription(
  _tenant_id uuid,
  _status text,
  _ends_at date,
  _monthly_fee numeric,
  _last_payment_date date,
  _notes text
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
  IF _status NOT IN ('trial','active','expired','cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.tenants SET
    subscription_status = _status,
    subscription_ends_at = COALESCE(_ends_at, subscription_ends_at),
    monthly_fee = COALESCE(_monthly_fee, monthly_fee),
    last_payment_date = COALESCE(_last_payment_date, last_payment_date),
    subscription_notes = _notes,
    updated_at = now()
  WHERE id = _tenant_id;
END;
$$;

DROP FUNCTION IF EXISTS public.list_all_tenants_with_stats();

CREATE OR REPLACE FUNCTION public.list_all_tenants_with_stats()
RETURNS TABLE(
  id uuid, name text, slug text, domain text, phone text, address text, email text,
  director_name text, primary_color text, logo_url text, is_active boolean,
  created_at timestamp with time zone, admin_count bigint, vehicles_count bigint, employees_count bigint,
  subscription_status text, trial_ends_at date, subscription_ends_at date,
  monthly_fee numeric, last_payment_date date, days_remaining integer
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
    (SELECT COUNT(*) FROM public.employees e WHERE e.tenant_id = t.id) AS employees_count,
    t.subscription_status,
    t.trial_ends_at,
    t.subscription_ends_at,
    t.monthly_fee,
    t.last_payment_date,
    (CASE
      WHEN t.subscription_status = 'trial' THEN (t.trial_ends_at - CURRENT_DATE)
      WHEN t.subscription_ends_at IS NOT NULL THEN (t.subscription_ends_at - CURRENT_DATE)
      ELSE NULL
    END)::integer AS days_remaining
  FROM public.tenants t
  ORDER BY t.created_at DESC;
END;
$$;
