
-- Restrict SELECT on billing/subscription columns to service_role only.
-- Regular authenticated users (including tenant admins) must use the
-- SECURITY DEFINER RPCs (get_my_tenant_subscription, list_all_tenants_with_stats,
-- super_admin_tenant_details, etc.) to read billing info.
REVOKE SELECT (subscription_status, subscription_ends_at, trial_ends_at, monthly_fee, last_payment_date, subscription_notes)
  ON public.tenants FROM authenticated, anon, PUBLIC;

-- Also block direct UPDATE of billing columns by tenant admins at the column level.
REVOKE UPDATE (subscription_status, subscription_ends_at, trial_ends_at, monthly_fee, last_payment_date, subscription_notes, is_active)
  ON public.tenants FROM authenticated, anon, PUBLIC;

-- Belt-and-suspenders: ensure the guard trigger is attached so any future
-- broadened grant still cannot let non-super-admins change billing fields.
DROP TRIGGER IF EXISTS trg_prevent_tenant_billing_change ON public.tenants;
CREATE TRIGGER trg_prevent_tenant_billing_change
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.prevent_tenant_billing_change();
