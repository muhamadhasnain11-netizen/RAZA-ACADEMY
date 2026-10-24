-- Phase 4: booking requests. Run once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists bookings (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  name text not null,
  phone text not null,
  email text,
  session_type text not null,
  preferred_time text not null,
  note text,
  status text not null default 'new'
);

alter table bookings enable row level security;

create policy "anyone can request a booking" on bookings for insert with check (status = 'new');
create policy "admins read bookings" on bookings for select
  using (exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email')));
create policy "admins update bookings" on bookings for update
  using (exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email')));
create policy "admins delete bookings" on bookings for delete
  using (exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email')));
