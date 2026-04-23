
CREATE TABLE public.vehicle_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_name text NOT NULL,
  service_type text NOT NULL,
  service_date date,
  service_km integer,
  next_service_date date,
  next_service_km integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view vehicle services"
  ON public.vehicle_services FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert vehicle services"
  ON public.vehicle_services FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vehicle services"
  ON public.vehicle_services FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vehicle services"
  ON public.vehicle_services FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vehicle_services_updated_at
  BEFORE UPDATE ON public.vehicle_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
