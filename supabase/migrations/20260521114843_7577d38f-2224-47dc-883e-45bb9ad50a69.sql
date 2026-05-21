DELETE FROM public.candidate_payments
WHERE candidate_id IN (
  SELECT id FROM public.candidates
  WHERE created_at >= '2026-05-21 10:57:00+00'
    AND created_at <  '2026-05-21 10:58:00+00'
);

DELETE FROM public.candidate_lessons
WHERE candidate_id IN (
  SELECT id FROM public.candidates
  WHERE created_at >= '2026-05-21 10:57:00+00'
    AND created_at <  '2026-05-21 10:58:00+00'
);

DELETE FROM public.candidates
WHERE created_at >= '2026-05-21 10:57:00+00'
  AND created_at <  '2026-05-21 10:58:00+00';