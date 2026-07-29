CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  topic TEXT,
  platform TEXT NOT NULL DEFAULT 'Facebook',
  tone TEXT,
  length TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  external_post_id TEXT,
  publish_error TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_posts TO authenticated;
GRANT ALL ON public.social_posts TO service_role;

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage social posts in their tenant"
ON public.social_posts FOR ALL TO authenticated
USING (public.user_belongs_to_tenant(tenant_id) AND (public.has_role(auth.uid(), 'admin') OR public.is_super_admin()))
WITH CHECK (public.user_belongs_to_tenant(tenant_id) AND (public.has_role(auth.uid(), 'admin') OR public.is_super_admin()));

CREATE POLICY "Super admins manage all social posts"
ON public.social_posts FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE TRIGGER update_social_posts_updated_at
BEFORE UPDATE ON public.social_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_social_posts_tenant_created ON public.social_posts (tenant_id, created_at DESC);