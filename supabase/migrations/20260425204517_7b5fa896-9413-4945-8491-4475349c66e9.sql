
-- ============================================================
-- FAZA 1: MULTI-TENANT FOUNDATION
-- ============================================================

-- 1. Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0ea5e9',
  phone TEXT,
  address TEXT,
  email TEXT,
  director_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Create user_tenants junction table
CREATE TABLE public.user_tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);

ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);

-- 3. Helper function: get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_tenants
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- 4. Helper function: check if user belongs to tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenants
    WHERE user_id = auth.uid() AND tenant_id = _tenant_id
  )
$$;

-- 5. Seed first tenant: Auto Shkolla Visi
INSERT INTO public.tenants (name, slug, domain, primary_color, is_active)
VALUES ('Auto Shkolla Visi', 'visi', 'autoshkollavisi.com', '#0ea5e9', true);

-- 6. Link all existing admin users to Visi tenant
INSERT INTO public.user_tenants (user_id, tenant_id)
SELECT ur.user_id, (SELECT id FROM public.tenants WHERE slug = 'visi')
FROM public.user_roles ur
WHERE ur.role = 'admin'::app_role
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- 7. Add tenant_id to all existing tables (nullable first, then backfill, then enforce)
ALTER TABLE public.employees ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.vehicles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.vehicle_services ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.licenses ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.registrations ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.staff ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 8. Backfill: link all existing data to Visi tenant
UPDATE public.employees SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'visi') WHERE tenant_id IS NULL;
UPDATE public.vehicles SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'visi') WHERE tenant_id IS NULL;
UPDATE public.vehicle_services SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'visi') WHERE tenant_id IS NULL;
UPDATE public.licenses SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'visi') WHERE tenant_id IS NULL;
UPDATE public.registrations SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'visi') WHERE tenant_id IS NULL;
UPDATE public.staff SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'visi') WHERE tenant_id IS NULL;

-- 9. Enforce NOT NULL on tenant_id
ALTER TABLE public.employees ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicle_services ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.licenses ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.staff ALTER COLUMN tenant_id SET NOT NULL;

-- 10. Create indexes for tenant_id
CREATE INDEX idx_employees_tenant_id ON public.employees(tenant_id);
CREATE INDEX idx_vehicles_tenant_id ON public.vehicles(tenant_id);
CREATE INDEX idx_vehicle_services_tenant_id ON public.vehicle_services(tenant_id);
CREATE INDEX idx_licenses_tenant_id ON public.licenses(tenant_id);
CREATE INDEX idx_registrations_tenant_id ON public.registrations(tenant_id);
CREATE INDEX idx_staff_tenant_id ON public.staff(tenant_id);

-- ============================================================
-- 11. RLS POLICIES — TENANTS table
-- ============================================================
CREATE POLICY "Users can view their tenant"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_tenant(id));

CREATE POLICY "Anyone can view tenant by domain (public lookup)"
  ON public.tenants FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Admins can update their tenant"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (public.user_belongs_to_tenant(id) AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.user_belongs_to_tenant(id) AND public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 12. RLS POLICIES — USER_TENANTS table
-- ============================================================
CREATE POLICY "Users can view their own tenant memberships"
  ON public.user_tenants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view memberships in their tenant"
  ON public.user_tenants FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_tenant(tenant_id) AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can add users to their tenant"
  ON public.user_tenants FOR INSERT
  TO authenticated
  WITH CHECK (public.user_belongs_to_tenant(tenant_id) AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can remove users from their tenant"
  ON public.user_tenants FOR DELETE
  TO authenticated
  USING (public.user_belongs_to_tenant(tenant_id) AND public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 13. UPDATE RLS POLICIES on existing tables to scope by tenant
-- ============================================================

-- EMPLOYEES
DROP POLICY IF EXISTS "Admins can view employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;

CREATE POLICY "Admins can view employees in their tenant"
  ON public.employees FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can insert employees in their tenant"
  ON public.employees FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can update employees in their tenant"
  ON public.employees FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can delete employees in their tenant"
  ON public.employees FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));

-- VEHICLES
DROP POLICY IF EXISTS "Admins can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;

CREATE POLICY "Admins can view vehicles in their tenant"
  ON public.vehicles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can insert vehicles in their tenant"
  ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can update vehicles in their tenant"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can delete vehicles in their tenant"
  ON public.vehicles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));

-- VEHICLE_SERVICES
DROP POLICY IF EXISTS "Admins can view vehicle services" ON public.vehicle_services;
DROP POLICY IF EXISTS "Admins can insert vehicle services" ON public.vehicle_services;
DROP POLICY IF EXISTS "Admins can update vehicle services" ON public.vehicle_services;
DROP POLICY IF EXISTS "Admins can delete vehicle services" ON public.vehicle_services;

CREATE POLICY "Admins can view vehicle services in their tenant"
  ON public.vehicle_services FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can insert vehicle services in their tenant"
  ON public.vehicle_services FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can update vehicle services in their tenant"
  ON public.vehicle_services FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can delete vehicle services in their tenant"
  ON public.vehicle_services FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));

-- LICENSES
DROP POLICY IF EXISTS "Admins can view licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can insert licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can update licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can delete licenses" ON public.licenses;

CREATE POLICY "Admins can view licenses in their tenant"
  ON public.licenses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can insert licenses in their tenant"
  ON public.licenses FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can update licenses in their tenant"
  ON public.licenses FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can delete licenses in their tenant"
  ON public.licenses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));

-- REGISTRATIONS
DROP POLICY IF EXISTS "Admins can view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can submit a registration" ON public.registrations;

CREATE POLICY "Admins can view registrations in their tenant"
  ON public.registrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can update registrations in their tenant"
  ON public.registrations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can delete registrations in their tenant"
  ON public.registrations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Anyone can submit a registration to an active tenant"
  ON public.registrations FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.is_active = true)
  );

-- STAFF
DROP POLICY IF EXISTS "Admins can view all staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can insert staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can update staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can delete staff" ON public.staff;
DROP POLICY IF EXISTS "Anyone can view active staff" ON public.staff;

CREATE POLICY "Admins can view staff in their tenant"
  ON public.staff FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can insert staff in their tenant"
  ON public.staff FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can update staff in their tenant"
  ON public.staff FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Admins can delete staff in their tenant"
  ON public.staff FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "Anyone can view active staff (public)"
  ON public.staff FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- 14. Trigger for tenants updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
