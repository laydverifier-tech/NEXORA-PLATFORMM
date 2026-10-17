-- (applied) nx_leaderboard gets a round range so "Day 1" (rounds 1-6) and "Day 2" (7-12) standings can be shown.
drop function if exists public.nx_leaderboard(uuid, text);
create or replace function public.nx_leaderboard(p_tournament uuid, p_stage text default null, p_round_min int default 1, p_round_max int default 99)
returns table(rank int, registration_id uuid, squad_name text, tag text, rounds_played int, booyahs int, kills int, points numeric)
language sql stable security definer set search_path = public, pg_temp as $$
  with t as (select placement_points, kill_points from public.tournaments where id = p_tournament and status::text in ('REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','FINISHED')),
  agg as (
    select r.registration_id, count(*)::int as rounds_played, (count(*) filter (where r.placement = 1))::int as booyahs, sum(r.kills)::int as kills,
           sum(coalesce(((select placement_points from t) ->> r.placement::text)::numeric, 0) + r.kills * (select kill_points from t)) as points
    from public.nx_results r
    where r.tournament_id = p_tournament and (p_stage is null or r.stage = p_stage) and r.round between p_round_min and p_round_max and exists (select 1 from t)
    group by r.registration_id)
  select (rank() over (order by a.points desc, a.booyahs desc, a.kills desc))::int, a.registration_id, s.squad_name, s.tag, a.rounds_played, a.booyahs, a.kills, a.points
  from agg a join public.squad_registrations s on s.id = a.registration_id order by 1, s.squad_name;
$$;
revoke all on function public.nx_leaderboard(uuid, text, int, int) from public;
grant execute on function public.nx_leaderboard(uuid, text, int, int) to anon, authenticated, service_role;
