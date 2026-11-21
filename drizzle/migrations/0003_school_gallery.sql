CREATE OR REPLACE FUNCTION public.can_manage_school_gallery(_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.is_super_admin() OR (public.has_role(auth.uid(), 'admin'::public.app_role) AND EXISTS (SELECT 1 FROM public.user_tenants WHERE user_id = auth.uid() AND tenant_id = _tenant_id)); $$;
REVOKE ALL ON FUNCTION public.can_manage_school_gallery(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_school_gallery(uuid) TO authenticated, service_role;

CREATE TABLE public.school_gallery (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES public.tenants(id),
 title text NOT NULL,
 description text NOT NULL DEFAULT '',
 event_date date NOT NULL DEFAULT CURRENT_DATE,
 image_path text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT gallery_title_length CHECK (length(btrim(title)) BETWEEN 1 AND 160),
 CONSTRAINT gallery_description_length CHECK (length(description) <= 3000),
 CONSTRAINT gallery_image_tenant CHECK (split_part(image_path, '/', 1) = tenant_id::text)
);
GRANT SELECT ON public.school_gallery TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_gallery TO authenticated;
GRANT ALL ON public.school_gallery TO service_role;
ALTER TABLE public.school_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public active school gallery" ON public.school_gallery FOR SELECT TO anon, authenticated USING (public.is_active_public_tenant(tenant_id));
CREATE POLICY "Gallery managers read" ON public.school_gallery FOR SELECT TO authenticated USING (public.can_manage_school_gallery(tenant_id));
CREATE POLICY "Gallery managers insert" ON public.school_gallery FOR INSERT TO authenticated WITH CHECK (public.can_manage_school_gallery(tenant_id));
CREATE POLICY "Gallery managers update" ON public.school_gallery FOR UPDATE TO authenticated USING (public.can_manage_school_gallery(tenant_id)) WITH CHECK (public.can_manage_school_gallery(tenant_id));
CREATE POLICY "Gallery managers delete" ON public.school_gallery FOR DELETE TO authenticated USING (public.can_manage_school_gallery(tenant_id));
CREATE INDEX school_gallery_tenant_date_idx ON public.school_gallery(tenant_id, event_date DESC);

CREATE POLICY "Gallery published photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'school-gallery' AND EXISTS (SELECT 1 FROM public.school_gallery g WHERE g.image_path = name AND public.is_active_public_tenant(g.tenant_id)));
CREATE POLICY "Gallery managers access photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'school-gallery' AND EXISTS (SELECT 1 FROM public.tenants t WHERE t.id::text = split_part(name, '/', 1) AND public.can_manage_school_gallery(t.id)));
CREATE POLICY "Gallery managers upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'school-gallery' AND EXISTS (SELECT 1 FROM public.tenants t WHERE t.id::text = split_part(name, '/', 1) AND public.can_manage_school_gallery(t.id)));
CREATE POLICY "Gallery managers delete photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'school-gallery' AND EXISTS (SELECT 1 FROM public.tenants t WHERE t.id::text = split_part(name, '/', 1) AND public.can_manage_school_gallery(t.id)));