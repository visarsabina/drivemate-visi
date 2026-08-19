drop policy if exists "Anyone authenticated can read question images" on storage.objects;
create policy "Anyone can read question images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'question-images');

drop policy if exists "Authenticated can read question overrides" on public.question_overrides;
create policy "Anyone can read question overrides"
on public.question_overrides for select
to anon, authenticated
using (true);

grant select on public.question_overrides to anon;
grant select on public.question_overrides to authenticated;