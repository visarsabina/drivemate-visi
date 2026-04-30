
CREATE OR REPLACE FUNCTION public.get_public_tenant_by_slug(_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  domain text,
  logo_url text,
  primary_color text,
  phone text,
  address text,
  email text,
  director_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name, t.slug, t.domain, t.logo_url, t.primary_color,
         t.phone, t.address, t.email, t.director_name
  FROM public.tenants t
  WHERE t.slug = _slug AND t.is_active = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_public_tenant_by_domain(_domain text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  domain text,
  logo_url text,
  primary_color text,
  phone text,
  address text,
  email text,
  director_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name, t.slug, t.domain, t.logo_url, t.primary_color,
         t.phone, t.address, t.email, t.director_name
  FROM public.tenants t
  WHERE t.domain = _domain AND t.is_active = true
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_public_tenant_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_tenant_by_domain(text) TO anon, authenticated;
