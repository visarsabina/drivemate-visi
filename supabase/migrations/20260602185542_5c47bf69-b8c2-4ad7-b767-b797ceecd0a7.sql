
CREATE OR REPLACE FUNCTION public.prevent_tenant_billing_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at
     OR NEW.monthly_fee IS DISTINCT FROM OLD.monthly_fee
     OR NEW.last_payment_date IS DISTINCT FROM OLD.last_payment_date
     OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
  THEN
    RAISE EXCEPTION 'Only super admins can modify subscription or billing fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_tenant_billing_change_trg ON public.tenants;
CREATE TRIGGER prevent_tenant_billing_change_trg
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.prevent_tenant_billing_change();
