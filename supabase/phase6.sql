-- Phase 6: student and client portals. Run once in Supabase: SQL Editor > New query > paste > Run.

create or replace function is_admin() returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email'))
$$;

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "admins read profiles" on profiles for select using (is_admin());

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name) values (new.id, new.email, new.raw_user_meta_data ->> 'full_name') on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
insert into profiles (id, email, full_name) select id, email, raw_user_meta_data ->> 'full_name' from auth.users on conflict do nothing;

create table if not exists class_logs (
  id bigint generated always as identity primary key,
  student_id uuid not null references auth.users on delete cascade,
  taken_on date not null default current_date,
  lesson text,
  note text,
  created_at timestamptz default now()
);
create table if not exists lesson_progress (
  student_id uuid not null references auth.users on delete cascade,
  lesson text not null,
  primary key (student_id, lesson)
);
alter table class_logs enable row level security;
alter table lesson_progress enable row level security;

create policy "own or admin read classes" on class_logs for select using (auth.uid() = student_id or is_admin());
create policy "admins add classes" on class_logs for insert with check (is_admin());
create policy "admins edit classes" on class_logs for update using (is_admin());
create policy "admins delete classes" on class_logs for delete using (is_admin());
create policy "own or admin read lessons" on lesson_progress for select using (auth.uid() = student_id or is_admin());
create policy "admins add lessons" on lesson_progress for insert with check (is_admin());
create policy "admins delete lessons" on lesson_progress for delete using (is_admin());

create policy "admins read all results" on results for select using (is_admin());
