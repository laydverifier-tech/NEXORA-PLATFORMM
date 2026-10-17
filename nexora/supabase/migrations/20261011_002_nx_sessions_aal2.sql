-- admin_get_sessions (IP addresses of staff sessions) now also requires a 2-step-verified (aal2) session.
create or replace function public.admin_get_sessions(p_limit integer default 100)
returns table(profile_id uuid, username text, display_name text, role user_role, ip text, user_agent text, created_at timestamptz, updated_at timestamptz, not_after timestamptz)
language plpgsql security definer set search_path to 'public', 'auth', 'pg_temp' as $$
begin
  if not (is_ceo() or has_permission('manage_users') or has_permission('view_logs')) then raise exception 'Not authorized'; end if;
  if not public.nx_aal2() then raise exception 'Not authorized: 2-step verification required' using errcode = '42501'; end if;
  return query
  select p.id, p.username, p.display_name, p.role, s.ip::text, s.user_agent, s.created_at, s.updated_at, s.not_after
  from auth.sessions s join profiles p on p.id = s.user_id
  order by s.updated_at desc limit least(greatest(coalesce(p_limit,100),1),500);
end; $$;
revoke execute on function public.admin_get_sessions(integer) from anon, public;
grant execute on function public.admin_get_sessions(integer) to authenticated;
