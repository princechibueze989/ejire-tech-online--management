create table if not exists public.student_ai_class_schedule (
  id uuid primary key default gen_random_uuid(),
  class_name text not null check (char_length(btrim(class_name)) between 1 and 120),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint student_ai_class_schedule_valid_time check (end_time > start_time)
);

alter table public.student_ai_class_schedule enable row level security;

create policy "Authenticated users can read the student AI class schedule"
  on public.student_ai_class_schedule
  for select
  to authenticated
  using (true);

create policy "Instructors can add student AI class times"
  on public.student_ai_class_schedule
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'instructor'
    )
  );

create policy "Instructors can update student AI class times"
  on public.student_ai_class_schedule
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'instructor'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'instructor'
    )
  );

create policy "Instructors can delete student AI class times"
  on public.student_ai_class_schedule
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'instructor'
    )
  );

revoke all on public.student_ai_class_schedule from anon;
grant select, insert, update, delete on public.student_ai_class_schedule to authenticated;
