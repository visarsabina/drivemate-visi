-- Status enum
CREATE TYPE public.registration_status AS ENUM ('new', 'contacted', 'enrolled', 'rejected');

-- Registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  status public.registration_status NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT full_name_length CHECK (char_length(full_name) BETWEEN 2 AND 100),
  CONSTRAINT email_length CHECK (char_length(email) BETWEEN 3 AND 255),
  CONSTRAINT phone_length CHECK (char_length(phone) BETWEEN 6 AND 20),
  CONSTRAINT category_length CHECK (char_length(category) BETWEEN 1 AND 10)
);

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can submit a registration
CREATE POLICY "Anyone can submit a registration"
ON public.registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view registrations
CREATE POLICY "Admins can view registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update registrations
CREATE POLICY "Admins can update registrations"
ON public.registrations
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete registrations
CREATE POLICY "Admins can delete registrations"
ON public.registrations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Reusable updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for sorting by date in admin view
CREATE INDEX idx_registrations_created_at ON public.registrations (created_at DESC);