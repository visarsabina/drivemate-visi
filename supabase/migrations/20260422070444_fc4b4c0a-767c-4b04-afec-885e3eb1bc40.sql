ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS inspection_date date,
  ADD COLUMN IF NOT EXISTS registration_expiry_date date;