-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  personal_number TEXT,
  license_number TEXT,
  license_date DATE,
  license_expiry_date DATE,
  health_certificate_date DATE,
  health_certificate_expiry_date DATE,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for employee photos (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-photos', 'employee-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Employee photos are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'employee-photos');

CREATE POLICY "Admins can upload employee photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update employee photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'employee-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete employee photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'employee-photos' AND has_role(auth.uid(), 'admin'::app_role));