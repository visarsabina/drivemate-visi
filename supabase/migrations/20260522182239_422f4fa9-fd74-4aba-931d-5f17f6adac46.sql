
DROP POLICY IF EXISTS "Anyone can view active staff (public)" ON public.staff;

CREATE OR REPLACE FUNCTION public.get_public_staff_by_tenant(_tenant_id uuid)
RETURNS TABLE(id uuid, name text, role text, categories text, photo_url text, display_order integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, s.role, s.categories, s.photo_url, s.display_order
  FROM public.staff s
  INNER JOIN public.tenants t ON t.id = s.tenant_id
  WHERE s.tenant_id = _tenant_id
    AND s.is_active = true
    AND t.is_active = true
  ORDER BY s.display_order ASC
$$;

GRANT EXECUTE ON FUNCTION public.get_public_staff_by_tenant(uuid) TO anon, authenticated;
