
CREATE TYPE public.exam_type AS ENUM ('teori', 'praktike');
CREATE TYPE public.exam_status AS ENUM ('planifikuar', 'kaluar', 'deshtur', 'anuluar');

CREATE TABLE public.candidate_exams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  exam_date date NOT NULL,
  exam_time time NOT NULL,
  exam_type public.exam_type NOT NULL DEFAULT 'teori',
  status public.exam_status NOT NULL DEFAULT 'planifikuar',
  location text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidate_exams_tenant_date ON public.candidate_exams(tenant_id, exam_date);
CREATE INDEX idx_candidate_exams_candidate ON public.candidate_exams(candidate_id);

ALTER TABLE public.candidate_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view exams in their tenant"
  ON public.candidate_exams FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can insert exams in their tenant"
  ON public.candidate_exams FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can update exams in their tenant"
  ON public.candidate_exams FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can delete exams in their tenant"
  ON public.candidate_exams FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Instructors can view their candidates exams"
  ON public.candidate_exams FOR SELECT TO authenticated
  USING (
    is_instructor() AND user_belongs_to_tenant(tenant_id) AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_exams.candidate_id AND c.instructor_id = auth.uid()
    )
  );

CREATE TRIGGER update_candidate_exams_updated_at
  BEFORE UPDATE ON public.candidate_exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
