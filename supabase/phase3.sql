-- Phase 3: admin panel. Run once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists admins (email text primary key);
alter table admins enable row level security;
create policy "admins read own row" on admins for select
  using (lower(email) = lower(auth.jwt() ->> 'email'));
insert into admins (email) values ('muhamad.hasnain11@gmail.com') on conflict do nothing;

create policy "admins add questions" on questions for insert
  with check (exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email')));
create policy "admins edit questions" on questions for update
  using (exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email')));
create policy "admins delete questions" on questions for delete
  using (exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email')));

-- Starter question bank (only added if the table is empty)
insert into questions (topic, question, options, correct_index, explanation)
select v.* from (values
 ('Stopping distances', 'What is the typical overall stopping distance at 30 mph?', '["12 metres (40 feet)","23 metres (75 feet)","36 metres (118 feet)","53 metres (175 feet)"]'::jsonb, 1, 'Thinking distance is 9 m and braking distance is 14 m, so about 23 m in total.'),
 ('Speed limits', 'What is the national speed limit for cars on a single carriageway road?', '["50 mph","70 mph","60 mph","40 mph"]'::jsonb, 2, 'Cars and motorcycles can do up to 60 mph on single carriageways unless a sign says otherwise.'),
 ('Crossings', 'You see zig-zag white lines before a pedestrian crossing. What must you not do?', '["Slow down","Park or overtake","Use your horn","Change gear"]'::jsonb, 1, 'Zig-zag lines keep the crossing clear and visible. No parking, and no overtaking the moving vehicle nearest the crossing.'),
 ('Vehicle safety', 'What is the legal minimum tyre tread depth for a car?', '["1.6 mm","2.5 mm","0.6 mm","3.0 mm"]'::jsonb, 0, 'The tread must be at least 1.6 mm across the central three-quarters of the tyre, around its whole circumference.'),
 ('Speed limits', 'What is the speed limit for cars on a dual carriageway?', '["60 mph","50 mph","80 mph","70 mph"]'::jsonb, 3, 'The national limit on dual carriageways and motorways is 70 mph for cars, unless signs show a lower limit.'),
 ('Stopping distances', 'In good, dry conditions, what is the minimum time gap to keep from the vehicle in front?', '["1 second","2 seconds","5 seconds","10 seconds"]'::jsonb, 1, 'Keep at least a two-second gap. Double it on wet roads and increase it much more on ice.'),
 ('Crossings', 'A pelican crossing has a flashing amber light. What should you do?', '["Stop and wait for green","Sound your horn","Give way to pedestrians already on the crossing","Speed up to clear it"]'::jsonb, 2, 'Flashing amber means you must give way to anyone on the crossing, but you can go if it is clear.'),
 ('Motorways', 'On a motorway, a red cross is shown above your lane. What does it mean?', '["Speed limit applies","Hard shoulder is open","No lorries allowed","Do not use that lane"]'::jsonb, 3, 'A red cross means the lane is closed. Do not drive in it. Move to another lane safely when you can.')
) as v(topic, question, options, correct_index, explanation)
where not exists (select 1 from questions);
