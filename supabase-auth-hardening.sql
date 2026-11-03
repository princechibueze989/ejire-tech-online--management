-- Run this once in the Supabase SQL Editor for the project used by the site.
-- Public signup always creates a student profile; user_metadata is never a role source.

create or replace function public.ejire_strip_untrusted_signup_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
	new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'role';
	return new;
end;
$function$;

drop trigger if exists ejire_strip_untrusted_signup_role on auth.users;
create trigger ejire_strip_untrusted_signup_role
before insert on auth.users
for each row execute function public.ejire_strip_untrusted_signup_role();

create or replace function public.ejire_create_student_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
	insert into public.profiles (id, full_name, role)
	values (
		new.id,
		coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Student'),
		'student'
	)
	on conflict (id) do update
	set
		full_name = excluded.full_name,
		role = 'student';
	return new;
end;
$function$;

drop trigger if exists zzzzzzzz_ejire_create_student_profile on auth.users;
create trigger zzzzzzzz_ejire_create_student_profile
after insert on auth.users
for each row execute function public.ejire_create_student_profile();

create or replace function public.ejire_protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
	if tg_op = 'INSERT' then
		new.role := 'student';
	elsif auth.role() in ('anon', 'authenticated') then
		new.role := old.role;
	end if;
	return new;
end;
$function$;

drop trigger if exists ejire_protect_profile_role on public.profiles;
create trigger ejire_protect_profile_role
before insert or update on public.profiles
for each row execute function public.ejire_protect_profile_role();

-- Private avatars are scoped to a user's own folder and served with signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-avatars', 'student-avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Students can view their own avatar files" on storage.objects;
create policy "Students can view their own avatar files"
on storage.objects for select to authenticated
using (bucket_id = 'student-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Students can upload their own avatar files" on storage.objects;
create policy "Students can upload their own avatar files"
on storage.objects for insert to authenticated
with check (bucket_id = 'student-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Students can update their own avatar files" on storage.objects;
create policy "Students can update their own avatar files"
on storage.objects for update to authenticated
using (bucket_id = 'student-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'student-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Students can delete their own avatar files" on storage.objects;
create policy "Students can delete their own avatar files"
on storage.objects for delete to authenticated
using (bucket_id = 'student-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Restrict student avatar access to owner" on storage.objects;
create policy "Restrict student avatar access to owner"
on storage.objects as restrictive for all to public
using (bucket_id <> 'student-avatars' or (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id <> 'student-avatars' or (storage.foldername(name))[1] = (select auth.uid()::text));
