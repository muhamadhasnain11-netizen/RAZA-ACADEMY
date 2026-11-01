-- Phase 11: theory test date. Run once in Supabase: SQL Editor > New query > paste > Run.
alter table profiles add column if not exists test_date date;
create policy "students update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
