-- 1. Shto kolonën instructor_id te employees (kandidatët)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS instructor_id uuid;

CREATE INDEX IF NOT EXISTS idx_employees_instructor_id
  ON public.employees(instructor_id);

-- 2. Funksion ndihmës: a është caller instruktor?
CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'instructor'::public.app_role
  )
$$;

-- 3. RLS për instruktorët te employees
DROP POLICY IF EXISTS "Instructors can view their candidates" ON public.employees;
DROP POLICY IF EXISTS "Instructors can update their candidates" ON public.employees;

CREATE POLICY "Instructors can view their candidates"
ON public.employees
FOR SELECT
TO authenticated
USING (
  public.is_instructor()
  AND public.user_belongs_to_tenant(tenant_id)
  AND instructor_id = auth.uid()
);

CREATE POLICY "Instructors can update their candidates"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  public.is_instructor()
  AND public.user_belongs_to_tenant(tenant_id)
  AND instructor_id = auth.uid()
)
WITH CHECK (
  public.is_instructor()
  AND public.user_belongs_to_tenant(tenant_id)
  AND instructor_id = auth.uid()
);

-- 4. Funksion: lista e instruktorëve të tenant-it (për dropdown te admin)
CREATE OR REPLACE FUNCTION public.list_instructors_in_my_tenant()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_tenant uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  caller_tenant := public.get_user_tenant_id();
  IF caller_tenant IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.id AS user_id, u.email::text
  FROM auth.users u
  INNER JOIN public.user_tenants ut ON ut.user_id = u.id
  INNER JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE ut.tenant_id = caller_tenant
    AND ur.role = 'instructor'::public.app_role
  ORDER BY u.email;
END;
$$;

-- 5. Përditëso list_users_in_my_tenant që të kthejë edhe rolin instructor
DROP FUNCTION IF EXISTS public.list_users_in_my_tenant();

CREATE OR REPLACE FUNCTION public.list_users_in_my_tenant()
RETURNS TABLE(user_id uuid, email text, created_at timestamp with time zone, is_admin boolean, is_instructor boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_tenant uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  caller_tenant := public.get_user_tenant_id();
  IF caller_tenant IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    u.created_at,
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'admin'::app_role
    ) AS is_admin,
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'instructor'::app_role
    ) AS is_instructor
  FROM auth.users u
  INNER JOIN public.user_tenants ut ON ut.user_id = u.id
  WHERE ut.tenant_id = caller_tenant
  ORDER BY u.created_at DESC;
END;
$$;
