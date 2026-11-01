-- Phase 12: phone numbers and income tracking. Run once in Supabase: SQL Editor > New query > paste > Run.
alter table profiles add column if not exists phone text;

create table if not exists payments (
  id bigint generated always as identity primary key,
  student_id uuid references auth.users on delete set null,
  label text,
  amount numeric(8,2) not null,
  status text not null default 'owed',
  paid_on date,
  created_at timestamptz default now()
);
alter table payments enable row level security;
create policy "admins manage payments" on payments for all using (is_admin()) with check (is_admin());

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from teachers where lower(email) = lower(new.email)) or exists (select 1 from admins where lower(email) = lower(new.email)) then return new; end if;
  insert into profiles (id, email, full_name, phone) values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone') on conflict do nothing;
  return new;
end $$;
