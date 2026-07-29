CREATE TABLE public.marketing_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'all',
  content_type text NOT NULL DEFAULT 'offer',
  driving_category text,
  tone text NOT NULL DEFAULT 'professional',
  target_audience text,
  extra_instructions text,
  caption text,
  hashtags text,
  cta text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_posts TO authenticated;
GRANT ALL ON public.marketing_posts TO service_role;

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their marketing posts"
ON public.marketing_posts FOR SELECT TO authenticated
USING (public.user_belongs_to_tenant(tenant_id));

CREATE POLICY "Tenant admins can create marketing posts"
ON public.marketing_posts FOR INSERT TO authenticated
WITH CHECK (public.user_belongs_to_tenant(tenant_id) AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin()));

CREATE POLICY "Tenant admins can update marketing posts"
ON public.marketing_posts FOR UPDATE TO authenticated
USING (public.user_belongs_to_tenant(tenant_id) AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin()))
WITH CHECK (public.user_belongs_to_tenant(tenant_id));

CREATE POLICY "Tenant admins can delete marketing posts"
ON public.marketing_posts FOR DELETE TO authenticated
USING (public.user_belongs_to_tenant(tenant_id) AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin()));

CREATE TRIGGER update_marketing_posts_updated_at
BEFORE UPDATE ON public.marketing_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();