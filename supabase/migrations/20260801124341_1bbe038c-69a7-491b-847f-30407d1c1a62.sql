REVOKE UPDATE ON public.tenants FROM authenticated;
REVOKE UPDATE ON public.tenants FROM anon;
REVOKE INSERT, DELETE ON public.tenants FROM anon;

GRANT UPDATE (name, slug, domain, logo_url, primary_color, phone, address, email, director_name, updated_at)
  ON public.tenants TO authenticated;

GRANT ALL ON public.tenants TO service_role;