create table if not exists public.student_ai_rate_limits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

alter table public.student_ai_rate_limits enable row level security;

create or replace function public.consume_student_ai_request()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_count integer;
begin
  if current_user_id is null then
    return false;
  end if;

  insert into public.student_ai_rate_limits as current_limit (user_id, window_started_at, request_count)
  values (current_user_id, pg_catalog.now(), 1)
  on conflict (user_id) do update
    set window_started_at = case
          when current_limit.window_started_at <= pg_catalog.now() - interval '1 minute'
            then pg_catalog.now()
          else public.student_ai_rate_limits.window_started_at
        end,
        request_count = case
          when current_limit.window_started_at <= pg_catalog.now() - interval '1 minute'
            then 1
          else current_limit.request_count + 1
        end
  returning request_count into current_count;

  return current_count <= 12;
end;
$$;

revoke all on function public.consume_student_ai_request() from public, anon;
grant execute on function public.consume_student_ai_request() to authenticated;
