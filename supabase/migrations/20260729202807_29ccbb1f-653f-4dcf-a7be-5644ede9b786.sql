ALTER TABLE public.marketing_posts
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS category text;

UPDATE public.marketing_posts SET category = driving_category WHERE category IS NULL;