-- Create staff table
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  categories TEXT,
  photo_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active staff"
ON public.staff
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all staff"
ON public.staff
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert staff"
ON public.staff
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update staff"
ON public.staff
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete staff"
ON public.staff
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial staff
INSERT INTO public.staff (name, role, categories, display_order) VALUES
('Visar Jaha', 'Instruktor', 'B, C1, C, CE, D', 1),
('Fadil Jaha', 'Instruktor', 'B, C1, C, CE, D', 2),
('Remzie Jaha', 'Instruktore', 'B', 3),
('Nesibe Zeka', 'Instruktore', 'B', 4),
('Dafina Hodolli', 'Instruktore', 'B', 5),
('Sabina Krasniqi', 'Instruktore', 'B', 6),
('Afrim Jaha', 'Ligjërues', NULL, 7),
('Alma Llugaliu', 'Asistente', NULL, 8);