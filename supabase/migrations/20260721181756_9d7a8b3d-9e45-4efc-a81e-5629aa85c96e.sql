CREATE OR REPLACE FUNCTION public.validate_registration_input()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.full_name IS NULL OR length(btrim(NEW.full_name)) < 2 OR length(NEW.full_name) > 120 THEN
    RAISE EXCEPTION 'Invalid full_name';
  END IF;
  IF NEW.email IS NOT NULL AND (length(NEW.email) > 255 OR NEW.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF NEW.phone IS NOT NULL AND (length(NEW.phone) > 32 OR NEW.phone !~ '^[+0-9 ()\-]{5,32}$') THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 2000 THEN
    RAISE EXCEPTION 'Notes too long';
  END IF;
  NEW.status := COALESCE(NEW.status, 'new');
  RETURN NEW;
END;
$function$;