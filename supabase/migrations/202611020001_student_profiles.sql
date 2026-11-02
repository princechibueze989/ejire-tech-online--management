create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'instructor', 'admin')),
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Students can read their own profile" on public.profiles;
create policy "Students can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;

create or replace function public.create_student_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'student', nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_student_profile_after_signup on auth.users;
create trigger create_student_profile_after_signup
  after insert on auth.users
  for each row execute procedure public.create_student_profile();
