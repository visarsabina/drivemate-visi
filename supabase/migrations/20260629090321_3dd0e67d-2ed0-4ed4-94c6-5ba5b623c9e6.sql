
-- 1) Registrations: validate inputs to limit abuse of public insert
CREATE OR REPLACE FUNCTION public.validate_registration_input()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.full_name IS NULL OR length(btrim(NEW.full_name)) < 2 OR length(NEW.full_name) > 120 THEN
    RAISE EXCEPTION 'Invalid full_name';
  END IF;
  IF NEW.email IS NOT NULL AND (length(NEW.email) > 255 OR NEW.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF NEW.phone IS NOT NULL AND (length(NEW.phone) > 32 OR NEW.phone !~ '^[+0-9 ()\-]{5,32}$') THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF NEW.message IS NOT NULL AND length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Message too long';
  END IF;
  -- force safe defaults
  NEW.status := COALESCE(NEW.status, 'new');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_registration_input ON public.registrations;
CREATE TRIGGER trg_validate_registration_input
BEFORE INSERT OR UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.validate_registration_input();

-- 2) User roles: tighten admin manage policy
DROP POLICY IF EXISTS "Admins can manage non-super-admin roles in their tenant" ON public.user_roles;

CREATE POLICY "Admins can assign limited roles in their tenant"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND role IN ('instructor'::app_role, 'candidate'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.user_tenants ut_target
    JOIN public.user_tenants ut_admin ON ut_admin.tenant_id = ut_target.tenant_id
    WHERE ut_target.user_id = user_roles.user_id
      AND ut_admin.user_id = auth.uid()
      AND ut_admin.tenant_id = public.get_user_tenant_id()
  )
);

CREATE POLICY "Admins can remove limited roles in their tenant"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND role IN ('instructor'::app_role, 'candidate'::app_role)
  AND user_id <> auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.user_tenants ut_target
    JOIN public.user_tenants ut_admin ON ut_admin.tenant_id = ut_target.tenant_id
    WHERE ut_target.user_id = user_roles.user_id
      AND ut_admin.user_id = auth.uid()
      AND ut_admin.tenant_id = public.get_user_tenant_id()
  )
);
