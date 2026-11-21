CREATE OR REPLACE FUNCTION public.prevent_candidate_user_link_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('service_role','postgres','supabase_admin') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Candidate account link can only be set by the system';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Candidate account link can only be changed by the system';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_prevent_candidate_user_link_change ON public.candidates;
CREATE TRIGGER trg_prevent_candidate_user_link_change BEFORE INSERT OR UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.prevent_candidate_user_link_change();