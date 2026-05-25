
-- Link candidate to auth user (one auth user per candidate)
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;

CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON public.candidates(user_id);

-- Helper: is current user a candidate
CREATE OR REPLACE FUNCTION public.is_candidate()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'candidate'::public.app_role
  )
$$;

-- Helper: tenant of current candidate
CREATE OR REPLACE FUNCTION public.get_my_candidate_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.candidates WHERE user_id = auth.uid() LIMIT 1
$$;

-- Helper: id of current candidate row
CREATE OR REPLACE FUNCTION public.get_my_candidate_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.candidates WHERE user_id = auth.uid() LIMIT 1
$$;

-- Candidates: candidate can view their own row
CREATE POLICY "Candidates can view their own row"
ON public.candidates
FOR SELECT
TO authenticated
USING (is_candidate() AND user_id = auth.uid());

-- Candidate payments: candidate can view own
CREATE POLICY "Candidates can view their own payments"
ON public.candidate_payments
FOR SELECT
TO authenticated
USING (is_candidate() AND candidate_id = get_my_candidate_id());

-- Candidate lessons: candidate can view own
CREATE POLICY "Candidates can view their own lessons"
ON public.candidate_lessons
FOR SELECT
TO authenticated
USING (is_candidate() AND candidate_id = get_my_candidate_id());

-- Candidate exams: candidate can view own
CREATE POLICY "Candidates can view their own exams"
ON public.candidate_exams
FOR SELECT
TO authenticated
USING (is_candidate() AND candidate_id = get_my_candidate_id());

-- Tenants: candidate can read their tenant (for branding)
CREATE POLICY "Candidates can view their tenant"
ON public.tenants
FOR SELECT
TO authenticated
USING (is_candidate() AND id = get_my_candidate_tenant_id());

-- Staff (instructor info): candidate can view active staff in their tenant
CREATE POLICY "Candidates can view their tenant staff"
ON public.staff
FOR SELECT
TO authenticated
USING (is_candidate() AND tenant_id = get_my_candidate_tenant_id());

-- Exam requests table
CREATE TABLE public.exam_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  requested_date date NOT NULL,
  requested_time time NOT NULL,
  exam_type text NOT NULL DEFAULT 'praktike',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exam_requests_tenant ON public.exam_requests(tenant_id);
CREATE INDEX idx_exam_requests_candidate ON public.exam_requests(candidate_id);

ALTER TABLE public.exam_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their own exam requests"
ON public.exam_requests FOR SELECT TO authenticated
USING (is_candidate() AND candidate_id = get_my_candidate_id());

CREATE POLICY "Candidates can create exam requests"
ON public.exam_requests FOR INSERT TO authenticated
WITH CHECK (
  is_candidate()
  AND candidate_id = get_my_candidate_id()
  AND tenant_id = get_my_candidate_tenant_id()
  AND status = 'pending'
);

CREATE POLICY "Admins can view exam requests in their tenant"
ON public.exam_requests FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can update exam requests in their tenant"
ON public.exam_requests FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can delete exam requests in their tenant"
ON public.exam_requests FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_belongs_to_tenant(tenant_id));

CREATE TRIGGER trg_exam_requests_updated_at
BEFORE UPDATE ON public.exam_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
