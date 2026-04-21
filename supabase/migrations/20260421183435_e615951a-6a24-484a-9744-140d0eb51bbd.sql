
INSERT INTO storage.buckets (id, name, public) VALUES ('staff-photos', 'staff-photos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read staff photos" ON storage.objects FOR SELECT USING (bucket_id = 'staff-photos');
CREATE POLICY "Admins upload staff photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'staff-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update staff photos" ON storage.objects FOR UPDATE USING (bucket_id = 'staff-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete staff photos" ON storage.objects FOR DELETE USING (bucket_id = 'staff-photos' AND public.has_role(auth.uid(), 'admin'));
