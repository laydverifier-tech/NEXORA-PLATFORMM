-- NEXORA admin + security hardening (additive). Applied after 20261009_001.
-- 1) MFA (TOTP) enforced AT THE DATABASE: privileged users need an aal2 session to write/read sensitive data.
-- 2) (rate limiter lives in Phase 3). 3) Analytics columns + admin RPCs. 4) Close exposed RPCs / forged audit logs.

create or replace function public.nx_aal2() returns boolean
language sql stable set search_path = '' as $$ select coalesce(auth.jwt() ->> 'aal', '') = 'aal2' $$;

create or replace function public.nx_is_privileged() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role::text in ('CEO','ADMIN','ORGANIZER') from public.profiles where id = auth.uid()), false)
      or exists (select 1 from public.role_permissions where profile_id = auth.uid())
$$;
revoke all on function public.nx_is_privileged() from public, anon;
grant execute on function public.nx_is_privileged() to authenticated;

-- RESTRICTIVE policies: AND-ed with every existing policy. Normal users are untouched (not privileged).
do $$
declare
  spec jsonb := '{
    "tournaments":["insert","update","delete"],"prizes":["insert","update","delete"],"matches":["insert","update","delete"],
    "news":["insert","update","delete"],"sponsors":["insert","update","delete"],"site_settings":["insert","update","delete"],
    "tournament_sponsors":["insert","update","delete"],"announcements":["insert","update","delete"],
    "roster_members":["insert","update","delete"],"media_items":["insert","update","delete"],"hall_of_fame":["insert","update","delete"],"giveaways":["insert","update","delete"],
    "contact_messages":["select","update"],"analytics_events":["select"],"activity_logs":["select"],
    "profiles":["update","delete"],"role_permissions":["insert","update","delete"],"permissions":["insert","update","delete"],
    "payments":["update","delete"],"transactions":["insert","update","delete"],
    "squad_registrations":["update","delete"],"tournament_registrations":["update","delete"]
  }'::jsonb;
  t text; c text; cond text := '(public.nx_aal2() or not public.nx_is_privileged())';
begin
  for t in select jsonb_object_keys(spec) loop
    for c in select jsonb_array_elements_text(spec -> t) loop
      execute format('drop policy if exists %I on public.%I', 'nx aal2 ' || c, t);
      if c = 'insert' then
        execute format('create policy %I on public.%I as restrictive for insert to authenticated with check %s', 'nx aal2 ' || c, t, cond);
      elsif c = 'update' then
        execute format('create policy %I on public.%I as restrictive for update to authenticated using %s with check %s', 'nx aal2 ' || c, t, cond, cond);
      else
        execute format('create policy %I on public.%I as restrictive for %s to authenticated using %s', 'nx aal2 ' || c, t, c, cond);
      end if;
    end loop;
  end loop;
end $$;

-- storage: staff uploads to the admin buckets also need aal2
drop policy if exists "nx aal2 storage write" on storage.objects;
create policy "nx aal2 storage write" on storage.objects as restrictive for all to authenticated
  using (bucket_id not in ('roster','media','giveaway-assets') or public.nx_aal2() or not public.nx_is_privileged())
  with check (bucket_id not in ('roster','media','giveaway-assets') or public.nx_aal2() or not public.nx_is_privileged());

-- forged audit logs: an authenticated user may only log AS HIMSELF
drop policy if exists "activity_logs_insert_any_authenticated" on public.activity_logs;
drop policy if exists "nx activity insert self" on public.activity_logs;
create policy "nx activity insert self" on public.activity_logs for insert to authenticated with check (actor_id = auth.uid());

-- (rate limiter: the Phase 3 limiter public.nx_hit / public.rate_limits is the one in use — see 20261011_003)

-- analytics: privacy-friendly dimensions (no raw IP is ever stored: only a salted hash)
alter table public.analytics_events add column if not exists device text check (device is null or device in ('mobile','tablet','desktop','bot'));
alter table public.analytics_events add column if not exists referrer_host text check (referrer_host is null or char_length(referrer_host) <= 100);
alter table public.analytics_events add column if not exists country text check (country is null or country ~ '^[A-Z]{2}$');

