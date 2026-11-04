-- Run in the Supabase SQL Editor to enable authenticated self/admin profile reads.
-- The dashboard UI role check is not a substitute for these database policies.
-- The admin allowlist is email-only; passwords are verified by Supabase Auth, never by this SQL.

create or replace function public.ejire_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
	select exists (
		select 1
		from auth.users as auth_user
		where auth_user.id = (select auth.uid())
			and lower(auth_user.email) = 'dosusamson27@gmail.com'
			and auth_user.email_confirmed_at is not null
	);
$function$;

revoke all on function public.ejire_is_admin() from public;
grant execute on function public.ejire_is_admin() to authenticated;

-- Older versions of this dashboard migration tried changing profiles.role.
-- Drop that optional promotion trigger; admin access is based on verified Auth identity.
drop trigger if exists zzzzzzzzzz_ejire_assign_allowlisted_admin on auth.users;
drop function if exists public.ejire_assign_allowlisted_admin();

alter table public.profiles enable row level security;

drop policy if exists "Ejire users can read their own profile" on public.profiles;
create policy "Ejire users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

drop policy if exists "Ejire admins can read profiles" on public.profiles;
create policy "Ejire admins can read profiles"
on public.profiles for select to authenticated
using ((select public.ejire_is_admin()));

drop policy if exists "Ejire restrict profile reads to owner or admin" on public.profiles;
create policy "Ejire restrict profile reads to owner or admin"
on public.profiles as restrictive for select to authenticated
using (id = (select auth.uid()) or (select public.ejire_is_admin()));
