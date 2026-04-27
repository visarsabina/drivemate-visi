-- 1. Shto vlerën 'instructor' në enum app_role (nëse nuk ekziston)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'instructor'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'instructor';
  END IF;
END$$;