create or replace function public.nx_admin_analytics(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare d int := least(greatest(coalesce(p_days, 30), 1), 365); since timestamptz; r jsonb;
begin
  if not (public.nx_aal2() and (public.is_admin_or_ceo() or public.has_permission('view_logs'))) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  since := now() - make_interval(days => d);
  select jsonb_build_object(
    'days', d,
    'totals', jsonb_build_object(
      'views', (select count(*) from public.analytics_events where event_type = 'page_view' and created_at >= since),
      'visitors', (select count(distinct ip_hash) from public.analytics_events where event_type = 'page_view' and created_at >= since),
      'tournament_views', (select count(*) from public.analytics_events where event_type = 'tournament_view' and created_at >= since),
      'giveaway_views', (select count(*) from public.analytics_events where event_type = 'giveaway_view' and created_at >= since),
      'sponsor_clicks', (select count(*) from public.analytics_events where event_type = 'sponsor_click' and created_at >= since),
      'media_views', (select count(*) from public.analytics_events where event_type = 'media_view' and created_at >= since)),
    'daily', coalesce((select jsonb_agg(x order by x.day) from (select created_at::date as day, count(*) filter (where event_type = 'page_view') as views, count(distinct ip_hash) filter (where event_type = 'page_view') as visitors from public.analytics_events where created_at >= since group by 1) x), '[]'::jsonb),
    'top_pages', coalesce((select jsonb_agg(x) from (select path, count(*) as views from public.analytics_events where event_type = 'page_view' and created_at >= since and path is not null group by path order by views desc limit 10) x), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(x) from (select coalesce(device,'unknown') as name, count(*) as n from public.analytics_events where event_type = 'page_view' and created_at >= since group by 1 order by n desc) x), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(x) from (select coalesce(country,'??') as name, count(*) as n from public.analytics_events where event_type = 'page_view' and created_at >= since group by 1 order by n desc limit 10) x), '[]'::jsonb),
    'referrers', coalesce((select jsonb_agg(x) from (select referrer_host as name, count(*) as n from public.analytics_events where event_type = 'page_view' and created_at >= since and referrer_host is not null group by 1 order by n desc limit 10) x), '[]'::jsonb)
  ) into r;
  return r;
end $$;

create or replace function public.nx_admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.nx_aal2() and (public.is_admin_or_ceo() or public.has_permission('view_logs'))) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'unread_messages', (select count(*) from public.contact_messages where not is_read),
    'messages', (select count(*) from public.contact_messages),
    'roster', (select count(*) from public.roster_members),
    'tournaments', (select count(*) from public.tournaments),
    'news', (select count(*) from public.news),
    'users', (select count(*) from public.profiles),
    'registrations', (select count(*) from public.squad_registrations) + (select count(*) from public.tournament_registrations),
    'giveaways', (select count(*) from public.giveaways));
end $$;
revoke all on function public.nx_admin_analytics(int), public.nx_admin_overview() from public, anon;
grant execute on function public.nx_admin_analytics(int), public.nx_admin_overview() to authenticated;

-- Close anon access to admin-only RPCs (they also check authorization internally: defence in depth).
-- is_ceo()/has_permission()/is_admin_or_ceo()/owns_tournament()/is_team_captain() stay executable: public RLS policies call them.
revoke execute on function public.admin_get_sessions(integer), public.approve_squad_registration(uuid), public.generate_next_round(uuid),
  public.reject_squad_registration(uuid, text), public.submit_br_game_results(uuid, jsonb),
  public.submit_match_result(uuid, numeric, numeric, numeric, numeric, uuid, uuid) from anon, public;
grant execute on function public.admin_get_sessions(integer), public.approve_squad_registration(uuid), public.generate_next_round(uuid),
  public.reject_squad_registration(uuid, text), public.submit_br_game_results(uuid, jsonb),
  public.submit_match_result(uuid, numeric, numeric, numeric, numeric, uuid, uuid) to authenticated;
