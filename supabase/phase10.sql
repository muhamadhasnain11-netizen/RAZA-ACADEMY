-- Phase 10: teachers, classes, sessions, attendance. Run once in Supabase: SQL Editor > New query > paste > Run.
create table if not exists teachers (email text primary key, name text not null);
create table if not exists classes (id bigint generated always as identity primary key, name text not null, kind text not null default 'group', teacher_email text not null references teachers(email) on update cascade, created_at timestamptz default now());
create table if not exists enrolments (class_id bigint references classes on delete cascade, student_id uuid references auth.users on delete cascade, joined_on date default current_date, primary key (class_id, student_id));
create table if not exists sessions (id bigint generated always as identity primary key, class_id bigint not null references classes on delete cascade, starts_at timestamptz not null, lesson_key text, lesson_title text, checked_in_at timestamptz, checked_out_at timestamptz, note text);
create table if not exists attendance (session_id bigint references sessions on delete cascade, student_id uuid references auth.users on delete cascade, primary key (session_id, student_id));
alter table class_logs add column if not exists session_id bigint references sessions on delete cascade;

create or replace function my_email() returns text language sql stable as $$ select lower(auth.jwt() ->> 'email') $$;
create or replace function owns_class(cid bigint) returns boolean language sql security definer stable set search_path = public as $$ select exists (select 1 from classes where id = cid and lower(teacher_email) = my_email()) $$;
create or replace function in_class(cid bigint) returns boolean language sql security definer stable set search_path = public as $$ select exists (select 1 from enrolments where class_id = cid and student_id = auth.uid()) $$;
create or replace function teaches(student uuid) returns boolean language sql security definer stable set search_path = public as $$ select exists (select 1 from enrolments e join classes c on c.id = e.class_id where e.student_id = student and lower(c.teacher_email) = my_email()) $$;

alter table teachers enable row level security;
alter table classes enable row level security;
alter table enrolments enable row level security;
alter table sessions enable row level security;
alter table attendance enable row level security;

create policy "admins manage teachers" on teachers for all using (is_admin()) with check (is_admin());
create policy "teacher reads self" on teachers for select using (lower(email) = my_email());
create policy "admins manage classes" on classes for all using (is_admin()) with check (is_admin());
create policy "teacher reads classes" on classes for select using (lower(teacher_email) = my_email());
create policy "student reads classes" on classes for select using (in_class(id));
create policy "admins manage enrolments" on enrolments for all using (is_admin()) with check (is_admin());
create policy "teacher reads enrolments" on enrolments for select using (owns_class(class_id));
create policy "student reads enrolments" on enrolments for select using (student_id = auth.uid());
create policy "admins manage sessions" on sessions for all using (is_admin()) with check (is_admin());
create policy "teacher reads sessions" on sessions for select using (owns_class(class_id));
create policy "teacher updates sessions" on sessions for update using (owns_class(class_id));
create policy "student reads sessions" on sessions for select using (in_class(class_id));
create policy "admins manage attendance" on attendance for all using (is_admin()) with check (is_admin());
create policy "teacher reads attendance" on attendance for select using (exists (select 1 from sessions s where s.id = session_id and owns_class(s.class_id)));
create policy "teacher adds attendance" on attendance for insert with check (exists (select 1 from sessions s where s.id = session_id and owns_class(s.class_id)));
create policy "teacher removes attendance" on attendance for delete using (exists (select 1 from sessions s where s.id = session_id and owns_class(s.class_id)));
create policy "student reads attendance" on attendance for select using (student_id = auth.uid());
create policy "teacher reads student profiles" on profiles for select using (teaches(id));
create policy "teacher reads student results" on results for select using (teaches(user_id));
create policy "teacher reads student classes" on class_logs for select using (teaches(student_id));
create policy "teacher reads student lessons" on lesson_progress for select using (teaches(student_id));

-- Attendance feeds the student's class history and lesson progress automatically.
create or replace function on_attendance_added() returns trigger language plpgsql security definer set search_path = public as $$
declare s sessions%rowtype;
begin
  select * into s from sessions where id = new.session_id;
  insert into class_logs (student_id, taken_on, lesson, note, session_id) values (new.student_id, (s.starts_at at time zone 'Europe/London')::date, s.lesson_title, s.note, s.id);
  if s.lesson_key is not null then insert into lesson_progress (student_id, lesson) values (new.student_id, s.lesson_key) on conflict do nothing; end if;
  return new;
end $$;
drop trigger if exists attendance_added on attendance;
create trigger attendance_added after insert on attendance for each row execute function on_attendance_added();

create or replace function on_attendance_removed() returns trigger language plpgsql security definer set search_path = public as $$
begin delete from class_logs where session_id = old.session_id and student_id = old.student_id; return old; end $$;
drop trigger if exists attendance_removed on attendance;
create trigger attendance_removed after delete on attendance for each row execute function on_attendance_removed();

create or replace function on_session_updated() returns trigger language plpgsql security definer set search_path = public as $$
begin update class_logs set lesson = new.lesson_title, note = new.note where session_id = new.id; return new; end $$;
drop trigger if exists session_updated on sessions;
create trigger session_updated after update on sessions for each row execute function on_session_updated();

-- Teachers and the owner do not get a student profile.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from teachers where lower(email) = lower(new.email)) or exists (select 1 from admins where lower(email) = lower(new.email)) then return new; end if;
  insert into profiles (id, email, full_name) values (new.id, new.email, new.raw_user_meta_data ->> 'full_name') on conflict do nothing;
  return new;
end $$;
