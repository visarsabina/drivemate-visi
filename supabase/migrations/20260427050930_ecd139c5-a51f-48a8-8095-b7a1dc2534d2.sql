
-- Treat super_admin as belonging to every tenant (for RLS)
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_tenants
      WHERE user_id = auth.uid() AND tenant_id = _tenant_id
    )
$function$;

-- Treat super_admin as having every role (admin, etc.) for RLS checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'super_admin'::app_role
    )
$function$;
