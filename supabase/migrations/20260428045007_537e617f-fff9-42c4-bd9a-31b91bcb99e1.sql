-- 1. Heq instructor_id nga employees (ishte vendosur gabim)
DROP POLICY IF EXISTS "Instructors can view their candidates" ON public.employees;
DROP POLICY IF EXISTS "Instructors can update their candidates" ON public.employees;
DROP INDEX IF EXISTS public.idx_employees_instructor_id;
ALTER TABLE public.employees DROP COLUMN IF EXISTS instructor_id;

-- 2. Krijo enum p\u00ebr statusin e kandidatit
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'candidate_status') THEN
    CREATE TYPE public.candidate_status AS ENUM ('regjistuar', 'ne_proces', 'kaluar', 'deshtur');
  END IF;
END$$;

-- 3. Tabela candidates
CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  instructor_id uuid,
  numri_regjistrimit text NOT NULL,
  numri_personal text,
  emri text NOT NULL,
  mbiemri text NOT NULL,
  emri_babait text,
  vendlindja text,
  telefon text,
  data_lindjes date,
  kategoria text NOT NULL DEFAULT 'B',
  certifikata_shendetsore text,
  vendi text,
  statusi public.candidate_status NOT NULL DEFAULT 'regjistuar',
  data_regjistrimit date NOT NULL DEFAULT CURRENT_DATE,
  shenimet text,
  shuma_marreveshjes numeric NOT NULL DEFAULT 0,
  vertetimi_printuar boolean NOT NULL DEFAULT false,
  dokumente_terhequr boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidates_tenant ON public.candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidates_instructor ON public.candidates(instructor_id);

-- 4. Tabela candidate_payments
CREATE TABLE IF NOT EXISTS public.candidate_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  shuma numeric NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_candidate ON public.candidate_payments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.candidate_payments(tenant_id);

-- 5. Trigger p\u00ebr updated_at te candidates
DROP TRIGGER IF EXISTS update_candidates_updated_at ON public.candidates;
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_payments ENABLE ROW LEVEL SECURITY;

-- 7. RLS p\u00ebr candidates
CREATE POLICY "Admins can view candidates in their tenant"
ON public.candidates FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can insert candidates in their tenant"
ON public.candidates FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can update candidates in their tenant"
ON public.candidates FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can delete candidates in their tenant"
ON public.candidates FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

-- Instructor: vet\u00ebm kandidat\u00ebt e tij
CREATE POLICY "Instructors can view their candidates"
ON public.candidates FOR SELECT TO authenticated
USING (is_instructor() AND user_belongs_to_tenant(tenant_id) AND instructor_id = auth.uid());

CREATE POLICY "Instructors can update their candidates"
ON public.candidates FOR UPDATE TO authenticated
USING (is_instructor() AND user_belongs_to_tenant(tenant_id) AND instructor_id = auth.uid())
WITH CHECK (is_instructor() AND user_belongs_to_tenant(tenant_id) AND instructor_id = auth.uid());

-- 8. RLS p\u00ebr candidate_payments
CREATE POLICY "Admins can view payments in their tenant"
ON public.candidate_payments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can insert payments in their tenant"
ON public.candidate_payments FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can update payments in their tenant"
ON public.candidate_payments FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can delete payments in their tenant"
ON public.candidate_payments FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Instructors can view their candidates payments"
ON public.candidate_payments FOR SELECT TO authenticated
USING (
  is_instructor()
  AND user_belongs_to_tenant(tenant_id)
  AND EXISTS (
    SELECT 1 FROM public.candidates c
    WHERE c.id = candidate_payments.candidate_id
      AND c.instructor_id = auth.uid()
  )
);
