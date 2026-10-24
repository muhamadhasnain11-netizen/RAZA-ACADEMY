-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Phase 2 connects the site to these tables.
create table if not exists questions (
  id bigint generated always as identity primary key,
  topic text,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text,
  created_at timestamptz default now()
);

create table if not exists results (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  score int not null,
  total int not null,
  passed boolean not null,
  answers jsonb,
  taken_at timestamptz default now()
);

alter table questions enable row level security;
alter table results enable row level security;

create policy "anyone can read questions" on questions for select using (true);
create policy "users read own results" on results for select using (auth.uid() = user_id);
create policy "users add own results" on results for insert with check (auth.uid() = user_id);
