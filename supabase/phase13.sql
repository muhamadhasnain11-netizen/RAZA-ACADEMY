-- Phase 13: lets a student join a live class (marks attendance). Run once in Supabase: SQL Editor > New query > paste > Run.
create or replace function join_session(sid bigint) returns void language plpgsql security definer set search_path = public as $$
declare s sessions%rowtype;
begin
  select * into s from sessions where id = sid;
  if not found or not in_class(s.class_id) then raise exception 'not allowed'; end if;
  if s.checked_in_at is null then raise exception 'class has not started'; end if;
  if s.checked_out_at is not null then raise exception 'class has ended'; end if;
  insert into attendance (session_id, student_id) values (sid, auth.uid()) on conflict do nothing;
end $$;
