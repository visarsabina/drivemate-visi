-- Add total lessons to candidates (default 20)
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS total_lessons integer NOT NULL DEFAULT 20;

-- Create candidate_lessons table
CREATE TABLE IF NOT EXISTS public.candidate_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_lessons_candidate ON public.candidate_lessons(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_lessons_tenant ON public.candidate_lessons(tenant_id);

ALTER TABLE public.candidate_lessons ENABLE ROW LEVEL SECURITY;

-- Admins: full access in their tenant
CREATE POLICY "Admins can view lessons in their tenant"
ON public.candidate_lessons FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can insert lessons in their tenant"
ON public.candidate_lessons FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can update lessons in their tenant"
ON public.candidate_lessons FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can delete lessons in their tenant"
ON public.candidate_lessons FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

-- Instructors: only for their assigned candidates
CREATE POLICY "Instructors can view their candidates lessons"
ON public.candidate_lessons FOR SELECT TO authenticated
USING (
  is_instructor() AND user_belongs_to_tenant(tenant_id)
  AND EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = candidate_lessons.candidate_id AND c.instructor_id = auth.uid())
);

CREATE POLICY "Instructors can insert lessons for their candidates"
ON public.candidate_lessons FOR INSERT TO authenticated
WITH CHECK (
  is_instructor() AND user_belongs_to_tenant(tenant_id)
  AND EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = candidate_lessons.candidate_id AND c.instructor_id = auth.uid())
);

CREATE POLICY "Instructors can delete lessons for their candidates"
ON public.candidate_lessons FOR DELETE TO authenticated
USING (
  is_instructor() AND user_belongs_to_tenant(tenant_id)
  AND EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = candidate_lessons.candidate_id AND c.instructor_id = auth.uid())
);