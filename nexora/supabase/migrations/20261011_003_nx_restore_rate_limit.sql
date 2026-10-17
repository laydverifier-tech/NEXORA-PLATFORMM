-- Restores the Phase 3 limiter (service_role only, table public.rate_limits) after an accidental override. Already applied.
create or replace function public.nx_hit(p_key text, p_limit int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare h int;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when now() - r.window_start > make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when now() - r.window_start > make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into h;
  if random() < 0.02 then delete from public.rate_limits where window_start < now() - interval '1 day'; end if;
  return h <= p_limit;
end $$;
revoke all on function public.nx_hit(text,int,int) from public, anon, authenticated;
grant execute on function public.nx_hit(text,int,int) to service_role;
drop table if exists public.nx_rate_limits;
