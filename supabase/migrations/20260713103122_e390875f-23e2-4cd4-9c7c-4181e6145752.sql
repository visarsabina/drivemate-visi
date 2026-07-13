CREATE TABLE public.question_overrides (
  question_id TEXT PRIMARY KEY,
  text TEXT,
  options JSONB,
  correct_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.question_overrides TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.question_overrides TO authenticated;
GRANT ALL ON public.question_overrides TO service_role;

ALTER TABLE public.question_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read question overrides"
ON public.question_overrides FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can insert question overrides"
ON public.question_overrides FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update question overrides"
ON public.question_overrides FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete question overrides"
ON public.question_overrides FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_question_overrides_updated_at
BEFORE UPDATE ON public.question_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();