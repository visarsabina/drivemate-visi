ALTER TABLE public.marketing_posts
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS publish_date timestamptz;

CREATE TABLE public.marketing_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_assets TO authenticated;
GRANT ALL ON public.marketing_assets TO service_role;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tenant marketing assets"
ON public.marketing_assets FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));

CREATE TABLE public.marketing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  platform text NOT NULL DEFAULT 'all',
  content text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_templates TO authenticated;
GRANT ALL ON public.marketing_templates TO service_role;
ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tenant marketing templates"
ON public.marketing_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND public.user_belongs_to_tenant(tenant_id));

CREATE INDEX idx_marketing_assets_tenant ON public.marketing_assets(tenant_id);
CREATE INDEX idx_marketing_templates_tenant ON public.marketing_templates(tenant_id);

CREATE TRIGGER update_marketing_assets_updated_at
BEFORE UPDATE ON public.marketing_assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_templates_updated_at
BEFORE UPDATE ON public.marketing_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();