
-- Activity logs table
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid,
  user_id uuid,
  user_email text,
  action text NOT NULL, -- INSERT | UPDATE | DELETE
  table_name text NOT NULL,
  row_id uuid,
  old_data jsonb,
  new_data jsonb,
  summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view their tenant activity"
ON public.activity_logs FOR SELECT
TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id))
  OR public.is_super_admin()
);

-- Block direct inserts from clients; only triggers (security definer) should write
CREATE POLICY "No client inserts"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE INDEX idx_activity_logs_tenant_created ON public.activity_logs (tenant_id, created_at DESC);
CREATE INDEX idx_activity_logs_table_row ON public.activity_logs (table_name, row_id);

-- Generic logging function
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_row_id uuid;
  v_old jsonb;
  v_new jsonb;
  v_email text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_tenant_id := (v_old->>'tenant_id')::uuid;
    v_row_id := (v_old->>'id')::uuid;
  ELSIF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_tenant_id := (v_new->>'tenant_id')::uuid;
    v_row_id := (v_new->>'id')::uuid;
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_tenant_id := (v_new->>'tenant_id')::uuid;
    v_row_id := (v_new->>'id')::uuid;
  END IF;

  SELECT email::text INTO v_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.activity_logs (
    tenant_id, user_id, user_email, action, table_name, row_id, old_data, new_data
  ) VALUES (
    v_tenant_id, auth.uid(), v_email, TG_OP, TG_TABLE_NAME, v_row_id, v_old, v_new
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach triggers to key tables
CREATE TRIGGER trg_log_candidates
AFTER INSERT OR UPDATE OR DELETE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_log_candidate_payments
AFTER INSERT OR UPDATE OR DELETE ON public.candidate_payments
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_log_candidate_lessons
AFTER INSERT OR UPDATE OR DELETE ON public.candidate_lessons
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_log_candidate_exams
AFTER INSERT OR UPDATE OR DELETE ON public.candidate_exams
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_log_vehicles
AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_log_vehicle_services
AFTER INSERT OR UPDATE OR DELETE ON public.vehicle_services
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_log_employees
AFTER INSERT OR UPDATE OR DELETE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_log_staff
AFTER INSERT OR UPDATE OR DELETE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_log_licenses
AFTER INSERT OR UPDATE OR DELETE ON public.licenses
FOR EACH ROW EXECUTE FUNCTION public.log_activity();
